from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import get_current_user
from ..database import get_db

router = APIRouter(prefix="/expenses", tags=["Expenses"])

MONTH_PATTERN = r"^\d{4}-(0[1-9]|1[0-2])$"


def month_range(month: str) -> tuple[date, date]:
    year, mon = (int(part) for part in month.split("-"))
    start = date(year, mon, 1)
    end = date(year + 1, 1, 1) if mon == 12 else date(year, mon + 1, 1)
    return start, end


def get_owned_expense(db: Session, expense_id: int, user_id: int) -> models.Expense:
    expense = (
        db.query(models.Expense)
        .filter(models.Expense.id == expense_id, models.Expense.user_id == user_id)
        .first()
    )
    if expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@router.post("/", response_model=schemas.ExpenseOut, status_code=201)
def create_expense(
    data: schemas.ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    expense = models.Expense(**data.model_dump(), user_id=current_user.id)
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.get("/", response_model=list[schemas.ExpenseOut])
def list_expenses(
    category: str | None = None,
    month: str | None = Query(default=None, pattern=MONTH_PATTERN),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Expense).filter(models.Expense.user_id == current_user.id)

    if category:
        query = query.filter(
            func.lower(models.Expense.category) == category.strip().lower()
        )
    if month:
        start, end = month_range(month)
        query = query.filter(
            models.Expense.expense_date >= start, models.Expense.expense_date < end
        )

    return (
        query.order_by(models.Expense.expense_date.desc(), models.Expense.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


# NOTE: /categories and /summary must stay above /{expense_id},
# otherwise FastAPI would try to read the word "summary" as an expense id.
@router.get("/categories", response_model=list[str])
def list_categories(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    rows = (
        db.query(models.Expense.category)
        .filter(models.Expense.user_id == current_user.id)
        .distinct()
        .order_by(models.Expense.category)
        .all()
    )
    return [row[0] for row in rows]


@router.get("/summary", response_model=schemas.ExpenseSummary)
def summary(
    month: str | None = Query(default=None, pattern=MONTH_PATTERN),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    month = month or date.today().strftime("%Y-%m")
    start, end = month_range(month)

    total_amount = func.sum(models.Expense.amount)
    rows = (
        db.query(models.Expense.category, total_amount, func.count(models.Expense.id))
        .filter(
            models.Expense.user_id == current_user.id,
            models.Expense.expense_date >= start,
            models.Expense.expense_date < end,
        )
        .group_by(models.Expense.category)
        .order_by(total_amount.desc())
        .all()
    )

    by_category = [
        schemas.CategoryTotal(category=cat, total=round(total, 2), count=count)
        for cat, total, count in rows
    ]
    return schemas.ExpenseSummary(
        month=month,
        total=round(sum(item.total for item in by_category), 2),
        count=sum(item.count for item in by_category),
        by_category=by_category,
    )


@router.get("/{expense_id}", response_model=schemas.ExpenseOut)
def get_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return get_owned_expense(db, expense_id, current_user.id)


@router.patch("/{expense_id}", response_model=schemas.ExpenseOut)
def update_expense(
    expense_id: int,
    data: schemas.ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    expense = get_owned_expense(db, expense_id, current_user.id)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(expense, key, value)
    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/{expense_id}", status_code=204)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    expense = get_owned_expense(db, expense_id, current_user.id)
    db.delete(expense)
    db.commit()
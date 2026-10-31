from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/expenses", tags=["Expenses"])


@router.post("/", response_model=schemas.ExpenseOut, status_code=201)
def create_expense(data: schemas.ExpenseCreate, db: Session = Depends(get_db)):
    expense = models.Expense(**data.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.get("/", response_model=list[schemas.ExpenseOut])
def list_expenses(db: Session = Depends(get_db)):
    return (
        db.query(models.Expense)
        .order_by(models.Expense.expense_date.desc())
        .all()
    )


@router.get("/{expense_id}", response_model=schemas.ExpenseOut)
def get_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.get(models.Expense, expense_id)
    if expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@router.patch("/{expense_id}", response_model=schemas.ExpenseOut)
def update_expense(
    expense_id: int, data: schemas.ExpenseUpdate, db: Session = Depends(get_db)
):
    expense = db.get(models.Expense, expense_id)
    if expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(expense, key, value)
    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/{expense_id}", status_code=204)
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.get(models.Expense, expense_id)
    if expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()
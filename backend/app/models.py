from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, Float, String
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(100))
    amount: Mapped[float] = mapped_column(Float)
    category: Mapped[str] = mapped_column(String(50))
    expense_date: Mapped[date] = mapped_column(Date, default=date.today)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
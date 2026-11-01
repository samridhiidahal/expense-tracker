from datetime import date

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=64)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ExpenseCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    title: str = Field(min_length=1, max_length=100)
    amount: float = Field(gt=0)
    category: str = Field(min_length=1, max_length=50)
    expense_date: date

    @field_validator("category")
    @classmethod
    def normalize_category(cls, value: str) -> str:
        return value.title()


class ExpenseUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    title: str | None = Field(default=None, min_length=1, max_length=100)
    amount: float | None = Field(default=None, gt=0)
    category: str | None = Field(default=None, min_length=1, max_length=50)
    expense_date: date | None = None

    @field_validator("category")
    @classmethod
    def normalize_category(cls, value: str | None) -> str | None:
        return value.title() if value else value


class ExpenseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    amount: float
    category: str
    expense_date: date


class CategoryTotal(BaseModel):
    category: str
    total: float
    count: int


class ExpenseSummary(BaseModel):
    month: str
    total: float
    count: int
    by_category: list[CategoryTotal]
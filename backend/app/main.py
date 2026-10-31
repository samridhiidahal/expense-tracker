from fastapi import FastAPI

from . import models
from .database import Base, engine
from .routes import auth as auth_routes
from .routes import expenses

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Expense Tracker API")
app.include_router(auth_routes.router)
app.include_router(expenses.router)


@app.get("/")
def root():
    return {"message": "Expense Tracker API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}
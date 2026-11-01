import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .database import Base, engine
from .routes import auth as auth_routes
from .routes import expenses

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Expense Tracker API")

origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
extra_origin = os.getenv("FRONTEND_URL")
if extra_origin:
    origins.append(extra_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(expenses.router)


@app.get("/")
def root():
    return {"message": "Expense Tracker API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}
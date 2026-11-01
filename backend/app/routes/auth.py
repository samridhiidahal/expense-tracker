from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from .. import auth, models, schemas
from ..database import get_db

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/signup", response_model=schemas.UserOut, status_code=201)
def signup(data: schemas.UserCreate, db: Session = Depends(get_db)):
    email = data.email.lower()
    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = models.User(email=email, hashed_password=auth.hash_password(data.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=schemas.Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    email = form_data.username.lower()
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None or not auth.verify_password(
        form_data.password, user.hashed_password
    ):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {"access_token": auth.create_access_token(user.id), "token_type": "bearer"}


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user
    
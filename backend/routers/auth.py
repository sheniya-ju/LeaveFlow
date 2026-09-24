from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from database import SessionLocal
from models import User, LeaveBalance
from schemas import UserRegister, UserResponse, UserLogin
from utils.security import hash_password, verify_password, create_access_token

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.post(
    "/register",
    response_model=UserResponse
)
def register(
    user: UserRegister,
    db: Session = Depends(get_db)
):

    existing_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    hashed_password = hash_password(
        user.password
    )

    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed_password,
        role="employee"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create default leave balances
    current_year = datetime.now().year

    leave_types = {
        "Casual": 12,
        "Sick": 10,
        "Earned": 15
    }

    for leave_type, total_days in leave_types.items():

        balance = LeaveBalance(
            user_id=new_user.id,
            leave_type=leave_type,
            total_days=total_days,
            used_days=0,
            remaining_days=total_days,
            year=current_year
        )

        db.add(balance)

    db.commit()

    return new_user
@router.post("/login")
def login(
    user: UserLogin,
    db: Session = Depends(get_db)
):

    existing_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        user.password,
        existing_user.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not existing_user.is_active:
        raise HTTPException(
            status_code=403,
            detail="User account is inactive.Contact Admin For More Info."
        )

    access_token = create_access_token({
        "user_id": existing_user.id,
        "role": existing_user.role
    })

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": existing_user.id,
            "name": existing_user.name,
            "email": existing_user.email,
            "role": existing_user.role
        }
    }
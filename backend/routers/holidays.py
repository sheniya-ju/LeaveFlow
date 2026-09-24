from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import SessionLocal
from models import User, Holiday
from utils.dependencies import get_current_user


router = APIRouter(
    prefix="/holidays",
    tags=["Holidays"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.get("/")
def get_holidays(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user.role not in ["employee", "manager", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="You are not allowed to view holidays"
        )

    holidays = (
        db.query(Holiday)
        .order_by(Holiday.date)
        .all()
    )

    return [
        {
            "id": holiday.id,
            "name": holiday.name,
            "date": holiday.date
        }
        for holiday in holidays
    ]
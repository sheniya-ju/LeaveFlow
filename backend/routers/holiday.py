from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date

from database import SessionLocal
from models import User, Holiday
from utils.dependencies import get_current_user


router = APIRouter(
    prefix="/admin/holidays",
    tags=["Admin - Holidays"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()

@router.get("/view")
def view_holidays(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    holidays = db.query(Holiday).order_by(Holiday.date).all()

    return [
        {
            "id": holiday.id,
            "name": holiday.name,
            "date": holiday.date,
            "created_at": holiday.created_at
        }
        for holiday in holidays
    ]


# GET ALL HOLIDAYS


@router.get("/")
def get_holidays(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can manage holidays"
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
            "date": holiday.date,
            "created_at": holiday.created_at
        }
        for holiday in holidays
    ]



# ADD HOLIDAY


@router.post("/")
def add_holiday(
    name: str,
    holiday_date: date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can add holidays"
        )

    existing_holiday = (
        db.query(Holiday)
        .filter(Holiday.date == holiday_date)
        .first()
    )

    if existing_holiday:
        raise HTTPException(
            status_code=400,
            detail="A holiday already exists on this date"
        )

    new_holiday = Holiday(
        name=name,
        date=holiday_date
    )

    db.add(new_holiday)
    db.commit()
    db.refresh(new_holiday)

    return {
        "message": "Holiday added successfully",
        "holiday": {
            "id": new_holiday.id,
            "name": new_holiday.name,
            "date": new_holiday.date
        }
    }



# DELETE HOLIDAY


@router.delete("/{holiday_id}")
def delete_holiday(
    holiday_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can delete holidays"
        )

    holiday = (
        db.query(Holiday)
        .filter(Holiday.id == holiday_id)
        .first()
    )

    if not holiday:
        raise HTTPException(
            status_code=404,
            detail="Holiday not found"
        )

    db.delete(holiday)
    db.commit()

    return {
        "message": "Holiday deleted successfully"
    }

from datetime import datetime, timedelta,date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import SessionLocal
from models import User, LeaveBalance, LeaveRequest,Holiday
from utils.dependencies import get_current_user


router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)



# DATABASE

def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()



# GET ALL USERS
# EMPLOYEES + MANAGERS


@router.get("/employees")
def get_all_employees(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can access employee management"
        )


    users = (
        db.query(User)
        .filter(
            User.role.in_(["employee", "manager"])
        )
        .order_by(
            User.name
        )
        .all()
    )


    return [

        {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "created_at": user.created_at
        }

        for user in users

    ]



# GET USER DETAILS
# EMPLOYEE OR MANAGER


@router.get("/employee/{user_id}")
def get_user_details(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can view user details"
        )


    user = (
        db.query(User)
        .filter(
            User.id == user_id,
            User.role.in_(["employee", "manager"])
        )
        .first()
    )


    if not user:
        raise HTTPException(
            status_code=404,
            detail="Employee or manager not found"
        )


    return {

        "id": user.id,

        "name": user.name,

        "email": user.email,

        "role": user.role,

        "is_active": user.is_active,

        "created_at": user.created_at

    }



# USER LEAVE OVERVIEW
# MONTH / YEAR


@router.get("/employee/{user_id}/leave-overview")
def get_user_leave_overview(
    user_id: int,
    view: str = "month",
    month: int | None = None,
    year: int | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can view leave overview"
        )


   
    # FIND USER
  

    user = (
        db.query(User)
        .filter(
            User.id == user_id,
            User.role.in_(["employee", "manager"])
        )
        .first()
    )


    if not user:
        raise HTTPException(
            status_code=404,
            detail="Employee or manager not found"
        )


    
    # VALIDATE VIEW
 

    if view not in ["month", "year"]:

        raise HTTPException(
            status_code=400,
            detail="View must be month or year"
        )


    
    # DEFAULT YEAR
    

    if year is None:
        year = datetime.now().year


    if year < 2000 or year > 2100:

        raise HTTPException(
            status_code=400,
            detail="Invalid year"
        )


   
    # MONTH VIEW
    

    if view == "month":

        if month is None:
            month = datetime.now().month


        if month < 1 or month > 12:

            raise HTTPException(
                status_code=400,
                detail="Month must be between 1 and 12"
            )


        start_date = datetime(
            year,
            month,
            1
        ).date()


        if month == 12:

            end_date = datetime(
                year + 1,
                1,
                1
            ).date() - timedelta(days=1)

        else:

            end_date = datetime(
                year,
                month + 1,
                1
            ).date() - timedelta(days=1)


    
    # YEAR VIEW
    

    else:

        start_date = datetime(
            year,
            1,
            1
        ).date()


        end_date = datetime(
            year,
            12,
            31
        ).date()


    
    # GET LEAVES
    

    leaves = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.user_id == user_id
        )
        .order_by(
            LeaveRequest.start_date
        )
        .all()
    )


    
    # STATISTICS
    

    filtered_leaves = []

    approved_days = 0
    pending_days = 0
    rejected_days = 0
    cancelled_days = 0


    for leave in leaves:

        

        if (
            leave.end_date < start_date
            or leave.start_date > end_date
        ):
            continue


        
        # CALCULATE OVERLAPPING DAYS
        

        overlap_start = max(
            leave.start_date,
            start_date
        )


        overlap_end = min(
            leave.end_date,
            end_date
        )


        days_in_period = (
            overlap_end - overlap_start
        ).days + 1


       
        # ADD LEAVE
       

        filtered_leaves.append({

            "id": leave.id,

            "leave_type": leave.leave_type,

            "start_date": leave.start_date,

            "end_date": leave.end_date,

            "days": leave.days,

            "days_in_period": days_in_period,

            "reason": leave.reason,

            "status": leave.status

        })


        
        # STATUS TOTALS
        

        if leave.status == "approved":

            approved_days += days_in_period

        elif leave.status == "pending":

            pending_days += days_in_period

        elif leave.status == "rejected":

            rejected_days += days_in_period

        elif leave.status == "cancelled":

            cancelled_days += days_in_period


    
    # TOTAL
    

    total_leave_days = (
        approved_days
        + pending_days
        + rejected_days
        + cancelled_days
    )


    
    # RESPONSE
    

    return {

        "user": {

            "id": user.id,

            "name": user.name,

            "email": user.email,

            "role": user.role,

            "is_active": user.is_active

        },

        "view": view,

        "year": year,

        "month": (
            month
            if view == "month"
            else None
        ),

        "start_date": start_date,

        "end_date": end_date,

        "summary": {

            "total_leave_days":
                total_leave_days,

            "approved_days":
                approved_days,

            "pending_days":
                pending_days,

            "rejected_days":
                rejected_days,

            "cancelled_days":
                cancelled_days

        },

        "leave_requests":
            filtered_leaves

    }



# COMPLETE LEAVE HISTORY


@router.get("/employee/{user_id}/leave-history")
def get_user_leave_history(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can view leave history"
        )


    
    # FIND USER
    

    user = (
        db.query(User)
        .filter(
            User.id == user_id,
            User.role.in_(["employee", "manager"])
        )
        .first()
    )


    if not user:
        raise HTTPException(
            status_code=404,
            detail="Employee or manager not found"
        )


    
    # GET ALL LEAVES
    

    leaves = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.user_id == user_id
        )
        .order_by(
            LeaveRequest.start_date.desc()
        )
        .all()
    )


    return [

        {

            "id": leave.id,

            "leave_type":
                leave.leave_type,

            "start_date":
                leave.start_date,

            "end_date":
                leave.end_date,

            "days":
                leave.days,

            "reason":
                leave.reason,

            "status":
                leave.status,

            "created_at":
                leave.created_at

        }

        for leave in leaves

    ]



# GET LEAVE BALANCES
# EMPLOYEE OR MANAGER


@router.get("/employee/{user_id}/balances")
def get_user_leave_balances(
    user_id: int,
    year: int | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can view leave balances"
        )


    
    # FIND USER
    

    user = (
        db.query(User)
        .filter(
            User.id == user_id,
            User.role.in_(["employee", "manager"])
        )
        .first()
    )


    if not user:
        raise HTTPException(
            status_code=404,
            detail="Employee or manager not found"
        )


    
    # DEFAULT YEAR
    

    if year is None:
        year = datetime.now().year


    
    # GET BALANCES
    

    balances = (
        db.query(LeaveBalance)
        .filter(
            LeaveBalance.user_id == user_id,
            LeaveBalance.year == year
        )
        .order_by(
            LeaveBalance.leave_type
        )
        .all()
    )


    return [

        {

            "id":
                balance.id,

            "leave_type":
                balance.leave_type,

            "total_days":
                balance.total_days,

            "used_days":
                balance.used_days,

            "remaining_days":
                balance.remaining_days,

            "year":
                balance.year

        }

        for balance in balances

    ]



# ==========================================
# UPDATE EMPLOYEE / MANAGER STATUS
# ==========================================

@router.put("/employee/{user_id}/status")
def update_user_status(
    user_id: int,
    is_active: bool,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can update user status"
        )

    user = (
        db.query(User)
        .filter(
            User.id == user_id,
            User.role.in_(["employee", "manager"])
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Employee or manager not found"
        )

    user.is_active = is_active

    db.commit()
    db.refresh(user)

    return {
        "message": "User status updated successfully",
        "user_id": user.id,
        "is_active": user.is_active
    }



# UPDATE LEAVE BALANCE


@router.put("/employees/{employee_id}/leave-balance")
def update_leave_balance(
    employee_id: int,
    leave_type: str,
    total_days: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can update leave balances"
        )


    employee = (
        db.query(User)
        .filter(
            User.id == employee_id,
            User.role == "employee"
        )
        .first()
    )


    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )


    if total_days < 0:

        raise HTTPException(
            status_code=400,
            detail="Total leave days cannot be negative"
        )


    current_year =datetime.now().year


    balance = (
        db.query(LeaveBalance)
        .filter(
            LeaveBalance.user_id == employee_id,
            LeaveBalance.leave_type == leave_type,
            LeaveBalance.year == current_year
        )
        .first()
    )


    if not balance:

        raise HTTPException(
            status_code=404,
            detail="Leave balance not found"
        )


    if total_days < balance.used_days:

        raise HTTPException(
            status_code=400,
            detail=(
                "Total days cannot be less "
                "than already used days"
            )
        )


    balance.total_days = total_days

    balance.remaining_days = (
        total_days - balance.used_days
    )


    db.commit()

    db.refresh(balance)


    return {

        "message":
            "Leave balance updated successfully",

        "employee_id":
            employee_id,

        "leave_type":
            balance.leave_type,

        "total_days":
            balance.total_days,

        "used_days":
            balance.used_days,

        "remaining_days":
            balance.remaining_days

    }

# HOLIDAY MANAGEMENT


@router.get("/holidays")
def get_holidays(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can access holidays"
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


@router.post("/holidays")
def create_holiday(
    name: str,
    date: date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can create holidays"
        )

    existing_holiday = (
        db.query(Holiday)
        .filter(Holiday.date == date)
        .first()
    )

    if existing_holiday:
        raise HTTPException(
            status_code=400,
            detail="A holiday already exists on this date"
        )

    new_holiday = Holiday(
        name=name,
        date=date
    )

    db.add(new_holiday)
    db.commit()
    db.refresh(new_holiday)

    return {
        "message": "Holiday created successfully",
        "holiday": {
            "id": new_holiday.id,
            "name": new_holiday.name,
            "date": new_holiday.date
        }
    }


@router.delete("/holidays/{holiday_id}")
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
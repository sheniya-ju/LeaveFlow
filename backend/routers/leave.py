from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import SessionLocal
from models import User, LeaveRequest, LeaveBalance
from schemas import LeaveCreate, LeaveResponse
from utils.dependencies import get_current_user
from utils.email import send_email


router = APIRouter(
    prefix="/leave",
    tags=["Leave Management"]
)


# ==========================================
# DATABASE DEPENDENCY
# ==========================================

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# ==========================================
# APPLY LEAVE
# ==========================================

@router.post(
    "/",
    response_model=LeaveResponse
)
def apply_leave(
    leave: LeaveCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Only employees can apply for leave
    if current_user.role != "employee":
        raise HTTPException(
            status_code=403,
            detail="Only employees can apply for leave"
        )

    # ==========================================
    # VALIDATE DATES
    # ==========================================

    if leave.end_date < leave.start_date:
        raise HTTPException(
            status_code=400,
            detail="End date cannot be before start date"
        )

    # ==========================================
    # CALCULATE NUMBER OF LEAVE DAYS
    # ==========================================

    leave_days = (
        leave.end_date - leave.start_date
    ).days + 1

    # ==========================================
    # CHECK FOR OVERLAPPING LEAVE REQUESTS
    # ==========================================

    overlapping_leave = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.user_id == current_user.id,
            LeaveRequest.status.in_(
                ["pending", "approved"]
            ),
            LeaveRequest.start_date <= leave.end_date,
            LeaveRequest.end_date >= leave.start_date
        )
        .first()
    )

    if overlapping_leave:
        raise HTTPException(
            status_code=400,
            detail="You already have a leave request for these dates"
        )

    # ==========================================
    # GET CURRENT YEAR'S LEAVE BALANCE
    # ==========================================

    current_year = datetime.now().year

    balance = (
        db.query(LeaveBalance)
        .filter(
            LeaveBalance.user_id == current_user.id,
            LeaveBalance.leave_type == leave.leave_type,
            LeaveBalance.year == current_year
        )
        .first()
    )

    # ==========================================
    # CHECK WHETHER LEAVE TYPE EXISTS
    # ==========================================

    if not balance:
        raise HTTPException(
            status_code=400,
            detail="Leave balance not found for this leave type"
        )

    # ==========================================
    # CHECK LEAVE BALANCE
    # ==========================================

    if balance.remaining_days < leave_days:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Insufficient leave balance. "
                f"Remaining {leave.leave_type} leave: "
                f"{balance.remaining_days} days"
            )
        )

    # ==========================================
    # CREATE LEAVE REQUEST
    # ==========================================

    new_leave = LeaveRequest(
        user_id=current_user.id,
        leave_type=leave.leave_type,
        start_date=leave.start_date,
        end_date=leave.end_date,
        days=leave_days,
        reason=leave.reason,
        status="pending"
    )

    db.add(new_leave)
    db.commit()
    db.refresh(new_leave)

    # ==========================================
    # SEND EMAIL NOTIFICATION TO MANAGER
    # ==========================================

    manager = (
        db.query(User)
        .filter(
            User.role == "manager",
            User.is_active == True
        )
        .first()
    )

    if manager:

        subject = "New Leave Request - LeaveFlow"

        body = f"""
Hello {manager.name},

A new leave request has been submitted in LeaveFlow.

Employee Details
----------------
Name: {current_user.name}
Email: {current_user.email}

Leave Details
-------------
Leave Type: {new_leave.leave_type}
Start Date: {new_leave.start_date}
End Date: {new_leave.end_date}
Number of Days: {new_leave.days}

Reason:
{new_leave.reason}

Status: Pending

Please log in to LeaveFlow to review this request.

Regards,
LeaveFlow
Employee Leave Management System
"""

        try:

            send_email(
                recipient_email=manager.email,
                subject=subject,
                body=body
            )

            print(
                f"Leave notification sent to manager: "
                f"{manager.email}"
            )

        except Exception as error:

            print(
                "Email notification failed:",
                error
            )

    return new_leave


# ==========================================
# INITIALIZE LEAVE BALANCE
# ==========================================

@router.post("/initialize-balance")
def initialize_balance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    current_year = datetime.now().year

    existing_balances = (
        db.query(LeaveBalance)
        .filter(
            LeaveBalance.user_id == current_user.id,
            LeaveBalance.year == current_year
        )
        .all()
    )

    if existing_balances:
        raise HTTPException(
            status_code=400,
            detail="Leave balance already initialized"
        )

    leave_types = {
        "Casual": 12,
        "Sick": 10,
        "Earned": 15
    }

    for leave_type, total_days in leave_types.items():

        balance = LeaveBalance(
            user_id=current_user.id,
            leave_type=leave_type,
            total_days=total_days,
            used_days=0,
            remaining_days=total_days,
            year=current_year
        )

        db.add(balance)

    db.commit()

    return {
        "message": "Leave balance initialized successfully",
        "year": current_year
    }


# ==========================================
# GET MY LEAVES
# ==========================================

@router.get(
    "/",
    response_model=list[LeaveResponse]
)
def get_my_leaves(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    leaves = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.user_id == current_user.id
        )
        .order_by(
            LeaveRequest.created_at.desc()
        )
        .all()
    )

    return leaves


# ==========================================
# LEAVE HISTORY
# ==========================================

@router.get("/history")
def get_leave_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    leaves = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.user_id == current_user.id
        )
        .order_by(
            LeaveRequest.created_at.desc()
        )
        .all()
    )

    return [
        {
            "id": leave.id,
            "leave_type": leave.leave_type,
            "start_date": leave.start_date,
            "end_date": leave.end_date,
            "days": leave.days,
            "reason": leave.reason,
            "status": leave.status,
            "created_at": leave.created_at
        }
        for leave in leaves
    ]


# ==========================================
# EMPLOYEE DASHBOARD
# ==========================================

@router.get("/dashboard")
def get_employee_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    current_year = datetime.now().year

    balances = (
        db.query(LeaveBalance)
        .filter(
            LeaveBalance.user_id == current_user.id,
            LeaveBalance.year == current_year
        )
        .all()
    )

    total_leaves = sum(
        balance.total_days
        for balance in balances
    )

    used_leaves = sum(
        balance.used_days
        for balance in balances
    )

    remaining_leaves = sum(
        balance.remaining_days
        for balance in balances
    )

    pending_count = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.user_id == current_user.id,
            LeaveRequest.status == "pending"
        )
        .count()
    )

    approved_count = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.user_id == current_user.id,
            LeaveRequest.status == "approved"
        )
        .count()
    )

    rejected_count = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.user_id == current_user.id,
            LeaveRequest.status == "rejected"
        )
        .count()
    )

    return {
        "total_leaves": total_leaves,
        "used_leaves": used_leaves,
        "remaining_leaves": remaining_leaves,
        "pending_requests": pending_count,
        "approved_requests": approved_count,
        "rejected_requests": rejected_count
    }



# CANCEL LEAVE


@router.put("/cancel/{leave_id}")
def cancel_leave(
    leave_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    leave = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.id == leave_id,
            LeaveRequest.user_id == current_user.id
        )
        .first()
    )

    if not leave:
        raise HTTPException(
            status_code=404,
            detail="Leave request not found"
        )

    if leave.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="Only pending leave requests can be cancelled"
        )

    leave.status = "cancelled"

    db.commit()
    db.refresh(leave)

    return {
        "message": "Leave cancelled successfully",
        "leave_id": leave.id,
        "status": leave.status
    }



# EMPLOYEE LEAVE CALENDAR


@router.get("/calendar")
def get_leave_calendar(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    leaves = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.user_id == current_user.id,
            LeaveRequest.status.in_(
                ["pending", "approved"]
            )
        )
        .order_by(
            LeaveRequest.start_date
        )
        .all()
    )

    return [
        {
            "id": leave.id,
            "title": leave.leave_type,
            "start": leave.start_date,
            "end": leave.end_date,
            "days": leave.days,
            "status": leave.status,
            "reason": leave.reason
        }
        for leave in leaves
    ]




@router.get("/balances")
def get_leave_balances(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    balances = (
        db.query(LeaveBalance)
        .filter(
            LeaveBalance.user_id == current_user.id,
            LeaveBalance.year == datetime.now().year
        )
        .order_by(
            LeaveBalance.leave_type
        )
        .all()
    )

    return [
        {
            "id": balance.id,
            "leave_type": balance.leave_type,
            "total_days": balance.total_days,
            "used_days": balance.used_days,
            "remaining_days": balance.remaining_days,
            "year": balance.year
        }
        for balance in balances
    ]
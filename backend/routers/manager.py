from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import SessionLocal
from models import User, LeaveRequest, LeaveBalance
from utils.dependencies import get_current_user
from utils.email import send_email


router = APIRouter(
    prefix="/manager",
    tags=["Manager"]
)



# DATABASE


def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# GET PENDING LEAVE REQUESTS

@router.get("/pending")
def get_pending_leaves(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user.role != "manager":
        raise HTTPException(
            status_code=403,
            detail="Only managers can view pending leave requests"
        )

    pending_leaves = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.status == "pending"
        )
        .order_by(
            LeaveRequest.created_at.desc()
        )
        .all()
    )

    result = []

    for leave in pending_leaves:

        employee = (
            db.query(User)
            .filter(
                User.id == leave.user_id
            )
            .first()
        )

        if not employee:
            continue

        result.append({
            "id": leave.id,
            "employee_id": employee.id,
            "employee_name": employee.name,
            "employee_email": employee.email,
            "leave_type": leave.leave_type,
            "start_date": leave.start_date,
            "end_date": leave.end_date,
            "days": leave.days,
            "reason": leave.reason,
            "status": leave.status,
            "created_at": leave.created_at
        })

    return result



# EMPLOYEE LEAVE OVERVIEW


@router.get("/employee/{employee_id}/leave-overview")
def get_employee_leave_overview(
    employee_id: int,
    view: str = "month",
    month: int | None = None,
    year: int | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    
    # CHECK MANAGER
   

    if current_user.role != "manager":
        raise HTTPException(
            status_code=403,
            detail="Only managers can view employee leave overview"
        )


   
    # CHECK EMPLOYEE
    

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


    
    # VALIDATE VIEW
    

    if view not in ["month", "year"]:

        raise HTTPException(
            status_code=400,
            detail="View must be month or year"
        )


   
    # DEFAULT YEAR
   

    if year is None:
        year = datetime.now().year


    
    # VALIDATE YEAR
   

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


        # First day of selected month

        start_date = datetime(
            year,
            month,
            1
        ).date()


        # Last day of selected month

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


    
    # GET EMPLOYEE LEAVES
    

    leaves = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.user_id == employee_id
        )
        .order_by(
            LeaveRequest.start_date
        )
        .all()
    )


    
    # FILTER LEAVES
    

    filtered_leaves = []


    # Statistics

    approved_days = 0
    pending_days = 0
    rejected_days = 0
    cancelled_days = 0


    for leave in leaves:

        # Leave does not overlap selected period

        if (
            leave.end_date < start_date
            or leave.start_date > end_date
        ):
            continue


       
        # FIND OVERLAPPING DAYS
        

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


        
        # ADD LEAVE RECORD
        

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


        
        # CALCULATE STATUS DAYS
        

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


    

    return {

        "employee": {

            "id": employee.id,

            "name": employee.name,

            "email": employee.email

        },

        "view": view,

        "year": year,

        "month": month if view == "month" else None,

        "start_date": start_date,

        "end_date": end_date,

        "summary": {

            "total_leave_days": total_leave_days,

            "approved_days": approved_days,

            "pending_days": pending_days,

            "rejected_days": rejected_days,

            "cancelled_days": cancelled_days

        },

        "leave_requests": filtered_leaves

    }



# APPROVE LEAVE


@router.put("/approve/{leave_id}")
def approve_leave(
    leave_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user.role != "manager":
        raise HTTPException(
            status_code=403,
            detail="Only managers can approve leave requests"
        )


    leave = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.id == leave_id
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
            detail="Only pending leave requests can be approved"
        )


    # Find employee

    employee = (
        db.query(User)
        .filter(
            User.id == leave.user_id
        )
        .first()
    )


    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )


    # Find leave balance

    balance = (
        db.query(LeaveBalance)
        .filter(
            LeaveBalance.user_id == leave.user_id,
            LeaveBalance.leave_type == leave.leave_type,
            LeaveBalance.year == leave.start_date.year
        )
        .first()
    )


    if not balance:
        raise HTTPException(
            status_code=400,
            detail="Leave balance not found"
        )


    # Check remaining balance

    if balance.remaining_days < leave.days:
        raise HTTPException(
            status_code=400,
            detail="Insufficient leave balance"
        )


    # Approve leave

    leave.status = "approved"

    balance.used_days += leave.days

    balance.remaining_days -= leave.days


    db.commit()

    db.refresh(leave)


    # SEND APPROVAL EMAIL
   

    subject = "Leave Request Approved - LeaveFlow"


    body = f"""
Hello {employee.name},

Your leave request has been approved.

Leave Details
-------------
Leave Type: {leave.leave_type}
Start Date: {leave.start_date}
End Date: {leave.end_date}
Number of Days: {leave.days}

Reason:
{leave.reason}

Status: Approved

Your leave balance has been updated accordingly.

Regards,
LeaveFlow
Employee Leave Management System
"""


    try:

        send_email(
            recipient_email=employee.email,
            subject=subject,
            body=body
        )

        print(
            f"Approval email sent to: {employee.email}"
        )

    except Exception as error:

        print(
            "Approval email failed:",
            error
        )


    return {

        "message": "Leave approved successfully",

        "leave_id": leave.id,

        "status": leave.status,

        "days_used": leave.days

    }



# REJECT LEAVE


@router.put("/reject/{leave_id}")
def reject_leave(
    leave_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user.role != "manager":
        raise HTTPException(
            status_code=403,
            detail="Only managers can reject leave requests"
        )


    leave = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.id == leave_id
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
            detail="Only pending leave requests can be rejected"
        )


    # Find employee

    employee = (
        db.query(User)
        .filter(
            User.id == leave.user_id
        )
        .first()
    )


    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )


    # Reject leave

    leave.status = "rejected"


    db.commit()

    db.refresh(leave)


   
    # SEND REJECTION EMAIL
   

    subject = "Leave Request Rejected - LeaveFlow"


    body = f"""
Hello {employee.name},

Your leave request has been rejected.

Leave Details
-------------
Leave Type: {leave.leave_type}
Start Date: {leave.start_date}
End Date: {leave.end_date}
Number of Days: {leave.days}

Reason:
{leave.reason}

Status: Rejected

Please contact your manager if you need more information.

Regards,
LeaveFlow
Employee Leave Management System
"""


    try:

        send_email(
            recipient_email=employee.email,
            subject=subject,
            body=body
        )

        print(
            f"Rejection email sent to: {employee.email}"
        )

    except Exception as error:

        print(
            "Rejection email failed:",
            error
        )


    return {

        "message": "Leave rejected successfully",

        "leave_id": leave.id,

        "status": leave.status

    }



# MANAGER DASHBOARD


@router.get("/dashboard")
def get_manager_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user.role != "manager":
        raise HTTPException(
            status_code=403,
            detail="Only managers can access the dashboard"
        )


    total_requests = (
        db.query(LeaveRequest)
        .count()
    )


    pending_requests = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.status == "pending"
        )
        .count()
    )


    approved_requests = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.status == "approved"
        )
        .count()
    )


    rejected_requests = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.status == "rejected"
        )
        .count()
    )


    cancelled_requests = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.status == "cancelled"
        )
        .count()
    )


    return {

        "total_requests": total_requests,

        "pending_requests": pending_requests,

        "approved_requests": approved_requests,

        "rejected_requests": rejected_requests,

        "cancelled_requests": cancelled_requests

    }



# GET LEAVE DETAILS


@router.get("/leave/{leave_id}")
def get_leave_details(
    leave_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user.role != "manager":
        raise HTTPException(
            status_code=403,
            detail="Only managers can view leave details"
        )


    leave = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.id == leave_id
        )
        .first()
    )


    if not leave:
        raise HTTPException(
            status_code=404,
            detail="Leave request not found"
        )


    employee = (
        db.query(User)
        .filter(
            User.id == leave.user_id
        )
        .first()
    )


    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )


    return {

        "leave_id": leave.id,

        "employee_id": employee.id,

        "employee_name": employee.name,

        "employee_email": employee.email,

        "leave_type": leave.leave_type,

        "start_date": leave.start_date,

        "end_date": leave.end_date,

        "days": leave.days,

        "reason": leave.reason,

        "status": leave.status,

        "created_at": leave.created_at

    }



# MANAGER CALENDAR


@router.get("/calendar")
def get_manager_calendar(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user.role != "manager":
        raise HTTPException(
            status_code=403,
            detail="Only managers can access the leave calendar"
        )


    leaves = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.status.in_(
                [
                    "pending",
                    "approved",
                    "rejected"
                ]
            )
        )
        .order_by(
            LeaveRequest.start_date
        )
        .all()
    )


    result = []


    for leave in leaves:

        employee = (
            db.query(User)
            .filter(
                User.id == leave.user_id
            )
            .first()
        )


        if not employee:
            continue


        result.append({

            "id": leave.id,

            "employee_name": employee.name,

            "leave_type": leave.leave_type,

            "start": leave.start_date,

            "end": leave.end_date,

            "days": leave.days,

            "status": leave.status,

            "reason": leave.reason

        })


    return result


# GET ALL EMPLOYEES


@router.get("/employees")
def get_all_employees(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user.role != "manager":
        raise HTTPException(
            status_code=403,
            detail="Only managers can view employees"
        )


    employees = (
        db.query(User)
        .filter(
            User.role == "employee"
        )
        .order_by(
            User.name
        )
        .all()
    )


    return [

        {

            "id": employee.id,

            "name": employee.name,

            "email": employee.email,

            "is_active": employee.is_active,

            "created_at": employee.created_at

        }

        for employee in employees

    ]
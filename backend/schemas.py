from pydantic import BaseModel, EmailStr
from datetime import date, datetime



# Authentication Schemas


class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Leave Schemas


class LeaveCreate(BaseModel):
    leave_type: str
    start_date: date
    end_date: date
    reason: str


class LeaveResponse(BaseModel):
    id: int
    user_id: int
    leave_type: str
    start_date: date
    end_date: date
    days: int
    reason: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
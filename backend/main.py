from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from routers.leave import router as leave_router
from database import engine, Base
import models
from utils.email import send_email
from routers.holiday import router as holiday_router
from routers.admin import router as admin_router
from routers.manager import router as manager_router
from routers.auth import router as auth_router
from models import User
from utils.dependencies import get_current_user
from routers.holidays import router as holidays_router

Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Employee Leave Management System",
    description="Employee Leave Management System API",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(leave_router)
app.include_router(manager_router)
app.include_router(admin_router)
app.include_router(holiday_router)
app.include_router(holidays_router)

@app.get("/")
def home():
    return {
        "message": "Employee Leave Management System",
        "status": "API is running"
    }


@app.get("/me")
def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role
    }

@app.get("/test-email")
def test_email():
    send_email(
        recipient_email="YOUR-EMAIL@gmail.com",
        subject="LeaveFlow Email Test",
        body="This is a test email from the Employee Leave Management System."
    )

    return {"message": "Test email sent successfully"}
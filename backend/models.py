from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    Date,
    ForeignKey
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy import Float
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(100), nullable=False)

    email = Column(
        String(150),
        unique=True,
        nullable=False,
        index=True
    )

    password = Column(String(255), nullable=False)

    role = Column(
        String(20),
        nullable=False,
        default="employee"
    )

    is_active = Column(
        Boolean,
        default=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # Relationship
    leave_requests = relationship(
        "LeaveRequest",
        back_populates="user"
    )
    leave_balances = relationship(
    "LeaveBalance",
    back_populates="user"
)


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    leave_type = Column(
        String(50),
        nullable=False
    )

    start_date = Column(
        Date,
        nullable=False
    )

    end_date = Column(
        Date,
        nullable=False
    )
    days = Column(
        Integer, 
        nullable=False)

    reason = Column(
        String(500),
        nullable=False
    )

    status = Column(
        String(20),
        nullable=False,
        default="pending"
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # Relationship
    user = relationship(
        "User",
        back_populates="leave_requests"
    )

class LeaveBalance(Base):
    __tablename__ = "leave_balances"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    leave_type = Column(
        String(50),
        nullable=False
    )

    total_days = Column(
        Integer,
        nullable=False,
        default=0
    )

    used_days = Column(
        Integer,
        nullable=False,
        default=0
    )

    remaining_days = Column(
        Integer,
        nullable=False,
        default=0
    )

    year = Column(
        Integer,
        nullable=False
    )

    user = relationship(
        "User",
        back_populates="leave_balances"
    )

class Holiday(Base):
    __tablename__ = "holidays"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    date = Column(Date, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
import uuid
from datetime import UTC, date, datetime
from enum import Enum
from typing import Any

from pydantic import EmailStr
from sqlalchemy import DateTime
from sqlmodel import Field, Relationship, SQLModel


def get_datetime_utc() -> datetime:
    return datetime.now(UTC)


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    HR = "HR"
    MANAGER = "MANAGER"
    EMPLOYEE = "EMPLOYEE"


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)
    role: UserRole = Field(default=UserRole.EMPLOYEE)
    employee_id: uuid.UUID | None = Field(default=None, foreign_key="employee.id", nullable=True)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(SQLModel):
    email: EmailStr | None = Field(default=None, max_length=255)
    is_active: bool | None = None
    is_superuser: bool | None = None
    full_name: str | None = Field(default=None, max_length=255)
    password: str | None = Field(default=None, min_length=8, max_length=128)
    role: UserRole | None = None
    employee_id: uuid.UUID | None = None


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID
    created_at: datetime | None = None


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Shared properties
class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


# Properties to receive on item creation
class ItemCreate(ItemBase):
    pass


# Properties to receive on item update
class ItemUpdate(SQLModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


# Database model, database table inferred from class name
class Item(ItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="items")


# Properties to return via API, id is always required
class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime | None = None


class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int


# --- Department Models ---
class DepartmentBase(SQLModel):
    name: str = Field(max_length=255, index=True)
    code: str = Field(max_length=50, unique=True, index=True)
    description: str | None = Field(default=None)


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(SQLModel):
    name: str | None = None
    code: str | None = None
    description: str | None = None


class Department(DepartmentBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),
    )
    employees: list["Employee"] = Relationship(back_populates="department")


class DepartmentPublic(DepartmentBase):
    id: uuid.UUID
    created_at: datetime | None = None
    employee_count: int = 0


class DepartmentsPublic(SQLModel):
    data: list[DepartmentPublic]
    count: int


# --- Employee Models ---
class EmployeeBase(SQLModel):
    first_name: str = Field(max_length=100)
    last_name: str = Field(max_length=100)
    email: EmailStr = Field(max_length=255, index=True)
    phone: str | None = Field(default=None, max_length=50)
    designation: str = Field(max_length=100)
    salary: float = Field(default=0.0)
    joining_date: date = Field(default_factory=date.today)
    status: str = Field(default="Active")  # Active, Inactive
    department_id: uuid.UUID | None = Field(default=None, foreign_key="department.id", nullable=True)
    manager_id: uuid.UUID | None = Field(default=None, foreign_key="employee.id", nullable=True)


class EmployeeCreate(EmployeeBase):
    create_user_account: bool = False
    user_password: str | None = None
    role: UserRole = UserRole.EMPLOYEE


class EmployeeUpdate(SQLModel):
    first_name: str | None = None
    last_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    designation: str | None = None
    salary: float | None = None
    joining_date: date | None = None
    status: str | None = None
    department_id: uuid.UUID | None = None
    manager_id: uuid.UUID | None = None


class Employee(EmployeeBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),
    )
    department: Department | None = Relationship(back_populates="employees")
    attendances: list["Attendance"] = Relationship(back_populates="employee", cascade_delete=True)
    leaves: list["Leave"] = Relationship(back_populates="employee", cascade_delete=True)


class EmployeePublic(EmployeeBase):
    id: uuid.UUID
    created_at: datetime | None = None
    department_name: str | None = None
    manager_name: str | None = None


class EmployeesPublic(SQLModel):
    data: list[EmployeePublic]
    count: int


# --- Attendance Models ---
class AttendanceBase(SQLModel):
    employee_id: uuid.UUID = Field(foreign_key="employee.id")
    date: date = Field(default_factory=date.today)
    check_in: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))
    check_out: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))
    status: str = Field(default="Present")  # Present, Late, Half Day, Absent, Checked In


class AttendanceCreate(SQLModel):
    employee_id: uuid.UUID | None = None
    status: str | None = None


class AttendanceUpdate(SQLModel):
    check_out: datetime | None = None
    status: str | None = None


class Attendance(AttendanceBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),
    )
    employee: Employee | None = Relationship(back_populates="attendances")


class AttendancePublic(AttendanceBase):
    id: uuid.UUID
    employee_name: str | None = None
    department_name: str | None = None
    created_at: datetime | None = None


class AttendancesPublic(SQLModel):
    data: list[AttendancePublic]
    count: int


# --- Leave Models ---
class LeaveBase(SQLModel):
    employee_id: uuid.UUID = Field(foreign_key="employee.id")
    leave_type: str = Field(max_length=50)  # Annual, Sick, Casual, Unpaid, Maternity, Paternity
    reason: str = Field(default="")
    start_date: date
    end_date: date
    total_days: int = Field(default=1)
    status: str = Field(default="Pending")  # Pending, Approved, Rejected
    comments: str | None = Field(default=None)


class LeaveCreate(SQLModel):
    employee_id: uuid.UUID | None = None
    leave_type: str
    reason: str
    start_date: date
    end_date: date


class LeaveStatusUpdate(SQLModel):
    status: str  # Approved, Rejected
    comments: str | None = None


class Leave(LeaveBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),
    )
    reviewed_by_id: uuid.UUID | None = Field(default=None, foreign_key="user.id")
    employee: Employee | None = Relationship(back_populates="leaves")


class LeavePublic(LeaveBase):
    id: uuid.UUID
    employee_name: str | None = None
    department_name: str | None = None
    reviewed_by_name: str | None = None
    created_at: datetime | None = None


class LeavesPublic(SQLModel):
    data: list[LeavePublic]
    count: int


# --- Dashboard Stats Model ---
class DashboardStats(SQLModel):
    total_employees: int
    active_employees: int
    total_departments: int
    present_today: int
    attendance_rate: float
    pending_leaves: int
    department_counts: list[dict[str, Any]]
    recent_leaves: list[LeavePublic]
    recent_attendances: list[AttendancePublic]


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


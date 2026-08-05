import uuid
from datetime import UTC, date, datetime
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import col, func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Attendance,
    AttendanceCreate,
    AttendancePublic,
    AttendancesPublic,
    Department,
    Employee,
    UserRole,
)

router = APIRouter(prefix="/attendance", tags=["attendance"])


def build_attendance_public(
    session: SessionDep, attendance: Attendance
) -> AttendancePublic:
    emp_name = None
    dept_name = None
    if attendance.employee_id:
        emp = session.get(Employee, attendance.employee_id)
        if emp:
            emp_name = f"{emp.first_name} {emp.last_name}"
            if emp.department_id:
                dept = session.get(Department, emp.department_id)
                if dept:
                    dept_name = dept.name

    return AttendancePublic.model_validate(
        attendance,
        update={
            "employee_name": emp_name,
            "department_name": dept_name,
        },
    )


def get_employee_for_user(session: SessionDep, current_user: CurrentUser) -> Employee:
    if current_user.employee_id:
        emp = session.get(Employee, current_user.employee_id)
        if emp:
            return emp

    emp = session.exec(
        select(Employee).where(Employee.email == current_user.email)
    ).first()
    if not emp:
        # Auto create dummy profile if superuser or admin without employee record
        emp = Employee(
            first_name=current_user.full_name or "System",
            last_name="User",
            email=current_user.email,
            designation="Administrator",
            status="Active",
        )
        session.add(emp)
        session.commit()
        session.refresh(emp)
        current_user.employee_id = emp.id
        session.add(current_user)
        session.commit()
    return emp


@router.post("/check-in", response_model=AttendancePublic)
def check_in(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    body: AttendanceCreate | None = None,
) -> Any:
    """
    Check-in for today.
    """
    if body and body.employee_id and current_user.role in [UserRole.ADMIN, UserRole.HR]:
        target_emp = session.get(Employee, body.employee_id)
        if not target_emp:
            raise HTTPException(status_code=404, detail="Employee not found")
    else:
        target_emp = get_employee_for_user(session, current_user)

    today = date.today()
    now_utc = datetime.now(UTC)

    existing = session.exec(
        select(Attendance)
        .where(Attendance.employee_id == target_emp.id)
        .where(Attendance.date == today)
    ).first()

    if existing:
        if existing.check_in:
            raise HTTPException(
                status_code=400, detail="Already checked in for today"
            )
        existing.check_in = now_utc
        existing.status = "Checked In"
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return build_attendance_public(session, existing)

    # Determine if late (after 9:30 AM)
    status_str = "Checked In"
    if now_utc.hour > 9 or (now_utc.hour == 9 and now_utc.minute > 30):
        status_str = "Late"

    attendance = Attendance(
        employee_id=target_emp.id,
        date=today,
        check_in=now_utc,
        status=status_str,
    )
    session.add(attendance)
    session.commit()
    session.refresh(attendance)
    return build_attendance_public(session, attendance)


@router.post("/check-out", response_model=AttendancePublic)
def check_out(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    body: AttendanceCreate | None = None,
) -> Any:
    """
    Check-out for today.
    """
    if body and body.employee_id and current_user.role in [UserRole.ADMIN, UserRole.HR]:
        target_emp = session.get(Employee, body.employee_id)
        if not target_emp:
            raise HTTPException(status_code=404, detail="Employee not found")
    else:
        target_emp = get_employee_for_user(session, current_user)

    today = date.today()
    now_utc = datetime.now(UTC)

    attendance = session.exec(
        select(Attendance)
        .where(Attendance.employee_id == target_emp.id)
        .where(Attendance.date == today)
    ).first()

    if not attendance or not attendance.check_in:
        raise HTTPException(
            status_code=400, detail="Must check-in before checking out"
        )

    attendance.check_out = now_utc
    if attendance.status == "Checked In":
        attendance.status = "Present"
    session.add(attendance)
    session.commit()
    session.refresh(attendance)
    return build_attendance_public(session, attendance)


@router.get("/today", response_model=AttendancePublic | None)
def get_today_attendance(
    session: SessionDep, current_user: CurrentUser
) -> Any:
    """
    Get current logged in user's attendance status for today.
    """
    target_emp = get_employee_for_user(session, current_user)
    today = date.today()
    attendance = session.exec(
        select(Attendance)
        .where(Attendance.employee_id == target_emp.id)
        .where(Attendance.date == today)
    ).first()
    if not attendance:
        return None
    return build_attendance_public(session, attendance)


@router.get("/", response_model=AttendancesPublic)
def read_attendances(
    session: SessionDep,
    current_user: CurrentUser,
    target_date: date | None = None,
    employee_id: uuid.UUID | None = None,
    status: str | None = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve attendance records.
    """
    query = select(Attendance)

    if target_date:
        query = query.where(Attendance.date == target_date)
    if employee_id:
        query = query.where(Attendance.employee_id == employee_id)
    if status:
        query = query.where(Attendance.status == status)

    count_statement = select(func.count()).select_from(query.subquery())
    count = session.exec(count_statement).one()

    statement = (
        query.order_by(col(Attendance.date).desc(), col(Attendance.check_in).desc())
        .offset(skip)
        .limit(limit)
    )
    records = session.exec(statement).all()

    data = [build_attendance_public(session, att) for att in records]
    return AttendancesPublic(data=data, count=count)


@router.get("/{employee_id}", response_model=AttendancesPublic)
def read_employee_attendance(
    session: SessionDep,
    current_user: CurrentUser,
    employee_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Get attendance history for a specific employee.
    """
    query = select(Attendance).where(Attendance.employee_id == employee_id)
    count_statement = select(func.count()).select_from(query.subquery())
    count = session.exec(count_statement).one()

    statement = (
        query.order_by(col(Attendance.date).desc()).offset(skip).limit(limit)
    )
    records = session.exec(statement).all()

    data = [build_attendance_public(session, att) for att in records]
    return AttendancesPublic(data=data, count=count)

from datetime import date
from typing import Any

from fastapi import APIRouter
from sqlmodel import col, func, select

from app.api.deps import CurrentUser, SessionDep
from app.api.routes.attendance import build_attendance_public
from app.api.routes.leave import build_leave_public
from app.models import (
    Attendance,
    DashboardStats,
    Department,
    Employee,
    Leave,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    session: SessionDep, current_user: CurrentUser
) -> Any:
    """
    Get aggregated EMS dashboard metrics and recent activity feeds.
    """
    today = date.today()

    # Employees count
    total_emp_stmt = select(func.count()).select_from(Employee)
    total_employees = session.exec(total_emp_stmt).one()

    active_emp_stmt = (
        select(func.count())
        .select_from(Employee)
        .where(Employee.status == "Active")
    )
    active_employees = session.exec(active_emp_stmt).one()

    # Departments count
    dept_stmt = select(func.count()).select_from(Department)
    total_departments = session.exec(dept_stmt).one()

    # Attendance today
    present_stmt = (
        select(func.count())
        .select_from(Attendance)
        .where(Attendance.date == today)
        .where(Attendance.status.in_(["Present", "Checked In", "Late"]))
    )
    present_today = session.exec(present_stmt).one()

    attendance_rate = (
        round((present_today / active_employees) * 100, 1)
        if active_employees > 0
        else 0.0
    )

    # Pending leaves count
    pending_leave_stmt = (
        select(func.count())
        .select_from(Leave)
        .where(Leave.status == "Pending")
    )
    pending_leaves = session.exec(pending_leave_stmt).one()

    # Department breakdown
    dept_counts = []
    departments = session.exec(select(Department)).all()
    for dept in departments:
        c_stmt = (
            select(func.count())
            .select_from(Employee)
            .where(Employee.department_id == dept.id)
        )
        c = session.exec(c_stmt).one()
        dept_counts.append({"name": dept.name, "code": dept.code, "count": c})

    # Recent leaves (last 5)
    recent_leaves_raw = session.exec(
        select(Leave).order_by(col(Leave.created_at).desc()).limit(5)
    ).all()
    recent_leaves = [build_leave_public(session, l) for l in recent_leaves_raw]

    # Recent attendances (last 5)
    recent_att_raw = session.exec(
        select(Attendance)
        .order_by(col(Attendance.date).desc(), col(Attendance.created_at).desc())
        .limit(5)
    ).all()
    recent_attendances = [
        build_attendance_public(session, a) for a in recent_att_raw
    ]

    return DashboardStats(
        total_employees=total_employees,
        active_employees=active_employees,
        total_departments=total_departments,
        present_today=present_today,
        attendance_rate=attendance_rate,
        pending_leaves=pending_leaves,
        department_counts=dept_counts,
        recent_leaves=recent_leaves,
        recent_attendances=recent_attendances,
    )

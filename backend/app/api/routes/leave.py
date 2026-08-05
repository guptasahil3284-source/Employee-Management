import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import col, func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Department,
    Employee,
    Leave,
    LeaveCreate,
    LeavePublic,
    LeavesPublic,
    LeaveStatusUpdate,
    Message,
    User,
)

router = APIRouter(prefix="/leave", tags=["leave"])


def build_leave_public(session: SessionDep, leave: Leave) -> LeavePublic:
    emp_name = None
    dept_name = None
    if leave.employee_id:
        emp = session.get(Employee, leave.employee_id)
        if emp:
            emp_name = f"{emp.first_name} {emp.last_name}"
            if emp.department_id:
                dept = session.get(Department, emp.department_id)
                if dept:
                    dept_name = dept.name

    reviewer_name = None
    if leave.reviewed_by_id:
        reviewer = session.get(User, leave.reviewed_by_id)
        if reviewer:
            reviewer_name = reviewer.full_name or reviewer.email

    return LeavePublic.model_validate(
        leave,
        update={
            "employee_name": emp_name,
            "department_name": dept_name,
            "reviewed_by_name": reviewer_name,
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


@router.post("/", response_model=LeavePublic)
def apply_leave(
    *, session: SessionDep, current_user: CurrentUser, leave_in: LeaveCreate
) -> Any:
    """
    Apply for leave.
    """
    if leave_in.employee_id:
        target_emp = session.get(Employee, leave_in.employee_id)
        if not target_emp:
            raise HTTPException(status_code=404, detail="Employee not found")
    else:
        target_emp = get_employee_for_user(session, current_user)

    if leave_in.end_date < leave_in.start_date:
        raise HTTPException(
            status_code=400, detail="End date cannot be before start date"
        )

    days = (leave_in.end_date - leave_in.start_date).days + 1

    leave = Leave(
        employee_id=target_emp.id,
        leave_type=leave_in.leave_type,
        reason=leave_in.reason,
        start_date=leave_in.start_date,
        end_date=leave_in.end_date,
        total_days=days,
        status="Pending",
    )
    session.add(leave)
    session.commit()
    session.refresh(leave)
    return build_leave_public(session, leave)


@router.get("/my-leaves", response_model=LeavesPublic)
def get_my_leaves(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve logged-in employee's leaves.
    """
    target_emp = get_employee_for_user(session, current_user)
    query = select(Leave).where(Leave.employee_id == target_emp.id)

    count_statement = select(func.count()).select_from(query.subquery())
    count = session.exec(count_statement).one()

    statement = (
        query.order_by(col(Leave.created_at).desc()).offset(skip).limit(limit)
    )
    leaves = session.exec(statement).all()

    data = [build_leave_public(session, l) for l in leaves]
    return LeavesPublic(data=data, count=count)


@router.get("/", response_model=LeavesPublic)
def read_leaves(
    session: SessionDep,
    current_user: CurrentUser,
    status: str | None = None,
    employee_id: uuid.UUID | None = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve all leave requests.
    """
    query = select(Leave)

    if status:
        query = query.where(Leave.status == status)
    if employee_id:
        query = query.where(Leave.employee_id == employee_id)

    count_statement = select(func.count()).select_from(query.subquery())
    count = session.exec(count_statement).one()

    statement = (
        query.order_by(col(Leave.created_at).desc()).offset(skip).limit(limit)
    )
    leaves = session.exec(statement).all()

    data = [build_leave_public(session, l) for l in leaves]
    return LeavesPublic(data=data, count=count)


@router.put("/{id}/status", response_model=LeavePublic)
def update_leave_status(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    status_in: LeaveStatusUpdate,
) -> Any:
    """
    Approve or Reject a leave request.
    """
    leave = session.get(Leave, id)
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    if status_in.status not in ["Approved", "Rejected", "Pending"]:
        raise HTTPException(
            status_code=400, detail="Invalid status value"
        )

    leave.status = status_in.status
    leave.comments = status_in.comments
    leave.reviewed_by_id = current_user.id

    session.add(leave)
    session.commit()
    session.refresh(leave)
    return build_leave_public(session, leave)


@router.delete("/{id}")
def delete_leave(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete / Cancel a leave request.
    """
    leave = session.get(Leave, id)
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    session.delete(leave)
    session.commit()
    return Message(message="Leave request deleted successfully")

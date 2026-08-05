import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import col, func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Department,
    DepartmentCreate,
    DepartmentPublic,
    DepartmentsPublic,
    DepartmentUpdate,
    Employee,
    Message,
)

router = APIRouter(prefix="/departments", tags=["departments"])


@router.get("/", response_model=DepartmentsPublic)
def read_departments(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve departments with employee counts.
    """
    count_statement = select(func.count()).select_from(Department)
    count = session.exec(count_statement).one()

    statement = (
        select(Department)
        .order_by(col(Department.name).asc())
        .offset(skip)
        .limit(limit)
    )
    departments = session.exec(statement).all()

    data = []
    for dept in departments:
        emp_count_stmt = (
            select(func.count())
            .select_from(Employee)
            .where(Employee.department_id == dept.id)
        )
        emp_count = session.exec(emp_count_stmt).one()
        dept_public = DepartmentPublic.model_validate(
            dept, update={"employee_count": emp_count}
        )
        data.append(dept_public)

    return DepartmentsPublic(data=data, count=count)


@router.get("/{id}", response_model=DepartmentPublic)
def read_department(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    """
    Get department by ID.
    """
    department = session.get(Department, id)
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    emp_count_stmt = (
        select(func.count())
        .select_from(Employee)
        .where(Employee.department_id == department.id)
    )
    emp_count = session.exec(emp_count_stmt).one()
    return DepartmentPublic.model_validate(
        department, update={"employee_count": emp_count}
    )


@router.post("/", response_model=DepartmentPublic)
def create_department(
    *, session: SessionDep, current_user: CurrentUser, department_in: DepartmentCreate
) -> Any:
    """
    Create a new department.
    """
    existing = session.exec(
        select(Department).where(Department.code == department_in.code)
    ).first()
    if existing:
        raise HTTPException(
            status_code=400, detail="Department with this code already exists"
        )

    department = Department.model_validate(department_in)
    session.add(department)
    session.commit()
    session.refresh(department)
    return DepartmentPublic.model_validate(department, update={"employee_count": 0})


@router.put("/{id}", response_model=DepartmentPublic)
def update_department(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    department_in: DepartmentUpdate,
) -> Any:
    """
    Update a department.
    """
    department = session.get(Department, id)
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    update_dict = department_in.model_dump(exclude_unset=True)
    if "code" in update_dict and update_dict["code"] != department.code:
        existing = session.exec(
            select(Department).where(Department.code == update_dict["code"])
        ).first()
        if existing:
            raise HTTPException(
                status_code=400, detail="Department with this code already exists"
            )

    department.sqlmodel_update(update_dict)
    session.add(department)
    session.commit()
    session.refresh(department)

    emp_count_stmt = (
        select(func.count())
        .select_from(Employee)
        .where(Employee.department_id == department.id)
    )
    emp_count = session.exec(emp_count_stmt).one()
    return DepartmentPublic.model_validate(
        department, update={"employee_count": emp_count}
    )


@router.delete("/{id}")
def delete_department(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete a department.
    """
    department = session.get(Department, id)
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    # Set department_id to None for employees in this department
    employees = session.exec(
        select(Employee).where(Employee.department_id == id)
    ).all()
    for emp in employees:
        emp.department_id = None
        session.add(emp)

    session.delete(department)
    session.commit()
    return Message(message="Department deleted successfully")

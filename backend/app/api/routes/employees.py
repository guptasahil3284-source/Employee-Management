import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import col, func, or_, select

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Department,
    Employee,
    EmployeeCreate,
    EmployeePublic,
    EmployeesPublic,
    EmployeeUpdate,
    Message,
    UserCreate,
)

router = APIRouter(prefix="/employees", tags=["employees"])


def build_employee_public(session: SessionDep, employee: Employee) -> EmployeePublic:
    dept_name = None
    if employee.department_id:
        dept = session.get(Department, employee.department_id)
        if dept:
            dept_name = dept.name

    mgr_name = None
    if employee.manager_id:
        mgr = session.get(Employee, employee.manager_id)
        if mgr:
            mgr_name = f"{mgr.first_name} {mgr.last_name}"

    return EmployeePublic.model_validate(
        employee,
        update={
            "department_name": dept_name,
            "manager_name": mgr_name,
        },
    )


@router.get("/", response_model=EmployeesPublic)
def read_employees(
    session: SessionDep,
    current_user: CurrentUser,
    q: str | None = None,
    department_id: uuid.UUID | None = None,
    status: str | None = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve employees with filtering and search.
    """
    query = select(Employee)

    if q:
        search_pattern = f"%{q}%"
        query = query.where(
            or_(
                Employee.first_name.ilike(search_pattern),
                Employee.last_name.ilike(search_pattern),
                Employee.email.ilike(search_pattern),
                Employee.designation.ilike(search_pattern),
            )
        )

    if department_id:
        query = query.where(Employee.department_id == department_id)

    if status:
        query = query.where(Employee.status == status)

    count_statement = select(func.count()).select_from(query.subquery())
    count = session.exec(count_statement).one()

    statement = (
        query.order_by(col(Employee.created_at).desc()).offset(skip).limit(limit)
    )
    employees = session.exec(statement).all()

    data = [build_employee_public(session, emp) for emp in employees]
    return EmployeesPublic(data=data, count=count)


@router.get("/{id}", response_model=EmployeePublic)
def read_employee(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    """
    Get employee by ID.
    """
    employee = session.get(Employee, id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return build_employee_public(session, employee)


@router.post("/", response_model=EmployeePublic)
def create_employee(
    *, session: SessionDep, current_user: CurrentUser, employee_in: EmployeeCreate
) -> Any:
    """
    Create a new employee.
    """
    existing = session.exec(
        select(Employee).where(Employee.email == employee_in.email)
    ).first()
    if existing:
        raise HTTPException(
            status_code=400, detail="Employee with this email already exists"
        )

    emp_data = employee_in.model_dump(
        exclude={"create_user_account", "user_password", "role"}
    )
    employee = Employee.model_validate(emp_data)
    session.add(employee)
    session.commit()
    session.refresh(employee)

    # Optionally create user account for login
    if employee_in.create_user_account and employee_in.user_password:
        user_in = UserCreate(
            email=employee.email,
            password=employee_in.user_password,
            full_name=f"{employee.first_name} {employee.last_name}",
            role=employee_in.role,
            employee_id=employee.id,
        )
        crud.create_user(session=session, user_create=user_in)

    return build_employee_public(session, employee)


@router.put("/{id}", response_model=EmployeePublic)
def update_employee(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    employee_in: EmployeeUpdate,
) -> Any:
    """
    Update an employee.
    """
    employee = session.get(Employee, id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    update_dict = employee_in.model_dump(exclude_unset=True)
    if "email" in update_dict and update_dict["email"] != employee.email:
        existing = session.exec(
            select(Employee).where(Employee.email == update_dict["email"])
        ).first()
        if existing:
            raise HTTPException(
                status_code=400, detail="Employee with this email already exists"
            )

    employee.sqlmodel_update(update_dict)
    session.add(employee)
    session.commit()
    session.refresh(employee)
    return build_employee_public(session, employee)


@router.delete("/{id}")
def delete_employee(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete an employee.
    """
    employee = session.get(Employee, id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    session.delete(employee)
    session.commit()
    return Message(message="Employee deleted successfully")

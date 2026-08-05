from datetime import UTC, date, datetime, timedelta

from sqlmodel import SQLModel, Session, create_engine, select

from app import crud
from app.core.config import settings
from app.models import (
    Attendance,
    Department,
    Employee,
    Leave,
    User,
    UserCreate,
    UserRole,
)

engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))


def init_db(session: Session) -> None:
    # Ensure tables exist
    SQLModel.metadata.create_all(engine)

    # 1. Superuser / Admin
    user = session.exec(
        select(User).where(User.email == settings.FIRST_SUPERUSER)
    ).first()
    if not user:
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_superuser=True,
            role=UserRole.ADMIN,
            full_name="System Administrator",
        )
        user = crud.create_user(session=session, user_create=user_in)

    # 2. Departments
    existing_dept = session.exec(select(Department)).first()
    if not existing_dept:
        dept_data = [
            Department(name="Engineering", code="ENG", description="Software & System Architecture"),
            Department(name="Human Resources", code="HR", description="Talent Acquisition & Employee Well-being"),
            Department(name="Product & Design", code="PRD", description="Product Management & UI/UX Design"),
            Department(name="Marketing & Growth", code="MKT", description="Brand, Campaigns & Strategic Outreach"),
            Department(name="Finance & Operations", code="FIN", description="Accounting, Payroll & Operational Excellence"),
        ]
        for dept in dept_data:
            session.add(dept)
        session.commit()

    depts = session.exec(select(Department)).all()
    dept_map = {d.code: d.id for d in depts}

    # 3. Seed Employees & Role-based users if none exist
    existing_emp = session.exec(select(Employee)).first()
    if not existing_emp:
        sample_employees = [
            {
                "first_name": "Sahil",
                "last_name": "Gupta",
                "email": settings.FIRST_SUPERUSER,
                "phone": "+1 (555) 019-2834",
                "designation": "Head of Engineering",
                "salary": 150000.0,
                "joining_date": date(2023, 1, 15),
                "status": "Active",
                "department_id": dept_map.get("ENG"),
                "role": UserRole.ADMIN,
            },
            {
                "first_name": "Sarah",
                "last_name": "Jenkins",
                "email": "hr@example.com",
                "phone": "+1 (555) 012-3456",
                "designation": "HR Director",
                "salary": 115000.0,
                "joining_date": date(2023, 3, 1),
                "status": "Active",
                "department_id": dept_map.get("HR"),
                "role": UserRole.HR,
            },
            {
                "first_name": "Alex",
                "last_name": "Morgan",
                "email": "manager@example.com",
                "phone": "+1 (555) 014-9821",
                "designation": "Engineering Manager",
                "salary": 135000.0,
                "joining_date": date(2023, 5, 10),
                "status": "Active",
                "department_id": dept_map.get("ENG"),
                "role": UserRole.MANAGER,
            },
            {
                "first_name": "David",
                "last_name": "Chen",
                "email": "david.chen@example.com",
                "phone": "+1 (555) 018-7733",
                "designation": "Senior Full-Stack Developer",
                "salary": 110000.0,
                "joining_date": date(2023, 8, 20),
                "status": "Active",
                "department_id": dept_map.get("ENG"),
                "role": UserRole.EMPLOYEE,
            },
            {
                "first_name": "Elena",
                "last_name": "Rostova",
                "email": "elena.r@example.com",
                "phone": "+1 (555) 016-5544",
                "designation": "Lead UI/UX Designer",
                "salary": 105000.0,
                "joining_date": date(2024, 2, 1),
                "status": "Active",
                "department_id": dept_map.get("PRD"),
                "role": UserRole.EMPLOYEE,
            },
        ]

        created_emps = []
        for emp_info in sample_employees:
            role = emp_info.pop("role")
            emp = Employee(**emp_info)
            session.add(emp)
            session.commit()
            session.refresh(emp)
            created_emps.append(emp)

            # Link Superuser to Sahil Gupta
            if emp.email == settings.FIRST_SUPERUSER:
                user.employee_id = emp.id
                user.role = UserRole.ADMIN
                session.add(user)
                session.commit()
            else:
                user_in = UserCreate(
                    email=emp.email,
                    password="password123",
                    full_name=f"{emp.first_name} {emp.last_name}",
                    role=role,
                    employee_id=emp.id,
                )
                crud.create_user(session=session, user_create=user_in)

        # 4. Seed Attendance records for today & recent days
        today = date.today()
        for emp in created_emps:
            # Today's attendance
            att_today = Attendance(
                employee_id=emp.id,
                date=today,
                check_in=datetime.now(UTC) - timedelta(hours=4),
                check_out=None,
                status="Checked In",
            )
            session.add(att_today)

            # Yesterday's attendance
            att_prev = Attendance(
                employee_id=emp.id,
                date=today - timedelta(days=1),
                check_in=datetime.now(UTC) - timedelta(days=1, hours=8),
                check_out=datetime.now(UTC) - timedelta(days=1),
                status="Present",
            )
            session.add(att_prev)
        session.commit()

        # 5. Seed sample Leave requests
        if len(created_emps) >= 4:
            leave1 = Leave(
                employee_id=created_emps[3].id,  # David Chen
                leave_type="Annual",
                reason="Family vacation to Grand Canyon",
                start_date=today + timedelta(days=5),
                end_date=today + timedelta(days=9),
                total_days=5,
                status="Pending",
            )
            leave2 = Leave(
                employee_id=created_emps[4].id,  # Elena Rostova
                leave_type="Sick",
                reason="Medical checkup & recovery",
                start_date=today - timedelta(days=2),
                end_date=today - timedelta(days=1),
                total_days=2,
                status="Approved",
                reviewed_by_id=user.id,
                comments="Approved. Take care!",
            )
            session.add(leave1)
            session.add(leave2)
            session.commit()


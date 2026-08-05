# Enterprise Employee Management System (EMS)

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_19-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Deployment-Docker-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com)

A modern, full-stack, enterprise-grade **Employee Management System (EMS)** designed to streamline workforce management, department structures, real-time attendance check-in/out, leave applications, and executive analytics through a secure, role-based platform.

---

## 📌 Overview

The **Enterprise Employee Management System (EMS)** provides HR teams, managers, administrators, and employees with an intuitive interface and RESTful API backend. Follow clean architecture principles, role-based access control (RBAC), SQLModel ORM, and responsive React frontend components with Tailwind CSS.

---

## 🎯 Objectives & Highlights

- **Full-Stack REST Architecture**: Powered by FastAPI, Pydantic v2, and SQLModel.
- **Modern React 19 Frontend**: Built with Vite, TypeScript, TanStack Router, TanStack Query, and Radix UI primitives.
- **Role-Based Access Control (RBAC)**: Support for `ADMIN`, `HR`, `MANAGER`, and `EMPLOYEE` roles.
- **Real-Time Shift Tracking**: 1-Click Shift Check-In & Check-Out with status calculations (`Checked In`, `Present`, `Late`, `Absent`).
- **Automated Leave Approvals**: Multi-tier leave application workflow with auto-calculated duration and HR/Manager approval queue with feedback comments.
- **Executive Analytics Dashboard**: Real-time KPI metrics, workforce department allocation breakdown, and recent activity streams.

---

## 👨‍💻 Tech Stack

### Frontend
- **Framework**: React.js 19 + TypeScript + Vite
- **Routing & State**: TanStack React Router & TanStack React Query
- **Styling**: Tailwind CSS 4 + Radix UI + Lucide Icons + Next Themes (Dark/Light mode)
- **Forms & Toast**: React Hook Form + Sonner

### Backend
- **Framework**: Python 3.12+ & FastAPI
- **ORM & Validation**: SQLModel (SQLAlchemy + Pydantic v2)
- **Auth & Security**: JWT Authentication, OAuth2 Password Bearer, bcrypt password hashing
- **Testing**: Pytest

### Database & Deployment
- **Database**: PostgreSQL / SQLite
- **DevOps & Containers**: Docker, Docker Compose, Nginx, Traefik

---

## 🏗️ System Architecture

```
                       React 19 Frontend (Vite + TypeScript)
                                         │
                                         │ REST APIs (JSON / JWT)
                                         ▼
                             FastAPI Backend Application
                                         │
                        ┌────────────────┴────────────────┐
                        │    Role-Based Auth (RBAC)       │
                        └────────────────┬────────────────┘
                                         │
                                Business Logic Layer
                        (Employees, Depts, Attendance, Leave)
                                         │
                                SQLModel (ORM Layer)
                                         │
                                PostgreSQL / Database
```

---

## 👥 User Roles & Permissions

| Feature / Action | Admin 🛡️ | HR 👔 | Manager 📈 | Employee 🧑‍💻 |
|------------------|:-------:|:-----:|:---------:|:----------:|
| View Dashboard Analytics | ✅ | ✅ | ✅ | ✅ |
| Manage Employees (CRUD) | ✅ | ✅ | Read Only | Personal Only |
| Manage Departments (CRUD) | ✅ | ✅ | Read Only | Read Only |
| Attendance Check-In / Out | ✅ | ✅ | ✅ | ✅ |
| View Attendance Roster | ✅ | ✅ | Team Only | Self Only |
| Apply for Leave | ✅ | ✅ | ✅ | ✅ |
| Approve / Reject Leaves | ✅ | ✅ | Team Only | ❌ |

---

## 📂 System Modules

### 1. Authentication & Role Authorization
- JWT Access Token generation.
- Secure bcrypt password hashing.
- Role-based route protection.

### 2. Employee Management (`/employees`)
- Multi-field search (Name, Email, Designation).
- Filters by Department & Active/Inactive status.
- Add / Edit Employee modal with optional user login account creation.
- Salary, joining date, and manager tracking.

### 3. Department Management (`/departments`)
- Department code badges (e.g. `ENG`, `HR`, `PRD`, `MKT`, `FIN`).
- Real-time active member count allocation.
- Modal forms for creating & updating department units.

### 4. Attendance Portal (`/attendance`)
- 1-Click Check-In & Check-Out timestamp recording.
- Automated shift status determination (`Checked In`, `Present`, `Late`).
- Historic attendance roster filterable by date and status.

### 5. Leave Management Center (`/leave`)
- Personal leave balances (Annual, Sick, Casual).
- Apply for leave modal with start/end date calculation.
- Pending Approvals Queue for HR & Managers with 1-click Approve / Reject with feedback.

---

## 🔗 REST API Endpoints

### Authentication
```http
POST   /api/v1/login/access-token
GET    /api/v1/users/me
POST   /api/v1/users/signup
```

### Departments
```http
GET    /api/v1/departments/
POST   /api/v1/departments/
GET    /api/v1/departments/{id}
PUT    /api/v1/departments/{id}
DELETE /api/v1/departments/{id}
```

### Employees
```http
GET    /api/v1/employees/
POST   /api/v1/employees/
GET    /api/v1/employees/{id}
PUT    /api/v1/employees/{id}
DELETE /api/v1/employees/{id}
```

### Attendance
```http
POST   /api/v1/attendance/check-in
POST   /api/v1/attendance/check-out
GET    /api/v1/attendance/today
GET    /api/v1/attendance/
GET    /api/v1/attendance/{employee_id}
```

### Leave Management
```http
POST   /api/v1/leave/
GET    /api/v1/leave/
GET    /api/v1/leave/my-leaves
PUT    /api/v1/leave/{id}/status
DELETE /api/v1/leave/{id}
```

### Executive Dashboard
```http
GET    /api/v1/dashboard/stats
```

---

## 🚀 Installation & Local Setup

### Option 1: Docker Compose (Recommended)
```bash
# 1. Clone the repository
git clone https://github.com/guptasahil3284-source/Employee-Management.git
cd Employee-Management

# 2. Start all services using Docker Compose
docker compose up -d --build
```
- **Frontend App**: `http://localhost:5173`
- **Backend API Docs**: `http://localhost:8000/docs`

### Option 2: Local Development Setup

#### Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
fastapi dev app/main.py
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Demo System Credentials

| Role | Email | Password |
|------|-------|----------|
| **System Admin** | `admin@example.com` | `password` |
| **HR Director** | `hr@example.com` | `password123` |
| **Engineering Manager** | `manager@example.com` | `password123` |
| **Senior Developer** | `david.chen@example.com` | `password123` |

---

## 👨‍💻 Author

**Sahil Gupta**  
*B.Tech Computer Science & Engineering*  
Full Stack Developer | Software Engineer  
GitHub: [SahilGupta893](https://github.com/SahilGupta893) / [guptasahil3284-source](https://github.com/guptasahil3284-source)

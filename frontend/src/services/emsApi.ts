import { OpenAPI } from "@/client/core/OpenAPI"
import { request as __request } from "@/client/core/request"

export type UserRole = "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE"

export interface Department {
  id: string
  name: string
  code: string
  description?: string
  created_at?: string
  employee_count: number
}

export interface DepartmentsPublic {
  data: Department[]
  count: number
}

export interface DepartmentCreate {
  name: string
  code: string
  description?: string
}

export interface DepartmentUpdate {
  name?: string
  code?: string
  description?: string
}

export interface Employee {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  designation: string
  salary: number
  joining_date: string
  status: string
  department_id?: string
  department_name?: string
  manager_id?: string
  manager_name?: string
  created_at?: string
}

export interface EmployeesPublic {
  data: Employee[]
  count: number
}

export interface EmployeeCreate {
  first_name: string
  last_name: string
  email: string
  phone?: string
  designation: string
  salary?: number
  joining_date?: string
  status?: string
  department_id?: string
  manager_id?: string
  create_user_account?: boolean
  user_password?: string
  role?: UserRole
}

export interface EmployeeUpdate {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  designation?: string
  salary?: number
  joining_date?: string
  status?: string
  department_id?: string
  manager_id?: string
}

export interface Attendance {
  id: string
  employee_id: string
  employee_name?: string
  department_name?: string
  date: string
  check_in?: string
  check_out?: string
  status: string
  created_at?: string
}

export interface AttendancesPublic {
  data: Attendance[]
  count: number
}

export interface Leave {
  id: string
  employee_id: string
  employee_name?: string
  department_name?: string
  leave_type: string
  reason: string
  start_date: string
  end_date: string
  total_days: number
  status: string
  comments?: string
  reviewed_by_id?: string
  reviewed_by_name?: string
  created_at?: string
}

export interface LeavesPublic {
  data: Leave[]
  count: number
}

export interface LeaveCreate {
  leave_type: string
  reason: string
  start_date: string
  end_date: string
  employee_id?: string
}

export interface LeaveStatusUpdate {
  status: "Approved" | "Rejected" | "Pending"
  comments?: string
}

export interface DashboardStats {
  total_employees: number
  active_employees: number
  total_departments: number
  present_today: number
  attendance_rate: number
  pending_leaves: number
  department_counts: { name: string; code: string; count: number }[]
  recent_leaves: Leave[]
  recent_attendances: Attendance[]
}

export class EmsService {
  // --- Departments ---
  public static readDepartments(skip = 0, limit = 100) {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/departments/",
      query: { skip, limit },
    }) as Promise<DepartmentsPublic>
  }

  public static createDepartment(data: DepartmentCreate) {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/departments/",
      body: data,
    }) as Promise<Department>
  }

  public static updateDepartment(id: string, data: DepartmentUpdate) {
    return __request(OpenAPI, {
      method: "PUT",
      url: `/api/v1/departments/${id}`,
      body: data,
    }) as Promise<Department>
  }

  public static deleteDepartment(id: string) {
    return __request(OpenAPI, {
      method: "DELETE",
      url: `/api/v1/departments/${id}`,
    }) as Promise<{ message: string }>
  }

  // --- Employees ---
  public static readEmployees(params?: {
    q?: string
    department_id?: string
    status?: string
    skip?: number
    limit?: number
  }) {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/employees/",
      query: params,
    }) as Promise<EmployeesPublic>
  }

  public static createEmployee(data: EmployeeCreate) {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/employees/",
      body: data,
    }) as Promise<Employee>
  }

  public static updateEmployee(id: string, data: EmployeeUpdate) {
    return __request(OpenAPI, {
      method: "PUT",
      url: `/api/v1/employees/${id}`,
      body: data,
    }) as Promise<Employee>
  }

  public static deleteEmployee(id: string) {
    return __request(OpenAPI, {
      method: "DELETE",
      url: `/api/v1/employees/${id}`,
    }) as Promise<{ message: string }>
  }

  // --- Attendance ---
  public static checkIn() {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/attendance/check-in",
    }) as Promise<Attendance>
  }

  public static checkOut() {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/attendance/check-out",
    }) as Promise<Attendance>
  }

  public static getTodayAttendance() {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/attendance/today",
    }) as Promise<Attendance | null>
  }

  public static readAttendances(params?: {
    target_date?: string
    employee_id?: string
    status?: string
    skip?: number
    limit?: number
  }) {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/attendance/",
      query: params,
    }) as Promise<AttendancesPublic>
  }

  // --- Leave ---
  public static applyLeave(data: LeaveCreate) {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/leave/",
      body: data,
    }) as Promise<Leave>
  }

  public static getMyLeaves(skip = 0, limit = 100) {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/leave/my-leaves",
      query: { skip, limit },
    }) as Promise<LeavesPublic>
  }

  public static readLeaves(params?: {
    status?: string
    employee_id?: string
    skip?: number
    limit?: number
  }) {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/leave/",
      query: params,
    }) as Promise<LeavesPublic>
  }

  public static updateLeaveStatus(id: string, data: LeaveStatusUpdate) {
    return __request(OpenAPI, {
      method: "PUT",
      url: `/api/v1/leave/${id}/status`,
      body: data,
    }) as Promise<Leave>
  }

  public static deleteLeave(id: string) {
    return __request(OpenAPI, {
      method: "DELETE",
      url: `/api/v1/leave/${id}`,
    }) as Promise<{ message: string }>
  }

  // --- Dashboard ---
  public static getDashboardStats() {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/dashboard/stats",
    }) as Promise<DashboardStats>
  }
}

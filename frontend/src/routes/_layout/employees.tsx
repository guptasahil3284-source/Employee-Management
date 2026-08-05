import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
  Building2,
  Search,
  Trash2,
  UserPlus,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import useCustomToast from "@/hooks/useCustomToast"
import {
  Employee,
  EmployeeCreate,
  EmsService,
  UserRole,
} from "@/services/emsApi"

export const Route = createFileRoute("/_layout/employees")({
  component: EmployeesPage,
  head: () => ({
    meta: [
      {
        title: "Employee Directory - EMS",
      },
    ],
  }),
})

function EmployeesPage() {
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const queryClient = useQueryClient()


  const [search, setSearch] = useState("")
  const [deptFilter, setDeptFilter] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("")

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null)

  // Form State for Add / Edit
  const [formData, setFormData] = useState<EmployeeCreate>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    designation: "",
    salary: 85000,
    status: "Active",
    department_id: "",
    create_user_account: false,
    user_password: "password123",
    role: "EMPLOYEE",
  })

  // Queries
  const { data: employeesData, isLoading } = useQuery({
    queryKey: ["employees", search, deptFilter, statusFilter],
    queryFn: () =>
      EmsService.readEmployees({
        q: search || undefined,
        department_id: deptFilter || undefined,
        status: statusFilter || undefined,
      }),
  })

  const { data: deptsData } = useQuery({
    queryKey: ["departments"],
    queryFn: () => EmsService.readDepartments(),
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: EmsService.createEmployee,
    onSuccess: () => {
      showSuccessToast("Employee created successfully!")
      setIsAddOpen(false)
      resetForm()
      queryClient.invalidateQueries({ queryKey: ["employees"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
    },
    onError: (err: any) => {
      showErrorToast(err?.body?.detail || "Failed to create employee")
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EmployeeCreate> }) =>
      EmsService.updateEmployee(id, data),
    onSuccess: () => {
      showSuccessToast("Employee updated successfully!")
      setEditingEmployee(null)
      queryClient.invalidateQueries({ queryKey: ["employees"] })
    },
    onError: (err: any) => {
      showErrorToast(err?.body?.detail || "Failed to update employee")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: EmsService.deleteEmployee,
    onSuccess: () => {
      showSuccessToast("Employee deleted successfully!")
      setDeletingEmployee(null)
      queryClient.invalidateQueries({ queryKey: ["employees"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
    },
    onError: (err: any) => {
      showErrorToast(err?.body?.detail || "Failed to delete employee")
    },
  })

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      designation: "",
      salary: 85000,
      status: "Active",
      department_id: "",
      create_user_account: false,
      user_password: "password123",
      role: "EMPLOYEE",
    })
  }

  const handleEditClick = (emp: Employee) => {
    setEditingEmployee(emp)
    setFormData({
      first_name: emp.first_name,
      last_name: emp.last_name,
      email: emp.email,
      phone: emp.phone || "",
      designation: emp.designation,
      salary: emp.salary,
      status: emp.status,
      department_id: emp.department_id || "",
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employee Directory</h1>
          <p className="text-sm text-muted-foreground">
            Manage organization members, assignments, roles, and profiles.
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setIsAddOpen(true)
          }}
          className="gap-2 shrink-0"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add Employee</span>
        </Button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, or designation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">All Departments</option>
            {deptsData?.data?.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name} ({dept.code})
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b text-xs uppercase font-semibold text-muted-foreground">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Designation</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Salary</th>
                <th className="px-6 py-4">Joining Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    Loading employees...
                  </td>
                </tr>
              ) : employeesData?.data?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    No employees found matching criteria.
                  </td>
                </tr>
              ) : (
                employeesData?.data?.map((emp) => (
                  <tr key={emp.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                          {emp.first_name[0]}
                          {emp.last_name[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">
                            {emp.first_name} {emp.last_name}
                          </div>
                          <div className="text-xs text-muted-foreground">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">{emp.designation}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted text-xs font-semibold text-foreground">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        {emp.department_name || "Unassigned"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium">${emp.salary?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">{emp.joining_date}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          emp.status === "Active"
                            ? "bg-emerald-500/15 text-emerald-600"
                            : "bg-red-500/15 text-red-600"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${emp.status === "Active" ? "bg-emerald-500" : "bg-red-500"}`} />
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(emp)}
                          className="h-8 px-2 text-xs"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingEmployee(emp)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Employee Modal */}
      {(isAddOpen || editingEmployee) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-bold text-lg">
                {editingEmployee ? "Edit Employee" : "Add New Employee"}
              </h3>
              <button
                onClick={() => {
                  setIsAddOpen(false)
                  setEditingEmployee(null)
                }}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (editingEmployee) {
                  updateMutation.mutate({ id: editingEmployee.id, data: formData })
                } else {
                  createMutation.mutate(formData)
                }
              }}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Work Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Designation *</label>
                  <input
                    type="text"
                    required
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Department</label>
                  <select
                    value={formData.department_id || ""}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Select Department</option>
                    {deptsData?.data?.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Salary ($)</label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 px-3 py-2 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-primary/50"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {!editingEmployee && (
                <div className="p-4 rounded-xl bg-muted/40 border space-y-3">
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.create_user_account}
                      onChange={(e) => setFormData({ ...formData, create_user_account: e.target.checked })}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span>Create User Login Account</span>
                  </label>

                  {formData.create_user_account && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground">Initial Password</label>
                        <input
                          type="password"
                          required
                          value={formData.user_password}
                          onChange={(e) => setFormData({ ...formData, user_password: e.target.value })}
                          className="w-full mt-1 px-3 py-1.5 text-xs bg-background border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground">User Role</label>
                        <select
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                          className="w-full mt-1 px-3 py-1.5 text-xs bg-background border rounded-lg"
                        >
                          <option value="EMPLOYEE">Employee</option>
                          <option value="MANAGER">Manager</option>
                          <option value="HR">HR</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddOpen(false)
                    setEditingEmployee(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingEmployee ? "Save Changes" : "Create Employee"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingEmployee && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-lg text-red-600">Delete Employee</h3>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-semibold text-foreground">{deletingEmployee.first_name} {deletingEmployee.last_name}</span>? This action will remove their record and attendance history.
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setDeletingEmployee(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate(deletingEmployee.id)}
                disabled={deleteMutation.isPending}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmployeesPage

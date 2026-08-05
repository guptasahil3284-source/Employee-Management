import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
  FolderPlus,
  Pencil,
  Trash2,
  Users,
  X,
} from "lucide-react"


import { Button } from "@/components/ui/button"
import useCustomToast from "@/hooks/useCustomToast"
import { Department, DepartmentCreate, EmsService } from "@/services/emsApi"

export const Route = createFileRoute("/_layout/departments")({
  component: DepartmentsPage,
  head: () => ({
    meta: [
      {
        title: "Departments - EMS",
      },
    ],
  }),
})

function DepartmentsPage() {
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const queryClient = useQueryClient()

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [deletingDept, setDeletingDept] = useState<Department | null>(null)

  const [formData, setFormData] = useState<DepartmentCreate>({
    name: "",
    code: "",
    description: "",
  })

  // Queries
  const { data, isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: () => EmsService.readDepartments(),
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: EmsService.createDepartment,
    onSuccess: () => {
      showSuccessToast("Department created successfully!")
      setIsAddOpen(false)
      resetForm()
      queryClient.invalidateQueries({ queryKey: ["departments"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
    },
    onError: (err: any) => {
      showErrorToast(err?.body?.detail || "Failed to create department")
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: DepartmentCreate }) =>
      EmsService.updateDepartment(id, data),
    onSuccess: () => {
      showSuccessToast("Department updated successfully!")
      setEditingDept(null)
      queryClient.invalidateQueries({ queryKey: ["departments"] })
    },
    onError: (err: any) => {
      showErrorToast(err?.body?.detail || "Failed to update department")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: EmsService.deleteDepartment,
    onSuccess: () => {
      showSuccessToast("Department deleted successfully!")
      setDeletingDept(null)
      queryClient.invalidateQueries({ queryKey: ["departments"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
    },
    onError: (err: any) => {
      showErrorToast(err?.body?.detail || "Failed to delete department")
    },
  })

  const resetForm = () => {
    setFormData({ name: "", code: "", description: "" })
  }

  const handleEditClick = (dept: Department) => {
    setEditingDept(dept)
    setFormData({
      name: dept.name,
      code: dept.code,
      description: dept.description || "",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Departments</h1>
          <p className="text-sm text-muted-foreground">
            Manage organization units, operational codes, and team allocations.
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setIsAddOpen(true)
          }}
          className="gap-2 shrink-0"
        >
          <FolderPlus className="h-4 w-4" />
          <span>Add Department</span>
        </Button>
      </div>

      {/* Grid of Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            Loading departments...
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No departments defined yet. Click "Add Department" to create one.
          </div>
        ) : (
          data?.data?.map((dept) => (
            <div
              key={dept.id}
              className="rounded-xl border bg-card p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-mono font-bold text-xs">
                    {dept.code}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditClick(dept)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingDept(dept)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-lg text-foreground">{dept.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {dept.description || "No description provided."}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  <span>{dept.employee_count} Employees</span>
                </div>
                <span>Created {dept.created_at ? new Date(dept.created_at).toLocaleDateString() : "System"}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Modal */}
      {(isAddOpen || editingDept) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-bold text-lg">
                {editingDept ? "Edit Department" : "Create Department"}
              </h3>
              <button
                onClick={() => {
                  setIsAddOpen(false)
                  setEditingDept(null)
                }}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (editingDept) {
                  updateMutation.mutate({ id: editingDept.id, data: formData })
                } else {
                  createMutation.mutate(formData)
                }
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Engineering, Sales, Product"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Department Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ENG, SLS, PRD"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full mt-1 px-3 py-2 text-sm bg-background border rounded-lg font-mono focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Description</label>
                <textarea
                  rows={3}
                  placeholder="Brief summary of functions and responsibilities..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddOpen(false)
                    setEditingDept(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingDept ? "Save Changes" : "Create Department"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingDept && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-lg text-red-600">Delete Department</h3>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-semibold text-foreground">{deletingDept.name} ({deletingDept.code})</span>? Assigned employees will become unassigned.
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setDeletingDept(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate(deletingDept.id)}
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

export default DepartmentsPage

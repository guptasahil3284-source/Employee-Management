import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
  CheckCircle2,
  Plus,
  X,
  XCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import useCustomToast from "@/hooks/useCustomToast"
import {
  EmsService,
  LeaveCreate,
  LeaveStatusUpdate,
} from "@/services/emsApi"

export const Route = createFileRoute("/_layout/leave")({
  component: LeavePage,
  head: () => ({
    meta: [
      {
        title: "Leave Center - EMS",
      },
    ],
  }),
})

function LeavePage() {
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<"history" | "approvals">("history")

  // Modal State
  const [isApplyOpen, setIsApplyOpen] = useState(false)

  const [formData, setFormData] = useState<LeaveCreate>({
    leave_type: "Annual",
    reason: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
  })

  // Queries
  const { data: allLeavesData, isLoading: isAllLoading } = useQuery({
    queryKey: ["all-leaves"],
    queryFn: () => EmsService.readLeaves(),
  })


  // Mutations
  const applyMutation = useMutation({
    mutationFn: EmsService.applyLeave,
    onSuccess: () => {
      showSuccessToast("Leave application submitted successfully!")
      setIsApplyOpen(false)
      setFormData({
        leave_type: "Annual",
        reason: "",
        start_date: new Date().toISOString().split("T")[0],
        end_date: new Date().toISOString().split("T")[0],
      })
      queryClient.invalidateQueries({ queryKey: ["my-leaves"] })
      queryClient.invalidateQueries({ queryKey: ["all-leaves"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
    },
    onError: (err: any) => {
      showErrorToast(err?.body?.detail || "Failed to submit leave application")
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: LeaveStatusUpdate }) =>
      EmsService.updateLeaveStatus(id, data),
    onSuccess: (_, variables) => {
      showSuccessToast(`Leave request ${variables.data.status.toLowerCase()}!`)
      queryClient.invalidateQueries({ queryKey: ["my-leaves"] })
      queryClient.invalidateQueries({ queryKey: ["all-leaves"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
    },

    onError: (err: any) => {
      showErrorToast(err?.body?.detail || "Failed to update leave status")
    },
  })

  const pendingLeaves = allLeavesData?.data?.filter((l) => l.status === "Pending") || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leave Management Center</h1>
          <p className="text-sm text-muted-foreground">
            Apply for leave, track balances, and review employee leave requests.
          </p>
        </div>
        <Button onClick={() => setIsApplyOpen(true)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          <span>Apply for Leave</span>
        </Button>
      </div>

      {/* Balance Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
            <span>Annual Leave</span>
            <span className="text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">18 Available</span>
          </div>
          <div className="text-2xl font-bold mt-2">18 / 20 Days</div>
          <p className="text-xs text-muted-foreground mt-1">Paid vacation allocation</p>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
            <span>Sick Leave</span>
            <span className="text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full font-bold">10 Available</span>
          </div>
          <div className="text-2xl font-bold mt-2">10 / 12 Days</div>
          <p className="text-xs text-muted-foreground mt-1">Medical & recovery allowance</p>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
            <span>Casual Leave</span>
            <span className="text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-full font-bold">5 Available</span>
          </div>
          <div className="text-2xl font-bold mt-2">5 / 7 Days</div>
          <p className="text-xs text-muted-foreground mt-1">Personal urgent leave</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b pb-1">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "history"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Leave History & Requests
          </button>
          <button
            onClick={() => setActiveTab("approvals")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "approvals"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Pending Approvals Queue</span>
            {pendingLeaves.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white">
                {pendingLeaves.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab 1: Leave History & Requests */}
      {activeTab === "history" && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b text-xs uppercase font-semibold text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Leave Type</th>
                  <th className="px-6 py-4">Date Range</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isAllLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      Loading leave records...
                    </td>
                  </tr>
                ) : allLeavesData?.data?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      No leave requests submitted yet.
                    </td>
                  </tr>
                ) : (
                  allLeavesData?.data?.map((leave) => (
                    <tr key={leave.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground">{leave.employee_name}</div>
                        <div className="text-xs text-muted-foreground">{leave.department_name || "General"}</div>
                      </td>
                      <td className="px-6 py-4 font-medium">{leave.leave_type}</td>
                      <td className="px-6 py-4 text-xs font-mono">
                        {leave.start_date} → {leave.end_date}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold">{leave.total_days} day(s)</td>
                      <td className="px-6 py-4 text-xs text-muted-foreground max-w-xs truncate">
                        {leave.reason}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            leave.status === "Approved"
                              ? "bg-emerald-500/15 text-emerald-600"
                              : leave.status === "Rejected"
                              ? "bg-red-500/15 text-red-600"
                              : "bg-amber-500/15 text-amber-600"
                          }`}
                        >
                          {leave.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Pending Approvals Queue (Admin / HR / Manager) */}
      {activeTab === "approvals" && (
        <div className="space-y-4">
          {pendingLeaves.length === 0 ? (
            <div className="p-12 text-center rounded-xl border bg-card text-muted-foreground">
              No pending leave requests requiring approval.
            </div>
          ) : (
            pendingLeaves.map((leave) => (
              <div
                key={leave.id}
                className="p-6 rounded-xl border bg-card shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base">{leave.employee_name}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                      {leave.department_name || "General"}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {leave.leave_type} Leave ({leave.total_days} day(s))
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Dates: <span className="font-mono text-foreground font-medium">{leave.start_date}</span> to{" "}
                    <span className="font-mono text-foreground font-medium">{leave.end_date}</span>
                  </div>
                  <p className="text-xs text-muted-foreground italic bg-muted/30 p-2 rounded-lg mt-2">
                    "{leave.reason}"
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Button
                    onClick={() =>
                      updateStatusMutation.mutate({
                        id: leave.id,
                        data: { status: "Approved", comments: "Approved by HR/Manager" },
                      })
                    }
                    disabled={updateStatusMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Approve</span>
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() =>
                      updateStatusMutation.mutate({
                        id: leave.id,
                        data: { status: "Rejected", comments: "Not approved at this time" },
                      })
                    }
                    disabled={updateStatusMutation.isPending}
                    className="gap-1.5"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Reject</span>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Apply for Leave Modal */}
      {isApplyOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-bold text-lg">Apply for Leave</h3>
              <button
                onClick={() => setIsApplyOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                applyMutation.mutate(formData)
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Leave Type *</label>
                <select
                  value={formData.leave_type}
                  onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-primary/50"
                >
                  <option value="Annual">Annual Leave</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Casual">Casual Leave</option>
                  <option value="Unpaid">Unpaid Leave</option>
                  <option value="Maternity">Maternity Leave</option>
                  <option value="Paternity">Paternity Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">End Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Reason / Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide brief explanation for leave application..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsApplyOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={applyMutation.isPending}>
                  Submit Application
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default LeavePage

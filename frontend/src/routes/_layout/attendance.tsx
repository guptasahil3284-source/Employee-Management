import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
  Calendar,
  CheckCircle2,
  Clock,
  LogOut,
} from "lucide-react"


import { Button } from "@/components/ui/button"
import useCustomToast from "@/hooks/useCustomToast"
import { EmsService } from "@/services/emsApi"

export const Route = createFileRoute("/_layout/attendance")({
  component: AttendancePage,
  head: () => ({
    meta: [
      {
        title: "Attendance Roster - EMS",
      },
    ],
  }),
})

function AttendancePage() {
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const queryClient = useQueryClient()

  const [targetDate, setTargetDate] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("")

  // Fetch current user's today attendance
  const { data: todayAtt } = useQuery({
    queryKey: ["today-attendance"],
    queryFn: EmsService.getTodayAttendance,
  })

  // Fetch full attendance roster
  const { data: rosterData, isLoading } = useQuery({
    queryKey: ["attendance-roster", targetDate, statusFilter],
    queryFn: () =>
      EmsService.readAttendances({
        target_date: targetDate || undefined,
        status: statusFilter || undefined,
      }),
  })

  // Mutations
  const checkInMutation = useMutation({
    mutationFn: EmsService.checkIn,
    onSuccess: () => {
      showSuccessToast("Successfully checked in!")
      queryClient.invalidateQueries({ queryKey: ["today-attendance"] })
      queryClient.invalidateQueries({ queryKey: ["attendance-roster"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
    },
    onError: (err: any) => {
      showErrorToast(err?.body?.detail || "Failed to check in")
    },
  })

  const checkOutMutation = useMutation({
    mutationFn: EmsService.checkOut,
    onSuccess: () => {
      showSuccessToast("Successfully checked out!")
      queryClient.invalidateQueries({ queryKey: ["today-attendance"] })
      queryClient.invalidateQueries({ queryKey: ["attendance-roster"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
    },
    onError: (err: any) => {
      showErrorToast(err?.body?.detail || "Failed to check out")
    },
  })

  const isCheckedIn = !!todayAtt?.check_in
  const isCheckedOut = !!todayAtt?.check_out

  const formatTime = (dtStr?: string) => {
    if (!dtStr) return "--:--"
    const dt = new Date(dtStr)
    return dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="space-y-6">
      {/* Header Banner & Live Clock Widget */}
      <div className="rounded-2xl border bg-card p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Clock className="h-3.5 w-3.5" />
            <span>Time & Attendance Portal</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Daily Attendance Management
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg">
            Record your attendance timestamp and view organization-wide logs in real time.
          </p>
        </div>

        {/* Action Panel */}
        <div className="flex flex-col sm:flex-row items-center gap-3 p-4 rounded-xl bg-muted/40 border w-full md:w-auto">
          <div className="text-center sm:text-left sm:pr-4 sm:border-r border-border">
            <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Your Shift Today</div>
            <div className="text-sm font-bold text-foreground">
              {isCheckedOut ? "Completed" : isCheckedIn ? "Active Shift" : "Not Checked In"}
            </div>
            {todayAtt?.check_in && (
              <div className="text-[11px] text-muted-foreground">In: {formatTime(todayAtt.check_in)}</div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isCheckedIn ? (
              <Button
                onClick={() => checkInMutation.mutate()}
                disabled={checkInMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold shadow-md"
              >
                <Clock className="h-4 w-4" />
                <span>Check In Now</span>
              </Button>
            ) : !isCheckedOut ? (
              <Button
                onClick={() => checkOutMutation.mutate()}
                disabled={checkOutMutation.isPending}
                className="bg-amber-600 hover:bg-amber-700 text-white gap-2 font-semibold shadow-md"
              >
                <LogOut className="h-4 w-4" />
                <span>Check Out</span>
              </Button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 text-xs font-bold">
                <CheckCircle2 className="h-4 w-4" />
                <span>Shift Ended</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Roster Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <h2 className="font-bold text-lg">Attendance Roster Log</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="px-3 py-2 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-primary/50"
          >
            <option value="">All Statuses</option>
            <option value="Checked In">Checked In</option>
            <option value="Present">Present</option>
            <option value="Late">Late</option>
            <option value="Absent">Absent</option>
          </select>
        </div>
      </div>

      {/* Roster Data Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b text-xs uppercase font-semibold text-muted-foreground">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Check In Time</th>
                <th className="px-6 py-4">Check Out Time</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    Loading attendance roster...
                  </td>
                </tr>
              ) : rosterData?.data?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                rosterData?.data?.map((att) => (
                  <tr key={att.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 font-semibold text-foreground">
                      {att.employee_name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {att.department_name || "General"}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono">{att.date}</td>
                    <td className="px-6 py-4 text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400">
                      {formatTime(att.check_in)}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono font-medium text-amber-600 dark:text-amber-400">
                      {formatTime(att.check_out)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          att.status === "Present"
                            ? "bg-emerald-500/15 text-emerald-600"
                            : att.status === "Checked In"
                            ? "bg-blue-500/15 text-blue-600"
                            : att.status === "Late"
                            ? "bg-amber-500/15 text-amber-600"
                            : "bg-red-500/15 text-red-600"
                        }`}
                      >
                        {att.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AttendancePage

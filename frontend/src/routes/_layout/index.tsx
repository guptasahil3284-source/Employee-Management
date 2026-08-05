import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  LogOut,
  UserCheck,
  Users,
} from "lucide-react"


import { Button } from "@/components/ui/button"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { EmsService } from "@/services/emsApi"

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
  head: () => ({
    meta: [
      {
        title: "EMS Executive Dashboard",
      },
    ],
  }),
})

function Dashboard() {
  const { user: currentUser } = useAuth()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const queryClient = useQueryClient()

  // Fetch Dashboard Stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: EmsService.getDashboardStats,
  })

  // Fetch today's attendance status for current user
  const { data: todayAttendance } = useQuery({
    queryKey: ["today-attendance"],
    queryFn: EmsService.getTodayAttendance,
  })

  // Check In Mutation
  const checkInMutation = useMutation({
    mutationFn: EmsService.checkIn,
    onSuccess: () => {
      showSuccessToast("Successfully checked in for today!")
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
      queryClient.invalidateQueries({ queryKey: ["today-attendance"] })
    },
    onError: (err: any) => {
      showErrorToast(err?.body?.detail || "Failed to check in")
    },
  })

  // Check Out Mutation
  const checkOutMutation = useMutation({
    mutationFn: EmsService.checkOut,
    onSuccess: () => {
      showSuccessToast("Successfully checked out for today!")
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
      queryClient.invalidateQueries({ queryKey: ["today-attendance"] })
    },
    onError: (err: any) => {
      showErrorToast(err?.body?.detail || "Failed to check out")
    },
  })

  const isCheckedIn = !!todayAttendance?.check_in
  const isCheckedOut = !!todayAttendance?.check_out

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white/90 border border-white/20">
              <Building2 className="h-3.5 w-3.5" />
              <span>Enterprise Employee Management</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
              Welcome back, {currentUser?.full_name || currentUser?.email} 👋
            </h1>
            <p className="text-blue-100 max-w-xl text-sm md:text-base">
              Monitor team performance, track daily attendance, manage leave requests, and orchestrate departments in real time.
            </p>
          </div>

          {/* Quick Check-In / Check-Out Widget */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <div className="text-center sm:text-left">
              <div className="text-xs text-blue-100 font-medium">Today's Status</div>
              <div className="font-semibold text-sm">
                {isCheckedOut
                  ? "Checked Out Today"
                  : isCheckedIn
                  ? "Checked In (Active)"
                  : "Not Checked In Yet"}
              </div>
            </div>
            {!isCheckedIn ? (
              <Button
                onClick={() => checkInMutation.mutate()}
                disabled={checkInMutation.isPending}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold gap-2 border-0 shadow-lg"
              >
                <Clock className="h-4 w-4" />
                <span>Check In Now</span>
              </Button>
            ) : !isCheckedOut ? (
              <Button
                onClick={() => checkOutMutation.mutate()}
                disabled={checkOutMutation.isPending}
                className="bg-amber-500 hover:bg-amber-600 text-white font-semibold gap-2 border-0 shadow-lg"
              >
                <LogOut className="h-4 w-4" />
                <span>Check Out</span>
              </Button>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-emerald-200 bg-emerald-500/20 px-3 py-1.5 rounded-lg border border-emerald-400/30">
                <CheckCircle2 className="h-4 w-4" />
                <span>Completed</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Employees */}
        <div className="rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Workforce
            </span>
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold">{isLoading ? "..." : stats?.total_employees || 0}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{stats?.active_employees || 0} Active</span> employees
            </p>
          </div>
        </div>

        {/* Card 2: Departments */}
        <div className="rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Departments
            </span>
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-600 dark:text-purple-400">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold">{isLoading ? "..." : stats?.total_departments || 0}</div>
            <p className="mt-1 text-xs text-muted-foreground">Functional business units</p>
          </div>
        </div>

        {/* Card 3: Attendance Rate */}
        <div className="rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Attendance Today
            </span>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold">
              {isLoading ? "..." : `${stats?.attendance_rate || 0}%`}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{stats?.present_today || 0} checked in</span> today
            </p>
          </div>
        </div>

        {/* Card 4: Pending Leaves */}
        <div className="rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pending Approvals
            </span>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
              <CalendarDays className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold">{isLoading ? "..." : stats?.pending_leaves || 0}</div>
            <p className="mt-1 text-xs text-muted-foreground">Leave requests requiring review</p>
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Department Distribution & Quick Shortcuts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Department Breakdown Card */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div>
                <h3 className="font-bold text-lg">Department Distribution</h3>
                <p className="text-xs text-muted-foreground">Employee count allocation per department</p>
              </div>
              <Link to="/departments" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stats?.department_counts?.map((dept) => {
                const pct = stats.total_employees ? Math.round((dept.count / stats.total_employees) * 100) : 0
                return (
                  <div key={dept.code} className="p-4 rounded-lg bg-muted/40 border space-y-2">
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <span>{dept.name} ({dept.code})</span>
                      <span className="text-xs font-mono text-muted-foreground">{dept.count} members</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick Management Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to="/employees"
              className="group p-5 rounded-xl border bg-card shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between"
            >
              <div className="rounded-lg w-10 h-10 flex items-center justify-center bg-blue-500/10 text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Manage Directory</h4>
                <p className="text-xs text-muted-foreground">Add, filter & edit employee profiles</p>
              </div>
            </Link>

            <Link
              to="/attendance"
              className="group p-5 rounded-xl border bg-card shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between"
            >
              <div className="rounded-lg w-10 h-10 flex items-center justify-center bg-emerald-500/10 text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Attendance Roster</h4>
                <p className="text-xs text-muted-foreground">View real-time daily log reports</p>
              </div>
            </Link>

            <Link
              to="/leave"
              className="group p-5 rounded-xl border bg-card shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between"
            >
              <div className="rounded-lg w-10 h-10 flex items-center justify-center bg-amber-500/10 text-amber-600 mb-4 group-hover:scale-110 transition-transform">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Leave Center</h4>
                <p className="text-xs text-muted-foreground">Approve requests & check balances</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Right 1 Col: Recent Leave Requests & Activity */}
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm">Recent Leave Requests</h3>
              <Link to="/leave" className="text-xs text-primary font-medium hover:underline">
                Manage
              </Link>
            </div>

            <div className="space-y-3">
              {stats?.recent_leaves?.length === 0 && (
                <p className="text-xs text-muted-foreground py-4 text-center">No recent leave requests</p>
              )}
              {stats?.recent_leaves?.map((leave) => (
                <div key={leave.id} className="p-3 rounded-lg border bg-muted/30 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-xs truncate">{leave.employee_name}</div>
                    <div className="text-[11px] text-muted-foreground">{leave.leave_type} • {leave.total_days} day(s)</div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      leave.status === "Approved"
                        ? "bg-emerald-500/15 text-emerald-600"
                        : leave.status === "Rejected"
                        ? "bg-red-500/15 text-red-600"
                        : "bg-amber-500/15 text-amber-600"
                    }`}
                  >
                    {leave.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm">Recent Attendance Log</h3>
              <Link to="/attendance" className="text-xs text-primary font-medium hover:underline">
                View Roster
              </Link>
            </div>

            <div className="space-y-3">
              {stats?.recent_attendances?.length === 0 && (
                <p className="text-xs text-muted-foreground py-4 text-center">No attendance logs today</p>
              )}
              {stats?.recent_attendances?.map((att) => (
                <div key={att.id} className="p-3 rounded-lg border bg-muted/30 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-xs">{att.employee_name}</div>
                    <div className="text-[11px] text-muted-foreground">{att.department_name || "General"}</div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600">
                      {att.status}
                    </span>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{att.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

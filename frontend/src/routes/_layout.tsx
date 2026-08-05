import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { Building2, ShieldCheck, UserCheck } from "lucide-react"

import { Footer } from "@/components/Common/Footer"
import AppSidebar from "@/components/Sidebar/AppSidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout")({
  component: Layout,
  beforeLoad: async () => {
    if (!isLoggedIn()) {
      throw redirect({
        to: "/login",
      })
    }
  },
})

function Layout() {
  const { user: currentUser } = useAuth()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background/80 backdrop-blur px-4 md:px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="-ml-1 text-muted-foreground" />
            <div className="hidden sm:flex items-center gap-2 text-sm font-semibold text-foreground/80">
              <Building2 className="h-4 w-4 text-primary" />
              <span>Enterprise Employee Management System</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {currentUser?.is_superuser ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/15 px-3 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400 border border-purple-500/30">
                <ShieldCheck className="h-3.5 w-3.5" />
                SYSTEM ADMIN
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/30">
                <UserCheck className="h-3.5 w-3.5" />
                {(currentUser as any)?.role || "EMPLOYEE"}
              </span>
            )}
          </div>

        </header>
        <main className="flex-1 p-6 md:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
        <Footer />
      </SidebarInset>
    </SidebarProvider>
  )
}


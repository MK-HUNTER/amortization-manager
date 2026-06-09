import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Wallet,
  PlusCircle,
  FileText,
  BarChart3,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/loans", label: "Loans", icon: Wallet },
  { to: "/loans/new", label: "Add New Loan", icon: PlusCircle },
  { to: "/summary", label: "Loan Summary", icon: FileText },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/analytics", label: "Analytics & Simulator", icon: TrendingUp },
] as const;

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen transform bg-sidebar text-sidebar-foreground transition-[width,transform] duration-300 ease-in-out lg:translate-x-0 will-change-[width]",
          sidebarCollapsed ? "w-20" : "w-72",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center border-b border-sidebar-border px-[22px]">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div
              className={cn(
                "transition-[max-width,opacity] duration-300 ease-in-out overflow-hidden whitespace-nowrap",
                sidebarCollapsed ? "max-w-0 opacity-0" : "max-w-48 opacity-100",
              )}
            >
              <div className="text-base font-semibold tracking-tight">Amortix</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/60">
                Loan Suite
              </div>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "rounded-md p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent lg:hidden ml-auto transition-opacity duration-300",
              sidebarCollapsed ? "opacity-0 pointer-events-none" : "opacity-100",
            )}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="py-6 px-3">
          <div
            className={cn(
              "px-3 pb-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/50 transition-[max-height,opacity,margin] duration-300 ease-in-out overflow-hidden whitespace-nowrap",
              sidebarCollapsed ? "max-h-0 opacity-0 mb-0" : "max-h-10 opacity-100 mb-2",
            )}
          >
            Workspace
          </div>
          <ul className="space-y-1">
            {nav.map((item) => {
              const active =
                item.to === "/"
                  ? pathname === "/"
                  : pathname === item.to || pathname.startsWith(item.to + "/");
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={cn(
                      "relative flex items-center rounded-xl py-2.5 text-sm font-medium transition-all duration-300 ease-in-out",
                      sidebarCollapsed ? "px-[19px] gap-0" : "px-3 gap-3",
                      active
                        ? "bg-sidebar-accent text-white"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-white",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="sidebar-active"
                        className="absolute inset-y-1 left-0 w-1 rounded-r-full bg-gradient-primary"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                    <span
                      className={cn(
                        "transition-[max-width,opacity] duration-300 ease-in-out overflow-hidden whitespace-nowrap",
                        sidebarCollapsed ? "max-w-0 opacity-0" : "max-w-48 opacity-100",
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div
          className={cn(
            "absolute inset-x-3 bottom-14 rounded-2xl border border-sidebar-border bg-sidebar-accent/40 p-4 transition-all duration-300 ease-in-out overflow-hidden",
            sidebarCollapsed
              ? "opacity-0 scale-95 pointer-events-none max-h-0 p-0 border-none"
              : "opacity-100 scale-100 max-h-40",
          )}
        >
          <div className="text-sm font-semibold">Need precision?</div>
          <p className="mt-1 text-xs text-sidebar-foreground/70">
            Export any schedule to Excel with full breakdowns.
          </p>
        </div>

        <div className="absolute inset-x-0 bottom-3 h-9">
          <button
            onClick={toggleSidebarCollapsed}
            className="absolute bottom-0 flex h-9 w-9 items-center justify-center rounded-xl border border-sidebar-border bg-sidebar-accent/20 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white transition-all duration-300 ease-in-out cursor-pointer outline-none focus:ring-1 focus:ring-ring/30 will-change-[left]"
            style={{
              left: sidebarCollapsed ? "22px" : "240px",
            }}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4.5 w-4.5" />
            ) : (
              <ChevronLeft className="h-4.5 w-4.5" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

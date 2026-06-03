import { Link, useRouterState } from '@tanstack/react-router';
import { LayoutDashboard, Wallet, PlusCircle, FileText, BarChart3, X, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUIStore } from '@/store/ui-store';
import { cn } from '@/lib/utils';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/loans', label: 'Loans', icon: Wallet },
  { to: '/loans/new', label: 'Add New Loan', icon: PlusCircle },
  { to: '/summary', label: 'Loan Summary', icon: FileText },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
] as const;

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useUIStore();
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
          'fixed top-0 left-0 z-40 h-screen w-72 transform bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-base font-semibold tracking-tight">Amortix</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/60">
                Loan Suite
              </div>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="px-3 py-6">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/50">
            Workspace
          </div>
          <ul className="space-y-1">
            {nav.map((item) => {
              const active =
                item.to === '/'
                  ? pathname === '/'
                  : pathname === item.to || pathname.startsWith(item.to + '/');
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-sidebar-accent text-white'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-white',
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="sidebar-active"
                        className="absolute inset-y-1 left-0 w-1 rounded-r-full bg-gradient-primary"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="absolute inset-x-3 bottom-4 rounded-2xl border border-sidebar-border bg-sidebar-accent/40 p-4">
          <div className="text-sm font-semibold">Need precision?</div>
          <p className="mt-1 text-xs text-sidebar-foreground/70">
            Export any schedule to Excel with full breakdowns.
          </p>
        </div>
      </aside>
    </>
  );
}

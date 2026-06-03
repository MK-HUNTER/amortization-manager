import { Bell, Menu, Moon, Search, Sun, User2 } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect } from 'react';
import { useUIStore } from '@/store/ui-store';

export function Topbar() {
  const { toggleSidebar, theme, toggleTheme } = useUIStore();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme]);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-2 text-muted-foreground hover:bg-accent lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden flex-1 max-w-md md:flex">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search loans, banks, payments…"
              className="h-10 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="hidden text-right md:block">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Today</div>
            <div className="text-sm font-medium">{format(new Date(), 'EEE, MMM d, yyyy')}</div>
          </div>
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>
          <button
            className="relative rounded-lg p-2 text-muted-foreground hover:bg-accent"
            aria-label="Notifications"
          >
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
          </button>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card py-1.5 pl-1.5 pr-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-primary text-xs font-semibold text-white">
              <User2 className="h-4 w-4" />
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-semibold leading-tight">Treasury</div>
              <div className="text-[10px] text-muted-foreground leading-tight">Admin workspace</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

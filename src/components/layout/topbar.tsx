import { Bell, Menu, Moon, Search, Sun, User2 } from "lucide-react";
import { format } from "date-fns";
import { useEffect } from "react";
import { useUIStore } from "@/store/ui-store";

export function Topbar() {
  const { toggleSidebar, theme, toggleTheme, setCommandMenuOpen } = useUIStore();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
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

        <button
          onClick={() => setCommandMenuOpen(true)}
          className="hidden md:flex items-center gap-2 h-10 w-full max-w-xs rounded-xl border border-input bg-card px-3 text-left text-sm text-muted-foreground hover:bg-accent/40 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring/30 transition-colors"
        >
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1">Search or press ⌘K...</span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-[9px]">Ctrl</span>K
          </kbd>
        </button>


        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="hidden text-right md:block">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Today</div>
            <div className="text-sm font-medium">{format(new Date(), "EEE, MMM d, yyyy")}</div>
          </div>
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
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

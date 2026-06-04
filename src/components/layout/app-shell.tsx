import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { Link } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col surface-mesh">
      <Sidebar />
      <div className="lg:pl-72 flex flex-col flex-1">
        <Topbar />
        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 flex-1">{children}</main>
        <footer className="border-t border-border/40 py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center text-xs text-muted-foreground bg-background/20 backdrop-blur-sm">
          <div>© {new Date().getFullYear()} Amortix. All rights reserved.</div>
          <Link
            to="/docs"
            className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors font-medium"
            title="Documentation & Presentation"
          >
            <BookOpen className="h-4 w-4 text-primary" />
            <span>Documentation & Slides</span>
          </Link>
        </footer>
      </div>
    </div>
  );
}

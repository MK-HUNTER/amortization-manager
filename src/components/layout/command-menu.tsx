import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useUIStore } from "@/store/ui-store";
import { listLoans } from "@/lib/loans/loans.functions";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { Calculator, FileText, Plus, Sun, Moon, LayoutDashboard } from "lucide-react";
import type { LoanRow } from "@/lib/loans/schema";

export function CommandMenu() {
  const { commandMenuOpen, setCommandMenuOpen, toggleTheme, theme } = useUIStore();
  const navigate = useNavigate();

  // Load loans for search
  const { data } = useQuery({
    queryKey: ["loans"],
    queryFn: () => listLoans(),
  });
  const loans = (data?.loans as LoanRow[]) || [];

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandMenuOpen(!commandMenuOpen);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [commandMenuOpen, setCommandMenuOpen]);

  const handleSelect = (callback: () => void) => {
    setCommandMenuOpen(false);
    callback();
  };

  return (
    <CommandDialog open={commandMenuOpen} onOpenChange={setCommandMenuOpen}>
      <CommandInput placeholder="Type a command or search loans..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {loans.length > 0 && (
          <CommandGroup heading="Loans">
            {loans.map((loan) => (
              <CommandItem
                key={loan.id}
                value={`${loan.bank_name} ${loan.loan_number} ${loan.purpose || ""}`}
                onSelect={() =>
                  handleSelect(() => navigate({ to: "/loans/$id", params: { id: loan.id } }))
                }
              >
                <Calculator className="mr-2 h-4 w-4 text-primary" />
                <span>{loan.bank_name}</span>
                <span className="ml-2 text-xs text-muted-foreground">#{loan.loan_number}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          <CommandItem
            value="Dashboard Home Overview"
            onSelect={() => handleSelect(() => navigate({ to: "/" }))}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem
            value="Add New Loan Create Register"
            onSelect={() => handleSelect(() => navigate({ to: "/loans/new" }))}
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>Add New Loan</span>
          </CommandItem>
          <CommandItem
            value="Reports Analytics Charts"
            onSelect={() => handleSelect(() => navigate({ to: "/reports" }))}
          >
            <FileText className="mr-2 h-4 w-4" />
            <span>Reports</span>
          </CommandItem>
          <CommandItem
            value="Documentation Slides Help Guides Presentation"
            onSelect={() => handleSelect(() => navigate({ to: "/docs" }))}
          >
            <FileText className="mr-2 h-4 w-4" />
            <span>Documentation & Slides</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          <CommandItem
            value="Switch Theme Dark Light Mode Toggle"
            onSelect={() => handleSelect(() => toggleTheme())}
          >
            {theme === "dark" ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            <span>Switch to {theme === "dark" ? "Light" : "Dark"} Mode</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

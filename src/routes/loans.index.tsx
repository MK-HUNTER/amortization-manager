import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { queryOptions, useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  PlusCircle,
  Search,
  Trash2,
  Wallet,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

import { deleteLoan, listLoans } from '@/lib/loans/loans.functions';
import { calculateEmi } from '@/lib/loans/amortization';
import { currency, percent } from '@/lib/format';
import { StatusBadge } from '@/components/ui/status-badge';
import type { LoanRow } from '@/lib/loans/schema';

const loansQuery = queryOptions({ queryKey: ['loans'], queryFn: () => listLoans() });

export const Route = createFileRoute('/loans/')({
  head: () => ({
    meta: [
      { title: 'Loans · Amortix' },
      { name: 'description', content: 'Enterprise loan registry with sorting, search, and pagination.' },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(loansQuery),
  component: LoansPage,
});

function LoansPage() {
  const { data } = useSuspenseQuery(loansQuery);
  const loans = data.loans as LoanRow[];
  const [sorting, setSorting] = useState<SortingState>([{ id: 'created_at', desc: true }]);
  const [globalFilter, setGlobalFilter] = useState('');
  const router = useRouter();
  const qc = useQueryClient();
  const deleteFn = useServerFn(deleteLoan);

  const columns = useMemo<ColumnDef<LoanRow>[]>(
    () => [
      {
        accessorKey: 'bank_name',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Bank / Loan # <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <Link
            to="/loans/$id"
            params={{ id: row.original.id }}
            className="block font-medium hover:text-primary"
          >
            {row.original.bank_name}
            <div className="text-[11px] font-normal text-muted-foreground">
              #{row.original.loan_number}
            </div>
          </Link>
        ),
      },
      { accessorKey: 'purpose', header: 'Purpose', cell: ({ getValue }) => (getValue() as string) ?? '—' },
      {
        accessorKey: 'borrowed_amount',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Amount <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ getValue }) => <span className="font-medium">{currency(Number(getValue()))}</span>,
      },
      {
        accessorKey: 'interest_rate',
        header: 'Rate',
        cell: ({ getValue }) => percent(Number(getValue())),
      },
      {
        accessorKey: 'tenure_months',
        header: 'Tenure',
        cell: ({ getValue }) => `${getValue()} mo`,
      },
      {
        id: 'emi',
        header: 'EMI',
        cell: ({ row }) =>
          currency(
            calculateEmi(
              Number(row.original.borrowed_amount),
              Number(row.original.interest_rate),
              Number(row.original.tenure_months),
            ),
          ),
      },
      {
        accessorKey: 'start_date',
        header: 'Start',
        cell: ({ getValue }) => format(parseISO(getValue() as string), 'MMM d, yyyy'),
      },
      {
        accessorKey: 'loan_status',
        header: 'Status',
        cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Link
              to="/loans/$id"
              params={{ id: row.original.id }}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              title="View"
            >
              <Eye className="h-4 w-4" />
            </Link>
            <button
              onClick={async () => {
                if (!confirm(`Delete loan ${row.original.loan_number}?`)) return;
                try {
                  await deleteFn({ data: { id: row.original.id } });
                  await qc.invalidateQueries({ queryKey: ['loans'] });
                  router.invalidate();
                  toast.success('Loan deleted');
                } catch (e) {
                  toast.error((e as Error).message);
                }
              }}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [deleteFn, qc, router],
  );

  const table = useReactTable({
    data: loans,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Registry
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Loans</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loans.length} record{loans.length === 1 ? '' : 's'} — sort, search, and drill into any loan.
          </p>
        </div>
        <Link
          to="/loans/new"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-white shadow-card transition-transform hover:-translate-y-0.5 hover:shadow-glow"
        >
          <PlusCircle className="h-4 w-4" /> Add new loan
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl"
      >
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search bank, loan number, purpose…"
              className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <div className="text-xs text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} / {Math.max(table.getPageCount(), 1)}
          </div>
        </div>

        {loans.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <Wallet className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold">No loans yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Add your first loan to populate the registry.</p>
            <Link
              to="/loans/new"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-white shadow-card"
            >
              <PlusCircle className="h-4 w-4" /> Add a loan
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-card">
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id} className="border-b border-border text-left">
                      {hg.headers.map((h) => (
                        <th
                          key={h.id}
                          className="px-5 py-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
                        >
                          {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border-b border-border/60 last:border-0 hover:bg-accent/40">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-5 py-3 align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-border p-4 text-sm">
              <div className="text-xs text-muted-foreground">
                Showing {table.getRowModel().rows.length} of {loans.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="rounded-lg border border-border p-1.5 disabled:opacity-40 hover:bg-accent"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="rounded-lg border border-border p-1.5 disabled:opacity-40 hover:bg-accent"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

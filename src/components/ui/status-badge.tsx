import { cn } from '@/lib/utils';

const tone: Record<string, string> = {
  active: 'bg-success/15 text-success ring-1 ring-success/25',
  closed: 'bg-muted text-muted-foreground ring-1 ring-border',
  overdue: 'bg-destructive/15 text-destructive ring-1 ring-destructive/25',
};

export function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize',
        tone[key] ?? tone.closed,
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          key === 'active' ? 'bg-success' : key === 'overdue' ? 'bg-destructive' : 'bg-muted-foreground',
        )}
      />
      {status}
    </span>
  );
}

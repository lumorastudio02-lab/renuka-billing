import type { ReactNode, InputHTMLAttributes, SelectHTMLAttributes } from "react";
import type { DueStatus } from "@/lib/store";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 shadow-sm ${className}`}>{children}</div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  accent = "text-primary",
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
  accent?: string;
}) {
  return (
    <Card className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 truncate text-2xl font-semibold text-foreground">{value}</p>
      </div>
      {icon && <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary ${accent}`}>{icon}</span>}
    </Card>
  );
}

const statusStyles: Record<string, string> = {
  "Due Today": "bg-warning/15 text-warning-foreground text-[oklch(0.45_0.14_75)]",
  "Due Tomorrow": "bg-primary/10 text-primary",
  Upcoming: "bg-primary/10 text-primary",
  Overdue: "bg-destructive/10 text-destructive",
  Paid: "bg-success/15 text-[oklch(0.45_0.13_155)]",
  "No Due": "bg-secondary text-muted-foreground",
};

export function StatusBadge({ status }: { status: DueStatus | string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[status] ?? "bg-secondary text-muted-foreground"}`}>
      {status}
    </span>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

const base =
  "w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-secondary disabled:text-muted-foreground";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${base} ${props.className ?? ""}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${base} ${props.className ?? ""}`} />;
}

export function Btn({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "ghost" | "danger" }) {
  const variants = {
    primary: "bg-primary text-primary-foreground hover:opacity-90",
    outline: "border border-border bg-card text-foreground hover:bg-secondary",
    ghost: "text-primary hover:bg-primary/10",
    danger: "border border-destructive/30 text-destructive hover:bg-destructive/10",
  };
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${variants[variant]} ${className}`}
    />
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-2xl rounded-2xl bg-card p-5 shadow-xl sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-muted-foreground hover:bg-secondary">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EmptyRow({ text = "No records found", cols = 6 }: { text?: string; cols?: number }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-10 text-center text-sm text-muted-foreground">
        {text}
      </td>
    </tr>
  );
}

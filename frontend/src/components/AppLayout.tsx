import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  IndianRupee,
  History,
  ReceiptText,
  BellRing,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import logoAsset from "@/assets/logo.png.asset.json";
import { getSettings, isLoggedIn, logout } from "@/lib/store";
import { useAppData } from "@/lib/useAppData";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/students", label: "Students", icon: Users },
  { to: "/fee-collection", label: "Fee Collection", icon: IndianRupee },
  { to: "/payment-history", label: "Payment History", icon: History },
  { to: "/receipts", label: "Receipts", icon: ReceiptText },
  { to: "/reminders", label: "Reminders", icon: BellRing },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function AppLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useAppData();

  useEffect(() => {
    if (!isLoggedIn()) navigate({ to: "/" });
    else setReady(true);
  }, [navigate]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (!ready) return <div className="min-h-screen bg-background" />;

  const institute = getSettings();

 const sidebar = ( 
  <div className="flex h-full w-64 flex-col bg-navy text-navy-foreground"> 
    <div className="flex items-center gap-3 px-5 py-6"> 
      <img 
        src="/logo.png"
        alt="Renuka Paramedical Institute" 
        className="h-10 w-10 shrink-0 rounded-lg bg-white object-contain p-0.5" 
      />         
      <div className="min-w-0"> 
        <p className="truncate text-sm font-semibold">
          {institute.instituteName}
        </p> 
        <p className="text-xs opacity-60">Fee Management Dashboard</p> 
      </div> 
    </div>
      <nav className="flex-1 space-y-1 px-3">
        {nav.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active ? "bg-primary font-medium" : "opacity-75 hover:bg-white/10 hover:opacity-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={() => {
          logout();
          navigate({ to: "/" });
        }}
        className="m-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm opacity-75 transition-colors hover:bg-white/10 hover:opacity-100"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 h-full">{sidebar}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card px-4 py-4 sm:px-6">
          <button className="rounded-lg border border-border p-2 lg:hidden" onClick={() => setOpen((v) => !v)}>
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-foreground sm:text-xl">{title}</h1>
            {subtitle && <p className="truncate text-xs text-muted-foreground sm:text-sm">{subtitle}</p>}
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

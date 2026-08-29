import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, CalendarClock, CalendarDays, IndianRupee, Pencil, Plus, Trash2, Users, Wallet } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Btn, Card, Field, Input, Modal, Select, StatCard, StatusBadge } from "@/components/ui-kit";
import { useAppData } from "@/lib/useAppData";
import { deleteExpense, dueStatus, formatDate, formatINR, getExpenses, remainingOf, saveExpense, type Expense, type Student } from "@/lib/store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Institute Fee Management" },
      { name: "description", content: "Fee collection summary, pending dues and payment reminders for the institute." },
      { property: "og:title", content: "Dashboard — Institute Fee Management" },
      { property: "og:description", content: "Fee collection summary, pending dues and payment reminders." },
    ],
  }),
  component: Dashboard,
});

function ReminderList({ title, students, tone }: { title: string; students: Student[]; tone: string }) {
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className={`text-sm font-semibold ${tone}`}>{title}</h3>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{students.length}</span>
      </div>
      {students.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">No students in this category.</p>
      ) : (
        <ul className="space-y-3">
          {students.map((s) => (
            <li key={s.id} className="rounded-xl border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-foreground">{s.name}</p>
                <StatusBadge status={dueStatus(s)} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{s.course} · {s.batch}</p>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                <span className="text-foreground">Remaining: <b>{formatINR(remainingOf(s))}</b></span>
                <span className="text-muted-foreground">Due: {formatDate(s.nextDueDate)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function Dashboard() {
  const { students, refresh } = useAppData();
  const expenses = getExpenses();
  const [expenseForm, setExpenseForm] = useState<Expense | null>(null);

  const totalFees = students.reduce((a, s) => a + s.totalFee, 0);
  const totalPaid = students.reduce((a, s) => a + s.paidFee, 0);
  const totalRemaining = students.reduce((a, s) => a + remainingOf(s), 0);
  const totalExpenses = expenses.reduce((a, e) => a + e.amount, 0);

  const by = (st: string) => students.filter((s) => dueStatus(s) === st);
  const dueToday = by("Due Today");
  const dueTomorrow = by("Due Tomorrow");
  const overdue = by("Overdue");
  const upcoming = by("Upcoming");

  return (
    <AppLayout title="Dashboard" subtitle="Overview of fees, collections and reminders">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total Students" value={students.length} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Total Fees" value={formatINR(totalFees)} icon={<IndianRupee className="h-5 w-5" />} />
        <StatCard label="Total Paid" value={formatINR(totalPaid)} icon={<Wallet className="h-5 w-5" />} />
        <StatCard label="Total Remaining" value={formatINR(totalRemaining)} icon={<AlertTriangle className="h-5 w-5" />} />
        <StatCard label="Payments Due Today" value={dueToday.length} icon={<CalendarDays className="h-5 w-5" />} />
        <StatCard label="Upcoming Payments" value={upcoming.length + dueTomorrow.length} icon={<CalendarClock className="h-5 w-5" />} />
        <StatCard label="Institute Expenses" value={formatINR(totalExpenses)} icon={<Wallet className="h-5 w-5" />} />
      </div>

      {dueToday.length > 0 && (
        <div className="mt-5 rounded-2xl border border-warning/40 bg-warning/10 p-4">
          <p className="font-semibold text-foreground">🔔 Payment Due Today</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {dueToday.map((s) => `${s.name} (${formatINR(remainingOf(s))})`).join(", ")}
          </p>
        </div>
      )}

      <Card className="mt-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-semibold">Institute Expenses</h2><p className="text-sm text-muted-foreground">Total: {formatINR(totalExpenses)}</p></div><Btn onClick={()=>setExpenseForm({id:"E"+Date.now(),title:"",amount:0,date:new Date().toISOString().slice(0,10),category:"Other",note:""})}><Plus className="h-4 w-4"/> Add Expense</Btn></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[650px] text-sm"><thead><tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground"><th className="px-3 py-2">Expense</th><th className="px-3 py-2">Date</th><th className="px-3 py-2">Category</th><th className="px-3 py-2">Amount</th><th className="px-3 py-2"></th></tr></thead><tbody>{expenses.length===0?<tr><td colSpan={5} className="px-3 py-4 text-sm text-muted-foreground">No institute expenses added yet.</td></tr>:expenses.map(e=><tr key={e.id} className="border-b border-border last:border-0"><td className="px-3 py-2"><p className="font-medium">{e.title}</p><p className="text-xs text-muted-foreground">{e.note}</p></td><td className="px-3 py-2">{formatDate(e.date)}</td><td className="px-3 py-2">{e.category}</td><td className="px-3 py-2 font-medium">{formatINR(e.amount)}</td><td className="px-3 py-2 text-right"><button onClick={()=>setExpenseForm(e)} className="rounded-lg p-2 text-primary hover:bg-primary/10"><Pencil className="h-4 w-4"/></button><button onClick={()=>{if(confirm(`Delete expense ${e.title}?`)){deleteExpense(e.id);refresh()}}} className="rounded-lg p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4"/></button></td></tr>)}</tbody></table></div></Card>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">🔔 Fee Reminders</h2>
        <Link to="/reminders" className="text-sm font-medium text-primary hover:underline">
          View all
        </Link>
      </div>
      <div className="mt-3 grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
        <ReminderList title="Due Today" students={dueToday} tone="text-foreground" />
        <ReminderList title="Due Tomorrow" students={dueTomorrow} tone="text-primary" />
        <ReminderList title="Upcoming (next 7 days)" students={upcoming.filter((s) => s.nextDueDate <= new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10))} tone="text-primary" />
        <ReminderList title="Overdue" students={overdue} tone="text-destructive" />
      </div>
      {expenseForm&&<ExpenseForm expense={expenseForm} onClose={()=>setExpenseForm(null)} onSaved={()=>{setExpenseForm(null);refresh()}}/>}
    </AppLayout>
  );
}

function ExpenseForm({expense,onClose,onSaved}:{expense:Expense;onClose:()=>void;onSaved:()=>void}) {
  const [f,setF]=useState(expense);
  return <Modal title={expense.title?"Edit Institute Expense":"Add Institute Expense"} onClose={onClose}><form className="space-y-4" onSubmit={e=>{e.preventDefault();if(!f.title.trim()||Number(f.amount)<0)return;saveExpense({...f,title:f.title.trim(),amount:Number(f.amount)||0});onSaved()}}><div className="grid gap-4 sm:grid-cols-2"><Field label="Expense Title / Name"><Input required value={f.title} onChange={e=>setF({...f,title:e.target.value})}/></Field><Field label="Amount (₹)"><Input type="number" min={0} required value={f.amount} onChange={e=>setF({...f,amount:Number(e.target.value)})}/></Field><Field label="Expense Date"><Input type="date" required value={f.date} onChange={e=>setF({...f,date:e.target.value})}/></Field><Field label="Category"><Select value={f.category} onChange={e=>setF({...f,category:e.target.value})}><option>Utilities</option><option>Salary</option><option>Rent</option><option>Supplies</option><option>Marketing</option><option>Travel</option><option>Other</option></Select></Field><Field label="Description / Note (optional)"><Input value={f.note} onChange={e=>setF({...f,note:e.target.value})}/></Field></div><div className="flex justify-end gap-2"><Btn type="button" variant="outline" onClick={onClose}>Cancel</Btn><Btn type="submit">Save Expense</Btn></div></form></Modal>;
}

import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Btn, Card, EmptyRow, Field, Input, Modal, PaginationControls, Select, TableSkeleton } from "@/components/ui-kit";
import { useAppData } from "@/lib/useAppData";
import { addPayment, deletePayment, formatDate, formatINR, todayISO, updatePayment, type Payment } from "@/lib/store";
import { downloadReceipt } from "@/lib/receipt";

export const Route = createFileRoute("/payment-history")({ head: () => ({ meta: [{ title: "Payment History — Institute Fee Management" }] }), component: PaymentHistory });

function PaymentHistory() {
  const { loading, initialLoaded, payments, students } = useAppData();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [editing, setEditing] = useState<Payment | null>(null);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return payments
      .map((p) => ({ p, s: students.find((x) => x.id === p.studentId || (x as any).internalId === p.studentId) }))
      .filter(({ s }) => !!s)
      .filter(({ s, p }) => !t || `${s!.name} ${p.receiptNo}`.toLowerCase().includes(t))
      .sort((a, b) => (a.p.date < b.p.date ? 1 : -1));
  }, [payments, students, q]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, currentPage, pageSize]);

  const total = rows.reduce((a, r) => a + r.p.amount, 0);
  const showSkeleton = loading && !initialLoaded;

  return (
    <AppLayout title="Payment History" subtitle={`${rows.length} payments · ${formatINR(total)} collected`}>
      <Card className="mb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by student name..." value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
          </div>
          <Btn onClick={() => setEditing({ id: "", receiptNo: "", studentId: students[0]?.id || "", amount: 0, date: todayISO(), mode: "Cash", nextDueDate: "", remainingAfter: 0, previouslyPaid: 0 })} disabled={students.length === 0}>
            <Plus className="h-4 w-4" /> Add Payment
          </Btn>
        </div>
      </Card>
      <Card className="overflow-x-auto p-0">
        {showSkeleton ? (
          <div className="p-4"><TableSkeleton rows={6} cols={9} /></div>
        ) : (
          <>
            <table className="w-full min-w-[1050px] text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  {["Student", "Receipt No", "Payment Date", "Amount Paid", "Mode", "UPI Reference", "Remaining", "Next Due", ""].map((h) => (
                    <th key={h} className="px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedRows.length === 0 && <EmptyRow cols={9} text="No payments found" />}
                {paginatedRows.map(({ p, s }) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                    <td className="px-4 py-3 font-medium">{s!.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.receiptNo}</td>
                    <td className="px-4 py-3">{formatDate(p.date)}</td>
                    <td className="px-4 py-3 font-medium text-[oklch(0.45_0.13_155)]">{formatINR(p.amount)}</td>
                    <td className="px-4 py-3">{p.mode}</td>
                    <td className="px-4 py-3">{p.mode === "UPI" ? p.upiReference || "—" : "—"}</td>
                    <td className="px-4 py-3">{formatINR(p.remainingAfter)}</td>
                    <td className="px-4 py-3">{p.nextDueDate ? formatDate(p.nextDueDate) : "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Btn variant="ghost" onClick={() => downloadReceipt(s!, p)}><Download className="h-4 w-4" /> Receipt</Btn>
                        <button title="Edit" onClick={() => setEditing(p)} className="rounded-lg p-2 text-primary hover:bg-primary/10"><Pencil className="h-4 w-4" /></button>
                        <button title="Delete" onClick={() => { if (confirm(`Delete payment ${p.receiptNo}?`)) deletePayment(p.id); }} className="rounded-lg p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <PaginationControls page={currentPage} totalPages={totalPages} totalItems={rows.length} onPageChange={setPage} />
          </>
        )}
      </Card>
      {editing && <PaymentForm payment={editing} students={students} onClose={() => setEditing(null)} />}
    </AppLayout>
  );
}

function PaymentForm({payment,students,onClose}:{payment:Payment;students:ReturnType<typeof useAppData>["students"];onClose:()=>void}) {
  const [f,setF]=useState(payment); const student=students.find(s=>s.id===f.studentId); const isNew=!f.id;
  return <Modal title={isNew?"Add Payment":"Edit Payment"} onClose={onClose}><form className="space-y-4" onSubmit={e=>{e.preventDefault();if(!student||f.amount<0)return;const amount=Number(f.amount)||0;const allowed=isNew?(student.totalFee-student.paidFee):(f.studentId===payment.studentId?(student.totalFee-student.paidFee+payment.amount):(student.totalFee-student.paidFee));if(amount>allowed){alert("Payment cannot be more than the remaining fee.");return;}const upiRef = f.mode==="UPI"?f.upiReference:undefined;if(isNew){addPayment({studentId:f.studentId,amount,date:f.date,mode:f.mode,nextDueDate:f.nextDueDate,upiReference:upiRef})}else{updatePayment({...f,amount,upiReference:upiRef})}onClose()}}>
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Student"><Select required value={f.studentId} onChange={e=>setF({...f,studentId:e.target.value})}>{students.map(s=><option key={s.id} value={s.id}>{s.name} · {s.course}</option>)}</Select></Field><Field label="Receipt No"><Input disabled value={isNew?"Auto generated":f.receiptNo}/></Field><Field label="Payment Amount (₹)"><Input type="number" min={0} required value={f.amount} onChange={e=>setF({...f,amount:Number(e.target.value)})}/></Field><Field label="Payment Date"><Input type="date" required value={f.date} onChange={e=>setF({...f,date:e.target.value})}/></Field><Field label="Payment Mode"><Select value={f.mode} onChange={e=>setF({...f,mode:e.target.value as Payment["mode"]})}><option>Cash</option><option>UPI</option><option>Bank Transfer</option></Select></Field>{f.mode==="UPI"&&<Field label="UPI ID / Reference ID"><Input value={f.upiReference||""} onChange={e=>setF({...f,upiReference:e.target.value})}/></Field>}<Field label="Next Payment Due Date"><Input type="date" value={f.nextDueDate} onChange={e=>setF({...f,nextDueDate:e.target.value})}/></Field></div><div className="flex justify-end gap-2"><Btn type="button" variant="outline" onClick={onClose}>Cancel</Btn><Btn type="submit">Save Changes</Btn></div>
  </form></Modal>;
}

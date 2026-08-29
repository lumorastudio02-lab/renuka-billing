import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Printer } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Btn, Card, Field, Input, Modal, Select } from "@/components/ui-kit";
import { useAppData } from "@/lib/useAppData";
import { addPayment, formatDate, formatINR, remainingOf, todayISO, type Payment, type Student } from "@/lib/store";
import { downloadReceipt, printReceipt } from "@/lib/receipt";

export const Route = createFileRoute("/fee-collection")({
  head: () => ({
    meta: [
      { title: "Fee Collection — Institute Fee Management" },
      { name: "description", content: "Collect student fee payments in cash, UPI or bank transfer and set the next due date." },
      { property: "og:title", content: "Fee Collection — Institute Fee Management" },
      { property: "og:description", content: "Record fee payments and generate receipts instantly." },
    ],
  }),
  component: FeeCollection,
});

function FeeCollection() {
  const { students } = useAppData();
  const [studentId, setStudentId] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [date, setDate] = useState(todayISO());
  const [nextDueDate, setNextDueDate] = useState("");
  const [mode, setMode] = useState<Payment["mode"]>("Cash");
  const [upiReference, setUpiReference] = useState("");
  const [done, setDone] = useState<{ student: Student; payment: Payment } | null>(null);

  const student = students.find((s) => s.id === studentId);
  const current = Number(amount) || 0;
  const remainingAfter = student ? Math.max(0, student.totalFee - student.paidFee - current) : 0;

  return (
    <AppLayout title="Fee Collection" subtitle="Record a new fee payment">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!student) return;
              if (current > remainingOf(student)) {
                alert("Payment cannot be more than the remaining fee.");
                return;
              }
              const payment = addPayment({ studentId: student.id, amount: current, date, mode, nextDueDate, upiReference });
              setDone({ student: { ...student }, payment });
              setAmount("");
              setNextDueDate("");
              setUpiReference("");
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Select Student">
                <Select required value={studentId} onChange={(e) => setStudentId(e.target.value)}>
                  <option value="">— Choose a student —</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} · {s.course}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Total Course Fee"><Input disabled value={student ? formatINR(student.totalFee) : "—"} /></Field>
              <Field label="Current Payment (₹)">
                <Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))} />
              </Field>
              <Field label="Remaining Fee (auto)"><Input disabled value={student ? formatINR(remainingAfter) : "—"} /></Field>
              <Field label="Payment Date"><Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} /></Field>
              <Field label="Next Payment Due Date">
                <Input type="date" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} disabled={remainingAfter === 0 && !!student} />
              </Field>
              <Field label="Payment Mode">
                <Select value={mode} onChange={(e) => { setMode(e.target.value as Payment["mode"]); if (e.target.value !== "UPI") setUpiReference(""); }}>
                  <option>Cash</option><option>UPI</option><option>Bank Transfer</option>
                </Select>
              </Field>
              {mode === "UPI" && <Field label="UPI ID / Reference ID"><Input value={upiReference} onChange={(e) => setUpiReference(e.target.value)} placeholder="Enter UPI reference ID" /></Field>}
            </div>
            <div className="flex justify-end">
              <Btn type="submit" disabled={!student}>Save Payment</Btn>
            </div>
          </form>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-foreground">Summary</h3>
          {student ? (
            <dl className="mt-3 space-y-2 text-sm">
              <Row k="Student" v={student.name} />
              <Row k="Course" v={student.course} />
              <Row k="Batch" v={student.batch} />
              <Row k="Total Fee" v={formatINR(student.totalFee)} />
              <Row k="Current Payment" v={formatINR(current)} />
              <Row k="Remaining After" v={formatINR(remainingAfter)} />
              <Row k="Next Due" v={nextDueDate ? formatDate(nextDueDate) : "—"} />
            </dl>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Select a student to see fee details.</p>
          )}
        </Card>
      </div>

      {done && (
        <Modal title="Payment saved successfully" onClose={() => setDone(null)}>
          <p className="text-sm text-muted-foreground">
            Receipt <b className="text-foreground">{done.payment.receiptNo}</b> generated for {done.student.name} —{" "}
            {formatINR(done.payment.amount)} paid by {done.payment.mode}. Remaining: {formatINR(done.payment.remainingAfter)}.
          </p>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Btn variant="outline" onClick={() => printReceipt(done.student, done.payment)}><Printer className="h-4 w-4" /> Print Receipt</Btn>
            <Btn onClick={() => downloadReceipt(done.student, done.payment)}><Download className="h-4 w-4" /> Download PDF</Btn>
          </div>
        </Modal>
      )}
    </AppLayout>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-right font-medium text-foreground">{v}</dd>
    </div>
  );
}

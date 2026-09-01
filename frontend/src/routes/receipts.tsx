import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Printer, Search } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Btn, Card, Input, Skeleton, TableSkeleton } from "@/components/ui-kit";
import { useAppData } from "@/lib/useAppData";
import { formatDate, formatINR } from "@/lib/store";
import { downloadReceipt, printReceipt } from "@/lib/receipt";
import logoAsset from "@/assets/logo.png.asset.json";

export const Route = createFileRoute("/receipts")({
  head: () => ({
    meta: [
      { title: "Receipts — Institute Fee Management" },
      { name: "description", content: "Preview, print and download PDF fee receipts for every student payment." },
      { property: "og:title", content: "Receipts — Institute Fee Management" },
      { property: "og:description", content: "Generate professional institute fee receipts as PDF." },
    ],
  }),
  component: Receipts,
});

function Receipts() {
  const { loading, initialLoaded, payments, students, settings } = useAppData();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return payments
      .map((p) => ({ p, s: students.find((x) => x.id === p.studentId || (x as any).internalId === p.studentId) }))
      .filter((r) => r.s && (!t || `${r.s!.name} ${r.p.receiptNo}`.toLowerCase().includes(t)))
      .sort((a, b) => (a.p.date < b.p.date ? 1 : -1));
  }, [payments, students, q]);

  const active = rows.find((r) => r.p.id === selected) ?? rows[0];
  const showSkeleton = loading && !initialLoaded;

  return (
    <AppLayout title="Receipts" subtitle="Preview, print and download fee receipts">
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="p-0">
          <div className="border-b border-border p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search receipts..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
          <ul className="max-h-[560px] overflow-y-auto">
            {showSkeleton ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <>
                {rows.length === 0 && <li className="p-5 text-sm text-muted-foreground">No receipts yet.</li>}
                {rows.map(({ p, s }) => (
              <li key={p.id}>
                <button
                  onClick={() => setSelected(p.id)}
                  className={`flex w-full items-center justify-between gap-2 border-b border-border px-4 py-3 text-left text-sm hover:bg-secondary/50 ${
                    active?.p.id === p.id ? "bg-primary/10" : ""
                  }`}
                >
                  <span>
                    <span className="block font-medium text-foreground">{s!.name}</span>
                    <span className="text-xs text-muted-foreground">{p.receiptNo} · {formatDate(p.date)}</span>
                  </span>
                  <span className="font-medium text-foreground">{formatINR(p.amount)}</span>
                </button>
              </li>
            ))}
              </>
            )}
          </ul>
        </Card>

        <Card>
          {!active ? (
            <p className="text-sm text-muted-foreground">Record a payment to generate a receipt.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <img src={settings.logo || logoAsset.url} alt="Institute logo" className="h-14 w-14 shrink-0 rounded-lg object-contain" />
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{settings.instituteName}</h2>
                    <p className="text-xs text-muted-foreground">{settings.address}</p>
                    <p className="text-xs text-muted-foreground">{settings.mobile} | {settings.email}</p>
                  </div>
                </div>
              </div>

              <h3 className="mt-4 text-center text-sm font-bold uppercase tracking-wide text-foreground">FEE RECEIPT</h3>

              <div className="mt-2 flex items-center justify-between text-xs text-foreground">
                <p>Receipt No: <span className="font-medium">{active.p.receiptNo}</span></p>
                <p>Receipt Date: <span className="font-medium">{formatDate(active.p.date)}</span></p>
              </div>

              <dl className="mt-3 overflow-hidden rounded-md border border-border text-xs">
                {[
                  ["Student Name", active.s!.name],
                  ["Mobile", active.s!.mobile],
                  ["Course", active.s!.course],
                  ["Batch", active.s!.batch + (active.s!.year ? ` (${active.s!.year})` : "")],
                  ["Total Course Fee", formatINR(active.s!.totalFee)],
                  ["Current Payment", formatINR(active.p.amount)],
                  ["Total Paid", formatINR(active.s!.paidFee)],
                  ["Remaining Fee", formatINR(active.p.remainingAfter)],
                  ["Payment Mode", active.p.mode + (active.p.upiReference ? ` (${active.p.upiReference})` : "")],
                  ["Next Payment Due Date", active.p.nextDueDate ? formatDate(active.p.nextDueDate) : "Fully Paid"],
                ].map(([k, v], idx) => (
                  <div
                    key={k}
                    className={`flex items-center justify-between px-4 py-2 ${
                      idx % 2 === 0 ? "bg-secondary/60" : "bg-card"
                    }`}
                  >
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-bold text-foreground text-right">{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-5 flex flex-wrap items-start justify-between gap-4 text-xs">
                <div>
                  <p className="font-bold text-foreground">Thank you!</p>
                  <p className="text-[11px] text-muted-foreground">This is a computer generated receipt.</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-muted-foreground mt-4">Authorised Signatory</p>
                </div>
              </div>

              <div className="mt-3 text-center text-xs font-semibold text-foreground">
                एकदा भरलेली फी कोणत्याही कारणास्तव परत मिळणार नाही.
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link to="/payment-history" className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground hover:bg-secondary">Edit Payment</Link>
                <Btn variant="outline" onClick={() => printReceipt(active.s!, active.p)}><Printer className="h-4 w-4" /> Print Receipt</Btn>
                <Btn onClick={() => downloadReceipt(active.s!, active.p)}><Download className="h-4 w-4" /> Download PDF</Btn>
              </div>
            </>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}

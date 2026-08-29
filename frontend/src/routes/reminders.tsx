import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, EmptyRow, StatusBadge } from "@/components/ui-kit";
import { useAppData } from "@/lib/useAppData";
import { dueStatus, formatDate, formatINR, remainingOf, type Student } from "@/lib/store";

export const Route = createFileRoute("/reminders")({
  head: () => ({
    meta: [
      { title: "Fee Reminders — Institute Fee Management" },
      { name: "description", content: "See which students have fees due today, tomorrow, upcoming or overdue." },
      { property: "og:title", content: "Fee Reminders — Institute Fee Management" },
      { property: "og:description", content: "Track due today, upcoming and overdue student fee payments." },
    ],
  }),
  component: Reminders,
});

function Section({ title, students, note }: { title: string; students: Student[]; note: string }) {
  return (
    <Card className="p-0">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{note}</p>
        </div>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">{students.length}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              {["Student Name", "Course", "Remaining Fee", "Payment Due Date", "Status"].map((h) => (
                <th key={h} className="px-4 py-2.5 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.length === 0 && <EmptyRow cols={5} text="Nothing here" />}
            {students.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                <td className="px-4 py-3">{s.course}</td>
                <td className="px-4 py-3 font-medium">{formatINR(remainingOf(s))}</td>
                <td className="px-4 py-3">{formatDate(s.nextDueDate)}</td>
                <td className="px-4 py-3"><StatusBadge status={dueStatus(s)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Reminders() {
  const { students } = useAppData();
  const by = (st: string) => students.filter((s) => dueStatus(s) === st);
  const in7 = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);

  return (
    <AppLayout title="🔔 Fee Reminders" subtitle="Payment follow-ups at a glance">
      <div className="space-y-4">
        <Section title="Due Today" students={by("Due Today")} note="Payment due date is today" />
        <Section title="Overdue" students={by("Overdue")} note="Due date has already passed" />
        <Section title="Due Tomorrow" students={by("Due Tomorrow")} note="Payment due date is tomorrow" />
        <Section title="Upcoming (next 7 days)" students={by("Upcoming").filter((s) => s.nextDueDate <= in7)} note="Due within the coming week" />
        <Section title="Later" students={by("Upcoming").filter((s) => s.nextDueDate > in7)} note="Due after 7 days" />
      </div>
    </AppLayout>
  );
}

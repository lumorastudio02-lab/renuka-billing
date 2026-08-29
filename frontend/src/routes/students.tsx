import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useMemo, useState } from "react";
import { Download, Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Btn, Card, EmptyRow, Field, Input, Modal, Select, StatusBadge } from "@/components/ui-kit";
import { useAppData } from "@/lib/useAppData";
import {
  BATCH_OPTIONS,
  COURSE_OPTIONS,
  deleteStudent,
  dueStatus,
  formatDate,
  formatINR,
  nextStudentId,
  remainingOf,
  saveStudent,
  todayISO,
  type Student,
} from "@/lib/store";

export const Route = createFileRoute("/students")({
  head: () => ({
    meta: [
      { title: "Students — Institute Fee Management" },
      { name: "description", content: "Add, edit and track institute students with course fees, paid and remaining amounts." },
      { property: "og:title", content: "Students — Institute Fee Management" },
      { property: "og:description", content: "Manage student records, course fees and payment due dates." },
    ],
  }),
  component: StudentsPage,
});

const blank = (id: string): Student => ({
  id,
  name: "",
  mobile: "",
  email: "",
  course: "",
  batch: "",
  admissionDate: todayISO(),
  instalmentDate: "",
  totalFee: 0,
  paidFee: 0,
  nextDueDate: "",
});

function StudentsPage() {
  const { students } = useAppData();
  const [q, setQ] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [editing, setEditing] = useState<Student | null>(null);
  const [viewing, setViewing] = useState<Student | null>(null);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();

    return [...students]
      .filter((s) => {
        const matchesSearch = !t ||
          [s.name, s.id, s.mobile, s.course, s.batch]
            .join(" ")
            .toLowerCase()
            .includes(t);
        const matchesCourse = !courseFilter || s.course === courseFilter;
        const matchesBatch = !batchFilter || s.batch === batchFilter;
        return matchesSearch && matchesCourse && matchesBatch;
      })
      .sort((a, b) =>
        `${a.course} ${a.batch} ${a.name}`.localeCompare(
          `${b.course} ${b.batch} ${b.name}`,
        ),
      );
  }, [students, q, courseFilter, batchFilter]);

  const grouped = useMemo(() => {
    const groups = new Map<string, Map<string, Student[]>>();

    filtered.forEach((student) => {
      if (!groups.has(student.course)) groups.set(student.course, new Map());
      const batches = groups.get(student.course)!;
      if (!batches.has(student.batch)) batches.set(student.batch, []);
      batches.get(student.batch)!.push(student);
    });

    return groups;
  }, [filtered]);

  return (
    <AppLayout title="Students" subtitle={`${students.length} students enrolled`}>
      <Card className="mb-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_220px_180px_auto] lg:items-end">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search name, ID, course, batch..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Field label="Course">
            <Select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
              <option value="">All Courses</option>
              {COURSE_OPTIONS.map((course) => <option key={course} value={course}>{course}</option>)}
            </Select>
          </Field>
          <Field label="Batch">
            <Select value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)}>
              <option value="">All Batches</option>
              {BATCH_OPTIONS.map((batch) => <option key={batch} value={batch}>{batch}</option>)}
            </Select>
          </Field>
          <div className="flex flex-wrap gap-2">
            <Btn
              type="button"
              variant="outline"
              onClick={() => { setQ(""); setCourseFilter(""); setBatchFilter(""); }}
              disabled={!q && !courseFilter && !batchFilter}
            >
              Clear Filters
            </Btn>
            <Btn
              type="button"
              variant="outline"
              onClick={() => downloadStudents(filtered, { q, course: courseFilter, batch: batchFilter })}
              disabled={filtered.length === 0}
              title="Download the students currently shown after search and filters"
            >
              <Download className="h-4 w-4" /> Download Filtered ({filtered.length})
            </Btn>
            <Btn
              type="button"
              variant="outline"
              onClick={() => downloadStudents(students)}
              disabled={students.length === 0}
              title="Download all students"
            >
              <Download className="h-4 w-4" /> Download All ({students.length})
            </Btn>
            <Btn onClick={() => setEditing(blank(nextStudentId(students)))}><Plus className="h-4 w-4" /> Add Student</Btn>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Showing {filtered.length} of {students.length} students · grouped by course and batch</p>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              {["ID", "Student", "Course / Batch", "Total Fee", "Paid", "Remaining", "Next Due", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <EmptyRow cols={9} text="No students found" />}
            {Array.from(grouped.entries()).map(([course, batches]) => (
              <Fragment key={course}>
                <tr className="border-b border-border bg-primary/5">
                  <td colSpan={9} className="px-4 py-3 font-semibold text-primary">{course}</td>
                </tr>
                {Array.from(batches.entries()).map(([batch, batchStudents]) => (
                  <Fragment key={`${course}-${batch}`}>
                    <tr className="border-b border-border bg-secondary/40">
                      <td colSpan={9} className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{batch} · {batchStudents.length} student{batchStudents.length === 1 ? "" : "s"}</td>
                    </tr>
                    {batchStudents.map((s) => (
                      <tr key={s.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                        <td className="px-4 py-3 text-muted-foreground">{s.id}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.mobile}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-foreground">{s.course}</p>
                          <p className="text-xs text-muted-foreground">{s.batch}</p>
                        </td>
                        <td className="px-4 py-3">{formatINR(s.totalFee)}</td>
                        <td className="px-4 py-3 text-[oklch(0.45_0.13_155)]">{formatINR(s.paidFee)}</td>
                        <td className="px-4 py-3 font-medium">{formatINR(remainingOf(s))}</td>
                        <td className="px-4 py-3">{formatDate(s.nextDueDate)}</td>
                        <td className="px-4 py-3"><StatusBadge status={dueStatus(s)} /></td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => setViewing(s)} title="View" className="rounded-lg p-2 text-muted-foreground hover:bg-secondary"><Eye className="h-4 w-4" /></button>
                            <button onClick={() => setEditing(s)} title="Edit" className="rounded-lg p-2 text-primary hover:bg-primary/10"><Pencil className="h-4 w-4" /></button>
                            <button
                              title="Delete"
                              onClick={() => { if (confirm(`Delete ${s.name}? This also removes their payments.`)) deleteStudent(s.id); }}
                              className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                            ><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </Card>

      {editing && <StudentForm student={editing} onClose={() => setEditing(null)} />}

      {viewing && (
        <Modal title={viewing.name} onClose={() => setViewing(null)}>
          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              ["Student ID", viewing.id],
              ["Mobile", viewing.mobile],
              ["Email", viewing.email || "—"],
              ["Course", viewing.course],
              ["Batch", viewing.batch],
              ["Admission Date", formatDate(viewing.admissionDate)],
              ["Instalment Date", formatDate(viewing.instalmentDate)],
              ["Total Course Fee", formatINR(viewing.totalFee)],
              ["Total Paid", formatINR(viewing.paidFee)],
              ["Remaining Fee", formatINR(remainingOf(viewing))],
              ["Next Payment Due", formatDate(viewing.nextDueDate)],
              ["Status", dueStatus(viewing)],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-secondary/60 px-3 py-2">
                <dt className="text-xs text-muted-foreground">{k}</dt>
                <dd className="font-medium text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        </Modal>
      )}
    </AppLayout>
  );
}

function StudentForm({ student, onClose }: { student: Student; onClose: () => void }) {
  const [f, setF] = useState<Student>(student);
  const set = (k: keyof Student, v: string | number) => setF((p) => ({ ...p, [k]: v }));
  const remaining = Math.max(0, (Number(f.totalFee) || 0) - (Number(f.paidFee) || 0));
  const courseOptions = f.course && !COURSE_OPTIONS.includes(f.course as (typeof COURSE_OPTIONS)[number])
    ? [f.course, ...COURSE_OPTIONS]
    : COURSE_OPTIONS;
  const batchOptions = f.batch && !BATCH_OPTIONS.includes(f.batch)
    ? [f.batch, ...BATCH_OPTIONS]
    : BATCH_OPTIONS;

  return (
    <Modal title={student.name ? "Edit Student" : "Add Student"} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          saveStudent({ ...f, totalFee: Number(f.totalFee) || 0, paidFee: Number(f.paidFee) || 0 });
          onClose();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Student Name"><Input required value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Mobile Number"><Input required pattern="[0-9+ ]{10,15}" value={f.mobile} onChange={(e) => set("mobile", e.target.value)} /></Field>
          <Field label="Email (optional)"><Input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} /></Field>
          <Field label="Course">
            <Select required value={f.course} onChange={(e) => set("course", e.target.value)}>
              <option value="" disabled>Select Course</option>
              {courseOptions.map((course) => <option key={course} value={course}>{course}</option>)}
            </Select>
          </Field>
          <Field label="Batch">
            <Select required value={f.batch} onChange={(e) => set("batch", e.target.value)}>
              <option value="" disabled>Select Batch</option>
              {batchOptions.map((batch) => <option key={batch} value={batch}>{batch}</option>)}
            </Select>
          </Field>
          <Field label="Admission Date"><Input type="date" required value={f.admissionDate} onChange={(e) => set("admissionDate", e.target.value)} /></Field>
          <Field label="Instalment Date"><Input type="date" value={f.instalmentDate} onChange={(e) => set("instalmentDate", e.target.value)} /></Field>
          <Field label="Total Course Fee (₹)"><Input type="number" min={0} required value={f.totalFee} onChange={(e) => set("totalFee", Number(e.target.value))} /></Field>
          <Field label="Total Paid Fee (₹)"><Input type="number" min={0} value={f.paidFee} onChange={(e) => set("paidFee", Number(e.target.value))} /></Field>
          <Field label="Next Payment Due Date"><Input type="date" value={f.nextDueDate} onChange={(e) => set("nextDueDate", e.target.value)} /></Field>
          <Field label="Remaining Fee (auto)"><Input disabled value={formatINR(remaining)} /></Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Btn type="button" variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn type="submit">Save Student</Btn>
        </div>
      </form>
    </Modal>
  );
}


function downloadStudents(
  students: Student[],
  filters?: { q?: string; course?: string; batch?: string },
) {
  const headers = [
    "Student ID",
    "Student Name",
    "Mobile Number",
    "Email",
    "Course",
    "Batch",
    "Admission Date",
    "Instalment Date",
    "Total Course Fee",
    "Total Paid Fee",
    "Remaining Fee",
    "Next Payment Due Date",
    "Payment Status",
  ];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = students.map((s) => [
    s.id,
    s.name,
    s.mobile,
    s.email,
    s.course,
    s.batch,
    s.admissionDate,
    s.instalmentDate,
    s.totalFee,
    s.paidFee,
    remainingOf(s),
    s.nextDueDate,
    dueStatus(s),
  ].map(esc).join(","));

  const csv = [headers.map(esc).join(","), ...rows].join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }),
  );
  const a = document.createElement("a");
  a.href = url;

  const parts = ["students-export", filters?.course, filters?.batch]
    .filter(Boolean)
    .map((part) => String(part).replace(/[^a-zA-Z0-9]+/g, "-"));
  const hasFilter = Boolean(filters?.q?.trim() || filters?.course || filters?.batch);
  a.download = `${parts.join("-") || "students-export"}-${hasFilter ? "filtered" : "all"}-${todayISO()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

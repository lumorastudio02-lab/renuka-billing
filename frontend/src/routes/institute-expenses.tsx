import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Wallet,
  Plus,
  FileSpreadsheet,
  Search,
  Pencil,
  Trash2,
  Calendar,
  Layers,
  TrendingUp,
  Receipt,
  Download,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Btn, Card, EmptyRow, Field, Input, Modal, Select } from "@/components/ui-kit";
import { useAppData } from "@/lib/useAppData";
import { deleteExpense, formatDate, formatINR, saveExpense, type Expense } from "@/lib/store";
import { exportExpensesToExcel, exportExpensesToCSV } from "@/lib/excel";

export const Route = createFileRoute("/institute-expenses")({
  head: () => ({
    meta: [
      { title: "Institute Expenses — Fee Management" },
      { name: "description", content: "Track, manage, and export institute expense records in Excel format." },
      { property: "og:title", content: "Institute Expenses — Fee Management" },
      { property: "og:description", content: "Detailed breakdown and Excel export of all institute expenses." },
    ],
  }),
  component: InstituteExpensesPage,
});

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  className = "",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  className?: string;
}) {
  return (
    <Card className={`flex items-center justify-between p-4 ${className}`}>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
        <h3 className="mt-1 text-2xl font-bold text-foreground">{value}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="rounded-xl bg-primary/10 p-3 text-primary">
        <Icon className="h-6 w-6" />
      </div>
    </Card>
  );
}

function InstituteExpensesPage() {
  const { expenses = [], refresh } = useAppData();
  const expenseList = Array.isArray(expenses) ? expenses : [];
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [expenseModal, setExpenseModal] = useState<Expense | null>(null);

  // Compute metrics
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const totalExpenseAmount = useMemo(
    () => expenseList.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [expenseList]
  );

  const thisMonthExpenses = useMemo(() => {
    return expenseList
      .filter((e) => e.date && e.date.startsWith(currentMonthStr))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenseList, currentMonthStr]);

  const topCategory = useMemo(() => {
    if (expenseList.length === 0) return "N/A";
    const totals: Record<string, number> = {};
    for (const e of expenseList) {
      const cat = e.category || "Other";
      totals[cat] = (totals[cat] || 0) + (Number(e.amount) || 0);
    }
    let highestCat = "N/A";
    let maxVal = -1;
    for (const [cat, val] of Object.entries(totals)) {
      if (val > maxVal) {
        maxVal = val;
        highestCat = cat;
      }
    }
    return highestCat;
  }, [expenseList]);

  // Filtered expense list
  const filteredExpenses = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return expenseList.filter((e) => {
      const matchesSearch =
        !term ||
        (e.title && e.title.toLowerCase().includes(term)) ||
        (e.note && e.note.toLowerCase().includes(term)) ||
        (e.category && e.category.toLowerCase().includes(term));

      const matchesCategory = selectedCategory === "All" || e.category === selectedCategory;

      let matchesDate = true;
      if (dateFilter === "This Month") {
        matchesDate = Boolean(e.date && e.date.startsWith(currentMonthStr));
      } else if (dateFilter === "Last Month") {
        const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevStr = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
        matchesDate = Boolean(e.date && e.date.startsWith(prevStr));
      }

      return matchesSearch && matchesCategory && matchesDate;
    }).sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [expenseList, searchTerm, selectedCategory, dateFilter, currentMonthStr]);

  const filteredTotal = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [filteredExpenses]
  );

  const categories = ["All", "Utilities", "Salary", "Rent", "Supplies", "Marketing", "Travel", "Other"];

  const handleCreateNew = () => {
    setExpenseModal({
      id: "E" + Date.now(),
      title: "",
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      category: "Utilities",
      note: "",
    });
  };

  const handleDelete = (expense: Expense) => {
    if (confirm(`Are you sure you want to delete expense "${expense.title}"?`)) {
      deleteExpense(expense.id);
      refresh();
    }
  };

  return (
    <AppLayout
      title="🏢 Institute Expenses"
      subtitle="Comprehensive breakdown, management, and Excel reporting for institute expenses"
    >
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Expenditure"
            value={formatINR(totalExpenseAmount)}
            subtitle={`Across ${expenseList.length} recorded items`}
            icon={Wallet}
          />
          <MetricCard
            title="This Month"
            value={formatINR(thisMonthExpenses)}
            subtitle="Expenses recorded this month"
            icon={TrendingUp}
          />
          <MetricCard
            title="Total Records"
            value={expenseList.length}
            subtitle="Expense line items"
            icon={Receipt}
          />
          <MetricCard
            title="Top Expense Category"
            value={topCategory}
            subtitle="Highest spending domain"
            icon={Layers}
          />
        </div>

        {/* Toolbar & Filters */}
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Box */}
              <div className="relative min-w-[220px]">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9 text-sm"
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Category Filter */}
              <div className="w-[160px]">
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-sm"
                >
                  <option value="All">All Categories</option>
                  {categories.filter((c) => c !== "All").map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Time Period Filter */}
              <div className="w-[150px]">
                <Select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="text-sm"
                >
                  <option value="All">All Time</option>
                  <option value="This Month">This Month</option>
                  <option value="Last Month">Last Month</option>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Btn
                variant="outline"
                onClick={() => exportExpensesToExcel(filteredExpenses)}
                className="gap-2 border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                title="Download expenses in Excel (.xlsx) format"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Download Excel
              </Btn>

              <Btn
                variant="outline"
                onClick={() => exportExpensesToCSV(filteredExpenses)}
                className="gap-2"
                title="Download expenses as CSV file"
              >
                <Download className="h-4 w-4" />
                CSV
              </Btn>

              <Btn onClick={handleCreateNew} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Expense
              </Btn>
            </div>
          </div>

          {/* Filter Status Summary */}
          {(searchTerm || selectedCategory !== "All" || dateFilter !== "All") && (
            <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">
              <span>
                Showing <b>{filteredExpenses.length}</b> of <b>{expenseList.length}</b> expense items (Total:{" "}
                <b>{formatINR(filteredTotal)}</b>)
              </span>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("All");
                  setDateFilter("All");
                }}
                className="font-medium text-primary underline hover:opacity-80"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* Expenses Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Expense Title & Note</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length === 0 ? (
                  <EmptyRow cols={5} text="No institute expenses found matching criteria." />
                ) : (
                  filteredExpenses.map((exp) => (
                    <tr
                      key={exp.id}
                      className="border-b border-border transition-colors hover:bg-muted/40 last:border-0"
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground">{exp.title}</p>
                        {exp.note && <p className="text-xs text-muted-foreground">{exp.note}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                          {exp.category || "Other"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(exp.date)}</td>
                      <td className="px-4 py-3 font-bold text-foreground">{formatINR(exp.amount)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setExpenseModal(exp)}
                            className="rounded-lg p-2 text-primary transition-colors hover:bg-primary/10"
                            title="Edit Expense"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(exp)}
                            className="rounded-lg p-2 text-destructive transition-colors hover:bg-destructive/10"
                            title="Delete Expense"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredExpenses.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/20 font-semibold">
                    <td className="px-4 py-3">Total Filtered Expenditure</td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {filteredExpenses.length} Record{filteredExpenses.length > 1 ? "s" : ""}
                    </td>
                    <td className="px-4 py-3 text-base font-bold text-primary">{formatINR(filteredTotal)}</td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </Card>
      </div>

      {/* Expense Modal */}
      {expenseModal && (
        <ExpenseFormModal
          expense={expenseModal}
          onClose={() => setExpenseModal(null)}
          onSaved={() => {
            setExpenseModal(null);
            refresh();
          }}
        />
      )}
    </AppLayout>
  );
}

function ExpenseFormModal({
  expense,
  onClose,
  onSaved,
}: {
  expense: Expense;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Expense>({ ...expense });
  const isEditing = Boolean(expense.title);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || Number(form.amount) < 0) return;

    saveExpense({
      ...form,
      title: form.title.trim(),
      amount: Number(form.amount) || 0,
    });
    onSaved();
  };

  return (
    <Modal title={isEditing ? "Edit Institute Expense" : "Add New Institute Expense"} onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Expense Title / Name">
            <Input
              required
              placeholder="e.g. Office Electricity Bill"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>

          <Field label="Amount (₹)">
            <Input
              type="number"
              min={0}
              required
              placeholder="0"
              value={form.amount || ""}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            />
          </Field>

          <Field label="Expense Date">
            <Input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </Field>

          <Field label="Category">
            <Select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option>Utilities</option>
              <option>Salary</option>
              <option>Rent</option>
              <option>Supplies</option>
              <option>Marketing</option>
              <option>Travel</option>
              <option>Other</option>
            </Select>
          </Field>

          <div className="sm:col-span-2">
            <Field label="Description / Note (Optional)">
              <Input
                placeholder="e.g. Paid via UPI / Invoice #1024"
                value={form.note || ""}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </Field>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Btn type="button" variant="outline" onClick={onClose}>
            Cancel
          </Btn>
          <Btn type="submit">
            {isEditing ? "Save Changes" : "Save Expense"}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

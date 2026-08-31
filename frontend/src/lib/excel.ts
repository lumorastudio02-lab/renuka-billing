import * as XLSX from "xlsx";
import type { Expense } from "@/lib/store";
import { formatDate } from "@/lib/store";

export function exportExpensesToExcel(expenses: Expense[], filename?: string): void {
  const name = filename || `Institute_Expenses_${new Date().toISOString().slice(0, 10)}.xlsx`;

  // Map expense data into tabular format
  const rows = expenses.map((e, index) => ({
    "S.No": index + 1,
    "Expense Title": e.title,
    Category: e.category || "Other",
    Date: formatDate(e.date),
    "Amount (₹)": e.amount,
    "Description / Note": e.note || "—",
  }));

  // Calculate total expense amount
  const totalAmount = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Append Total summary row
  rows.push({
    "S.No": "" as any,
    "Expense Title": "TOTAL EXPENDITURE",
    Category: "",
    Date: "",
    "Amount (₹)": totalAmount,
    "Description / Note": `Total ${expenses.length} Records`,
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Custom column widths for better presentation
  worksheet["!cols"] = [
    { wch: 8 },  // S.No
    { wch: 30 }, // Expense Title
    { wch: 18 }, // Category
    { wch: 15 }, // Date
    { wch: 16 }, // Amount
    { wch: 36 }, // Note
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Institute Expenses");

  // Trigger file download
  XLSX.writeFile(workbook, name);
}

export function exportExpensesToCSV(expenses: Expense[], filename?: string): void {
  const name = filename || `Institute_Expenses_${new Date().toISOString().slice(0, 10)}.csv`;
  const headers = ["S.No", "Expense Title", "Category", "Date", "Amount (INR)", "Description / Note"];

  const rows = expenses.map((e, index) => [
    index + 1,
    `"${(e.title || "").replace(/"/g, '""')}"`,
    `"${(e.category || "").replace(/"/g, '""')}"`,
    `"${formatDate(e.date)}"`,
    e.amount,
    `"${(e.note || "").replace(/"/g, '""')}"`,
  ]);

  const totalAmount = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  rows.push(["", '"TOTAL EXPENDITURE"', '""', '""', totalAmount, `"${expenses.length} Records"`]);

  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", name);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

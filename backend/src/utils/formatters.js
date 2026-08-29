export function formatStudentId(nextNumber) {
  return `STU-${String(nextNumber).padStart(3, '0')}`;
}

export function formatReceiptNo(nextNumber) {
  return `RCP-${String(nextNumber)}`;
}

export function calculateDueStatus(student) {
  const total = Number(student.totalFee) || 0;
  const paid = Number(student.paidFee) || 0;
  const remaining = total - paid;

  if (remaining <= 0) return "Paid";
  if (!student.nextDueDate) return "No Due";

  const todayStr = new Date().toISOString().slice(0, 10);
  const nextDueStr = new Date(student.nextDueDate).toISOString().slice(0, 10);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  if (nextDueStr === todayStr) return "Due Today";
  if (nextDueStr === tomorrowStr) return "Due Tomorrow";

  return nextDueStr < todayStr ? "Overdue" : "Upcoming";
}

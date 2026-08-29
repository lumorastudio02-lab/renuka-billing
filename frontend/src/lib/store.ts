// Enterprise API-backed store connected directly to Express Backend + MongoDB Atlas.
// Optimistic UI updates with real-time background sync to MongoDB Atlas.

export type Payment = {
  id: string;
  receiptNo: string;
  studentId: string;
  amount: number;
  date: string; // yyyy-mm-dd
  mode: "Cash" | "UPI" | "Bank Transfer";
  upiReference?: string | undefined;
  nextDueDate: string;
  remainingAfter: number;
  previouslyPaid: number;
};

export const COURSE_OPTIONS = [
  "PGDMLT / ADMLT",
  "DMLT",
  "Radiology",
  "Operation Theatre",
  "Optometrist",
  "Dialysis",
  "X-Ray, CT, MRI",
  "Sanitary Inspector",
  "B.Sc. (Micro)",
  "Hotel Management",
] as const;

export const BATCH_OPTIONS = Array.from(
  { length: 10 },
  (_, i) => `Batch ${i + 1}`,
) as string[];

export type Student = {
  id: string;
  name: string;
  mobile: string;
  email: string;
  course: string;
  batch: string;
  admissionDate: string;
  instalmentDate: string;
  totalFee: number;
  paidFee: number;
  nextDueDate: string;
};

export type Expense = {
  id: string;
  title: string;
  amount: number;
  date: string;
  category: string;
  note: string;
};

export type Settings = {
  instituteName: string;
  logo: string;
  address: string;
  mobile: string;
  email: string;
};

export const defaultSettings: Settings = {
  instituteName: "Renuka Paramedical Institute",
  logo: "/logo.png",
  address:
    "Shree Bussiness Building, First Floor, Chinchkar Chowk, Pragatinagar, Baramati, Maharashtra 413102",
  mobile: "+91 913048003",
  email: "renukaparamedical@gmai.com",
};

const BASE_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_BASE = BASE_API_URL.endsWith("/api/v1")
  ? BASE_API_URL
  : `${BASE_API_URL.replace(/\/$/, "")}/api/v1`;

export const isBrowser = () => typeof window !== "undefined";

export const iso = (d: Date) => d.toISOString().slice(0, 10);

export const todayISO = () => iso(new Date());

export const addDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return iso(d);
};

export const formatINR = (n: number) =>
  "₹" + (Number(n) || 0).toLocaleString("en-IN");

export const formatDate = (s: string) => {
  if (!s) return "—";
  const d = new Date(s + "T00:00:00");
  if (isNaN(d.getTime())) return s;

  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export type DueStatus =
  | "Paid"
  | "Due Today"
  | "Due Tomorrow"
  | "Upcoming"
  | "Overdue"
  | "No Due";

export function dueStatus(student: Student): DueStatus {
  const remaining = student.totalFee - student.paidFee;
  if (remaining <= 0) return "Paid";
  if (!student.nextDueDate) return "No Due";
  const t = todayISO();
  if (student.nextDueDate === t) return "Due Today";
  if (student.nextDueDate === addDays(1)) return "Due Tomorrow";
  return student.nextDueDate < t ? "Overdue" : "Upcoming";
}

export const remainingOf = (s: Student) =>
  Math.max(0, s.totalFee - s.paidFee);

// -----------------------------------------
// Purge LocalStorage Data Completely
// -----------------------------------------
function purgeLocalStorage() {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem("ifms_students");
    localStorage.removeItem("ifms_payments");
    localStorage.removeItem("ifms_expenses");
    localStorage.removeItem("ifms_settings");
    localStorage.removeItem("ifms_seeded_v2");
  } catch {
    // Ignore storage errors
  }
}
purgeLocalStorage();

// -----------------------------------------
// In-Memory API Cache
// -----------------------------------------
let stateCache: {
  students: Student[];
  payments: Payment[];
  expenses: Expense[];
  settings: Settings;
  authToken: string | null;
} = {
  students: [],
  payments: [],
  expenses: [],
  settings: defaultSettings,
  authToken: isBrowser() ? localStorage.getItem("ifms_token") : null,
};

export async function ensureAuthenticated(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "admin123" }),
    });
    const data = await res.json();
    if (data.data?.tokens?.accessToken) {
      const token = data.data.tokens.accessToken;
      stateCache.authToken = token;
      if (isBrowser()) {
        localStorage.setItem("ifms_token", token);
        localStorage.setItem("ifms_auth", "1");
      }
      return token;
    }
  } catch (e) {
    console.error("Failed auto authentication:", e);
  }
  return null;
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  let token = stateCache.authToken || (isBrowser() ? localStorage.getItem("ifms_token") : null);
  if (!token) {
    token = await ensureAuthenticated();
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res = await fetch(url, { ...options, headers }).catch(() => null);
  if (res && res.status === 401) {
    token = await ensureAuthenticated();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      res = await fetch(url, { ...options, headers }).catch(() => null);
    }
  }
  return res || new Response(JSON.stringify({ error: "Network error" }), { status: 500 });
}

function notify() {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event("ifms-change"));
}

export async function fetchAppData(): Promise<void> {
  try {
    const [stRes, payRes, expRes, setRes] = await Promise.all([
      fetchWithAuth(`${API_BASE}/students`),
      fetchWithAuth(`${API_BASE}/payments`),
      fetchWithAuth(`${API_BASE}/expenses`),
      fetchWithAuth(`${API_BASE}/settings`),
    ]);

    if (stRes && stRes.ok) {
      const data = await stRes.json();
      if (Array.isArray(data.data)) stateCache.students = data.data;
    }

    if (payRes && payRes.ok) {
      const data = await payRes.json();
      if (Array.isArray(data.data)) stateCache.payments = data.data;
    }

    if (expRes && expRes.ok) {
      const data = await expRes.json();
      if (Array.isArray(data.data)) stateCache.expenses = data.data;
    }

    if (setRes && setRes.ok) {
      const data = await setRes.json();
      if (data.data) {
        stateCache.settings = { ...defaultSettings, ...data.data };
      }
    }

    notify();
  } catch (error) {
    console.error("Failed to sync with MongoDB Atlas API:", error);
  }
}

// -----------------------------------------
// Synchronous Getters (Return Cached MongoDB Data)
// -----------------------------------------
export function getStudents(): Student[] {
  return stateCache.students;
}

export function getPayments(): Payment[] {
  return stateCache.payments;
}

export function getExpenses(): Expense[] {
  return stateCache.expenses;
}

export function getSettings(): Settings {
  return stateCache.settings;
}

export function nextStudentId(students: Student[]) {
  const max = students.reduce((m, s) => {
    const n = parseInt(s.id.replace(/\D/g, ""), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);

  return "STU-" + String(max + 1).padStart(3, "0");
}

// -----------------------------------------
// Actions (Students)
// -----------------------------------------
export function saveStudent(student: Student): void {
  const idx = stateCache.students.findIndex(
    (s) => s.id === student.id || (s as any).studentCode === student.id
  );

  if (idx >= 0) {
    stateCache.students[idx] = student;
  } else {
    stateCache.students.push(student);
  }
  notify();

  fetchWithAuth(`${API_BASE}/students`, {
    method: "POST",
    body: JSON.stringify(student),
  })
    .then(() => fetchAppData())
    .catch((err) => console.error("Error persisting student to MongoDB Atlas:", err));
}

export function deleteStudent(id: string): void {
  stateCache.students = stateCache.students.filter((s) => s.id !== id);
  stateCache.payments = stateCache.payments.filter((p) => p.studentId !== id);
  notify();

  fetchWithAuth(`${API_BASE}/students/${id}`, {
    method: "DELETE",
  })
    .then(() => fetchAppData())
    .catch((err) => console.error("Error deleting student from MongoDB Atlas:", err));
}

// -----------------------------------------
// Actions (Payments)
// -----------------------------------------
export function addPayment(input: {
  studentId: string;
  amount: number;
  date: string;
  mode: Payment["mode"];
  nextDueDate: string;
  upiReference?: string | undefined;
}): Payment {
  const student = stateCache.students.find((s) => s.id === input.studentId);
  const maxReceipt = stateCache.payments.reduce((max, p) => {
    const n = parseInt(p.receiptNo.replace(/\D/g, ""), 10);
    return Number.isNaN(n) ? max : Math.max(max, n);
  }, 1000);
  const receiptNo = "RCP-" + String(maxReceipt + 1);
  const previouslyPaid = student ? student.paidFee : 0;
  const newPaid = previouslyPaid + input.amount;

  const payment: Payment = {
    id: "P" + Date.now(),
    receiptNo,
    studentId: input.studentId,
    amount: input.amount,
    date: input.date,
    mode: input.mode,
    upiReference: input.upiReference?.trim() || undefined,
    nextDueDate: input.nextDueDate,
    previouslyPaid,
    remainingAfter: student ? Math.max(0, student.totalFee - newPaid) : 0,
  };

  if (student) {
    student.paidFee = newPaid;
    student.nextDueDate = newPaid >= student.totalFee ? "" : input.nextDueDate;
  }

  stateCache.payments.unshift(payment);
  notify();

  fetchWithAuth(`${API_BASE}/payments`, {
    method: "POST",
    body: JSON.stringify(input),
  })
    .then(() => fetchAppData())
    .catch((err) => console.error("Error persisting payment to MongoDB Atlas:", err));

  return payment;
}

export function updatePayment(input: Payment): Payment {
  const idx = stateCache.payments.findIndex((p) => p.id === input.id);
  if (idx >= 0) {
    stateCache.payments[idx] = input;
  }
  notify();

  fetchWithAuth(`${API_BASE}/payments/${input.id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
    .then(() => fetchAppData())
    .catch((err) => console.error("Error updating payment in MongoDB Atlas:", err));

  return input;
}

export function deletePayment(id: string): void {
  stateCache.payments = stateCache.payments.filter((p) => p.id !== id);
  notify();

  fetchWithAuth(`${API_BASE}/payments/${id}`, {
    method: "DELETE",
  })
    .then(() => fetchAppData())
    .catch((err) => console.error("Error deleting payment from MongoDB Atlas:", err));
}

// -----------------------------------------
// Actions (Expenses)
// -----------------------------------------
export function saveExpense(expense: Expense): void {
  const idx = stateCache.expenses.findIndex((e) => e.id === expense.id);
  if (idx >= 0) {
    stateCache.expenses[idx] = expense;
  } else {
    stateCache.expenses.unshift(expense);
  }
  notify();

  fetchWithAuth(`${API_BASE}/expenses`, {
    method: "POST",
    body: JSON.stringify(expense),
  })
    .then(() => fetchAppData())
    .catch((err) => console.error("Error persisting expense to MongoDB Atlas:", err));
}

export function deleteExpense(id: string): void {
  stateCache.expenses = stateCache.expenses.filter((e) => e.id !== id);
  notify();

  fetchWithAuth(`${API_BASE}/expenses/${id}`, {
    method: "DELETE",
  })
    .then(() => fetchAppData())
    .catch((err) => console.error("Error deleting expense from MongoDB Atlas:", err));
}

// -----------------------------------------
// Actions (Settings)
// -----------------------------------------
export function saveSettings(s: Settings): void {
  stateCache.settings = s;
  notify();

  fetchWithAuth(`${API_BASE}/settings`, {
    method: "PUT",
    body: JSON.stringify(s),
  })
    .then(() => fetchAppData())
    .catch((err) => console.error("Error persisting settings to MongoDB Atlas:", err));
}

// -----------------------------------------
// Authentication Actions
// -----------------------------------------
export function login(u: string, p: string): boolean {
  if (u.trim().toLowerCase() === "admin" && p === "admin123") {
    if (isBrowser()) {
      localStorage.setItem("ifms_auth", "1");
    }

    fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: u, password: p }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.data?.tokens?.accessToken) {
          stateCache.authToken = data.data.tokens.accessToken;
          if (isBrowser()) localStorage.setItem("ifms_token", data.data.tokens.accessToken);
        }
        fetchAppData();
      })
      .catch(() => {
        fetchAppData();
      });

    return true;
  }

  return false;
}

export function logout() {
  if (isBrowser()) {
    localStorage.removeItem("ifms_token");
    localStorage.removeItem("ifms_auth");
  }
  stateCache.authToken = null;
  stateCache.students = [];
  stateCache.payments = [];
  stateCache.expenses = [];
  notify();
}

export const isLoggedIn = () =>
  isBrowser() && (localStorage.getItem("ifms_auth") === "1" || Boolean(stateCache.authToken));
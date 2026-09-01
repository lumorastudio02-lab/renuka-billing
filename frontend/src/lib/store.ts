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

export const BATCH_OPTIONS = [
  "Batch 1",
  "Batch 2",
  "Batch 3",
  "Batch 4",
] as string[];

export type Student = {
  id: string;
  name: string;
  mobile: string;
  email: string;
  course: string;
  year?: string;
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

const BASE_API_URL = import.meta.env["VITE_API_URL"] || "http://localhost:5000";
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
// Fast Persistent Cache Helper
// -----------------------------------------
function loadInitialCache() {
  if (!isBrowser()) return { students: [], payments: [], expenses: [], settings: defaultSettings, loaded: false };
  try {
    const cached = sessionStorage.getItem("ifms_fast_cache");
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        students: Array.isArray(parsed.students) ? parsed.students : [],
        payments: Array.isArray(parsed.payments) ? parsed.payments : [],
        expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
        settings: parsed.settings ? { ...defaultSettings, ...parsed.settings } : defaultSettings,
        loaded: true,
      };
    }
  } catch {
    // Ignore cache load error
  }
  return { students: [], payments: [], expenses: [], settings: defaultSettings, loaded: false };
}

const initialCache = loadInitialCache();

let stateCache: {
  students: Student[];
  payments: Payment[];
  expenses: Expense[];
  settings: Settings;
  authToken: string | null;
  loading: boolean;
  initialLoaded: boolean;
} = {
  students: initialCache.students,
  payments: initialCache.payments,
  expenses: initialCache.expenses,
  settings: initialCache.settings,
  authToken: isBrowser() ? localStorage.getItem("ifms_token") : null,
  loading: !initialCache.loaded,
  initialLoaded: initialCache.loaded,
};

let activeFetchPromise: Promise<void> | null = null;

function saveCacheToSession() {
  if (!isBrowser()) return;
  try {
    sessionStorage.setItem(
      "ifms_fast_cache",
      JSON.stringify({
        students: stateCache.students,
        payments: stateCache.payments,
        expenses: stateCache.expenses,
        settings: stateCache.settings,
      })
    );
  } catch {
    // Ignore storage quota error
  }
}

export async function ensureAuthenticated(): Promise<string | null> {
  const token = stateCache.authToken || (isBrowser() ? localStorage.getItem("ifms_token") : null);
  if (token) {
    stateCache.authToken = token;
    return token;
  }
  return null;
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = stateCache.authToken || (isBrowser() ? localStorage.getItem("ifms_token") : null);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers }).catch(() => null);
  if (res && res.status === 401) {
    logout();
  }
  return res || new Response(JSON.stringify({ error: "Network error" }), { status: 500 });
}

function notify() {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event("ifms-change"));
}

export async function fetchAppData(): Promise<void> {
  if (activeFetchPromise) {
    return activeFetchPromise;
  }

  if (!stateCache.initialLoaded) {
    stateCache.loading = true;
    notify();
  }

  activeFetchPromise = (async () => {
    try {
      const [stRes, payRes, expRes, setRes] = await Promise.all([
        fetchWithAuth(`${API_BASE}/students`),
        fetchWithAuth(`${API_BASE}/payments`),
        fetchWithAuth(`${API_BASE}/expenses`),
        fetchWithAuth(`${API_BASE}/settings`),
      ]);

      if (stRes && stRes.ok) {
        const resJson = await stRes.json();
        const items = Array.isArray(resJson.data)
          ? resJson.data
          : Array.isArray(resJson.data?.data)
          ? resJson.data.data
          : null;
        if (items) stateCache.students = items;
      }

      if (payRes && payRes.ok) {
        const resJson = await payRes.json();
        const items = Array.isArray(resJson.data)
          ? resJson.data
          : Array.isArray(resJson.data?.data)
          ? resJson.data.data
          : null;
        if (items) stateCache.payments = items;
      }

      if (expRes && expRes.ok) {
        const resJson = await expRes.json();
        const items = Array.isArray(resJson.data)
          ? resJson.data
          : Array.isArray(resJson.data?.data)
          ? resJson.data.data
          : null;
        if (items) stateCache.expenses = items;
      }

      if (setRes && setRes.ok) {
        const resJson = await setRes.json();
        if (resJson.data) {
          stateCache.settings = { ...defaultSettings, ...resJson.data };
        }
      }

      stateCache.initialLoaded = true;
      saveCacheToSession();
    } catch (error) {
      console.error("Failed to sync with MongoDB Atlas API:", error);
    } finally {
      stateCache.loading = false;
      activeFetchPromise = null;
      notify();
    }
  })();

  return activeFetchPromise;
}

export function isAppDataLoading(): boolean {
  return stateCache.loading;
}

export function isAppDataLoaded(): boolean {
  return stateCache.initialLoaded;
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

export function getCoursePrefix(course?: string): string {
  if (!course || !course.trim()) return "S";
  return course.trim().charAt(0).toUpperCase();
}

export function nextStudentId(students: Student[], course?: string) {
  const prefix = getCoursePrefix(course);
  const max = students.reduce((m, s) => {
    const id = (s.id || "").trim().toUpperCase();
    if (id.startsWith(prefix)) {
      const numPart = id.slice(prefix.length).replace(/\D/g, "");
      const n = parseInt(numPart, 10);
      return isNaN(n) ? m : Math.max(m, n);
    }
    return m;
  }, 0);

  return `${prefix}${String(max + 1).padStart(3, "0")}`;
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

  if (student.paidFee > 0) {
    const studentPayments = stateCache.payments.filter(
      (p) => p.studentId === student.id || (student as any).internalId === p.studentId
    );
    const sumPaid = studentPayments.reduce((acc, p) => acc + p.amount, 0);

    if (student.paidFee > sumPaid) {
      const diff = student.paidFee - sumPaid;
      const maxReceipt = stateCache.payments.reduce((max, p) => {
        const n = parseInt(p.receiptNo.replace(/\D/g, ""), 10);
        return Number.isNaN(n) ? max : Math.max(max, n);
      }, 1000);

      stateCache.payments.unshift({
        id: "P" + Date.now(),
        receiptNo: "RCP-" + String(maxReceipt + 1),
        studentId: student.id,
        amount: diff,
        date: student.admissionDate || todayISO(),
        mode: "Cash",
        nextDueDate: student.nextDueDate || "",
        previouslyPaid: sumPaid,
        remainingAfter: Math.max(0, student.totalFee - student.paidFee),
      });
    }
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
export async function login(u: string, p: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: u, password: p }),
    });
    const data = await res.json();
    if (res.ok && data.data?.tokens?.accessToken) {
      const token = data.data.tokens.accessToken;
      stateCache.authToken = token;
      if (isBrowser()) {
        localStorage.setItem("ifms_token", token);
        localStorage.setItem("ifms_auth", "1");
      }
      await fetchAppData();
      return true;
    }
  } catch (error) {
    console.error("Login authentication error:", error);
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
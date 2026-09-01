import { useEffect, useState } from "react";
import { fetchAppData, getExpenses, getPayments, getSettings, getStudents, isAppDataLoading, isAppDataLoaded } from "./store";

export function useAppData() {
  const [tick, setTick] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchAppData();

    const onChange = () => setTick((t) => t + 1);
    window.addEventListener("ifms-change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("ifms-change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const refresh = () => {
    fetchAppData();
    setTick((t) => t + 1);
  };

  const loading = isAppDataLoading();
  const initialLoaded = isAppDataLoaded();

  return {
    mounted,
    tick,
    loading,
    initialLoaded,
    students: getStudents(),
    payments: getPayments(),
    expenses: getExpenses(),
    settings: getSettings(),
    refresh,
  };
}

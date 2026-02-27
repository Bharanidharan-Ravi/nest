import { useDashboardData } from "../api/dashboard.api";
import { useMemo } from "react";

export default function Dashboard() {
  const dateRange = useMemo(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(new Date().setDate(diff));

    const formatDate = (date) => {
      if (!(date instanceof Date)) return null;
      return date.toISOString().split("T")[0];
    };

    return {
      from: formatDate(startOfWeek),
      to: formatDate(today),
    };
  }, []);

  const { data, isLoading } = useDashboardData(dateRange.from, dateRange.to);

  return (
    <div>
      <h2>Dashboard</h2>
      {isLoading ? <p>Loading dashboard...</p> : null}
      {!isLoading && data ? <pre>{JSON.stringify(data, null, 2)}</pre> : null}
    </div>
  );
}

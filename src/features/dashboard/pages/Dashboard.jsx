import { useQueries } from "@tanstack/react-query";
import dashboardConfig from "../config/dashboard.config";
import { useDashboardData } from "../api/dashboard.api";
import { ListProvider } from "../../../packages/ui-List/components/ListProvider";
import { ListLayout } from "../../../packages/ui-List/components/ListLayout";
import { DashboardTableUI, DashboardUI } from "../config/DashboardUI.config";
import { useNavigate } from "react-router-dom";
import { useMasterData } from "../../../core/master/useMasterData";
import { useEffect } from "react";
import { useState } from "react";

export default function Dashboard() {
  // const queries = useQueries({
  //   queries: dashboardConfig.widgets.map(widget => ({
  //     queryKey: ["dashboard", widget.key],
  //     queryFn: () => fetchDashboardData(widget.endpoint)
  //   }))
  // })
const [dateRange, setDateRange] = useState({ from: null, to: null });

  // Helper function with a safety check
  const formatDate = (date) => {
    if (!(date instanceof Date)) return null; 
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    // 1. Get Today
    const today = new Date();

    // 2. Calculate Start of Week (Monday)
    const day = today.getDay();
    // Adjust if today is Sunday (0) to make it -6, otherwise (day - 1)
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(new Date().setDate(diff));

    // 3. Set State using the helper
    setDateRange({
      from: formatDate(startOfWeek), // Returns "YYYY-MM-DD"
      to: formatDate(new Date())     // Returns "YYYY-MM-DD"
    });
  }, []);

  // Hook will now trigger correctly
  const { data, isLoading } = useDashboardData(dateRange.from, dateRange.to);
  // const { data, isLoading } = useProjectData(dateRange.from, dateRange.to);
  //  const { data, isLoading } = useMasterData();
  console.log("data :", data);
  
  const navigate = useNavigate();
  const normalizeRepo = (repo) => ({
    id: repo.Repo_Id,
    title: repo.Title,
    key: repo.RepoKey,
    status: repo.Status,
    owner: repo.OwnerName,
    users: repo.RepoUserList ? JSON.parse(repo.RepoUserList) : [],
    createdAt: repo.CreatedAt,
  });
  // const repos = data?.RepoList?.map(normalizeRepo) || [];

  return (
    <div>
      <h2>Dashboard</h2>
      {/* <ListProvider config={DashboardUI} data={repos}>
        <ListLayout />
      </ListProvider> */}

      {/* <ListProvider config={DashboardTableUI} data={repos}>
        <ListLayout />
      </ListProvider> */}
      {/* {queries.map((query, index) => (
        <div key={index}>
          {query.isLoading && <p>Loading...</p>}
          {query.data && (
            <pre>{JSON.stringify(query.data, null, 2)}</pre>
          )}
        </div>
      ))} */}
    </div>
  );
}

import { useQueries } from "@tanstack/react-query";
import dashboardConfig from "../config/dashboard.config";
import { fetchDashboardData } from "../api/dashboard.api";
import { ListProvider } from "../../../packages/ui-List/components/ListProvider";
import { ListLayout } from "../../../packages/ui-List/components/ListLayout";
import { DashboardTableUI, DashboardUI } from "../config/DashboardUI.config";
import { useNavigate } from "react-router-dom";
import { useMasterData } from "../../../core/master/useMasterData";

export default function Dashboard() {
  // const queries = useQueries({
  //   queries: dashboardConfig.widgets.map(widget => ({
  //     queryKey: ["dashboard", widget.key],
  //     queryFn: () => fetchDashboardData(widget.endpoint)
  //   }))
  // })
   const { data, isLoading } = useMasterData();
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
  const repos = data?.RepoList?.map(normalizeRepo) || [];

  return (
    <div>
      <h2>Dashboard</h2>
      <ListProvider config={DashboardUI} data={repos}>
        <ListLayout />
      </ListProvider>
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

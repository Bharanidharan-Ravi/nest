import { useQueries } from "@tanstack/react-query"
import dashboardConfig from "../config/dashboard.config"
import { fetchDashboardData } from "../api/dashboard.api"

export default function Dashboard() {
  const queries = useQueries({
    queries: dashboardConfig.widgets.map(widget => ({
      queryKey: ["dashboard", widget.key],
      queryFn: () => fetchDashboardData(widget.endpoint)
    }))
  })

  return (
    <div>
      <h2>Dashboard</h2>

      {queries.map((query, index) => (
        <div key={index}>
          {query.isLoading && <p>Loading...</p>}
          {query.data && (
            <pre>{JSON.stringify(query.data, null, 2)}</pre>
          )}
        </div>
      ))}
    </div>
  )
}

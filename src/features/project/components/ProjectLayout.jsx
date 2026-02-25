import { useParams, NavLink, Outlet, Navigate, useLocation } from "react-router-dom"

export default function ProjectLayout() {
  const { projId } = useParams()
  const location = useLocation()
  
  // If user lands exactly on /repository/:repoId → redirect to tickets tab
  if (location.pathname === `/projects/${projId}`) {
    return <Navigate to={`/projects/${projId}/t`} replace />
  }

  return (
    <div className="flex flex-col h-full pb-2">
      {/* Nav Tabs */}
      <div style={{ display: "flex", gap: 20 }}>
        <NavLink to={`/projects/${projId}/overview`}>
          Overview
        </NavLink>
        <NavLink to={`/projects/${projId}/t`}>
          Tickets
        </NavLink>
      </div>

      <hr />

      <Outlet />
    </div>
  )
}

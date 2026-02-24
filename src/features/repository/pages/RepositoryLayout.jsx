import { useParams, NavLink, Outlet, Navigate, useLocation } from "react-router-dom"

export default function RepositoryLayout() {
  const { repoId,ticketId } = useParams()
  const location = useLocation()
  
  // If user lands exactly on /repository/:repoId → redirect to tickets tab
  if (location.pathname === `/repository/${repoId}`) {
    return <Navigate to={`/repository/${repoId}/t`} replace />
  }

  return (
    <div className="flex flex-col h-full pb-2">
      {/* Nav Tabs */}
      <div style={{ display: "flex", gap: 20 }}>
        <NavLink to={`/repository/${repoId}/overview`}>
          Overview
        </NavLink>
        <NavLink to={`/repository/${repoId}/t`}>
          Tickets
        </NavLink>

        <NavLink to={`/repository/${repoId}/p`}>
          Projects
        </NavLink>
      </div>

      <hr />

      <Outlet />
    </div>
  )
}

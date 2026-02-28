/**
 * src/features/repository/pages/RepositoryLayout.jsx
 *
 * Tab bar uses getPath(ROUTE_KEYS.X, { repoId }) — no hardcoded URL strings.
 * If any tab URL changes, only paths.js needs updating.
 */

import {
  NavLink,
  Outlet,
  Navigate,
  useLocation,
  useParams,
} from "react-router-dom";
import { useSmartNavigation } from "../../../core/navigation/useSmartNavigation";
import { ROUTE_KEYS } from "../../../core/routing/paths";

export default function RepositoryLayout() {
  const { repoId } = useParams();
  const location = useLocation();
  const { getPath, goTo } = useSmartNavigation();

  // If user lands exactly on /repository/:repoId → redirect to tickets tab
  const detailPath = getPath(ROUTE_KEYS.REPO_DETAIL, { repoId });
  if (location.pathname === detailPath) {
    return (
      <Navigate to={getPath(ROUTE_KEYS.REPO_TICKET_LIST, { repoId })} replace />
    );
  }

  const createConfig = {
    [ROUTE_KEYS.REPO_TICKET_LIST]: {
      label: "Create Ticket",
      route: ROUTE_KEYS.REPO_TICKET_CREATE,
    },
    [ROUTE_KEYS.REPO_PROJ_LIST]: {
      label: "Create Project",
      route: ROUTE_KEYS.REPO_PROJ_CREATE,
    },
  };

  const tabs = [
    { key: ROUTE_KEYS.REPO_OVERVIEW, label: "Overview" },
    { key: ROUTE_KEYS.REPO_TICKET_LIST, label: "Tickets" },
    { key: ROUTE_KEYS.REPO_PROJ_LIST, label: "Projects" },
  ];
  const activeTab = tabs.find(({ key }) =>
    location.pathname.startsWith(getPath(key, { repoId })),
  );

  const activeCreate = activeTab ? createConfig[activeTab.key] : null;
  return (
    <div className="flex flex-col h-full pb-2">
      {/* Tab bar */}
      <div className="flex items-center justify-between gap-5 border-b border-gray-200 mb-3">
        <div className="flex gap-5" >
          {tabs.map(({ key, label }) => (
            <NavLink
              key={key}
              to={getPath(key, { repoId })}
              className={({ isActive }) =>
                [
                  "pb-2 text-sm font-medium border-b-2 transition-colors",
                  isActive
                    ? "border-brand-yellow text-brand-yellow"
                    : "border-transparent text-gray-500 hover:text-gray-900",
                ].join(" ")
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
        {/* Dynamic Create Button */}
        {activeCreate && (
          <button
            onClick={() => goTo(activeCreate.route, { repoId })}
            className="bg-brand-yellow text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-yellow-500 transition-colors"
          >
            {activeCreate.label}
          </button>
        )}
      </div>

      <Outlet />
    </div>
  );
}

// import { useParams, NavLink, Outlet, Navigate, useLocation } from "react-router-dom"

// export default function RepositoryLayout() {
//   const { repoId } = useParams()
//   const location = useLocation()

//   // If user lands exactly on /repository/:repoId → redirect to tickets tab
//   if (location.pathname === `/repository/${repoId}`) {
//     return <Navigate to={`/repository/${repoId}/t`} replace />
//   }

//   return (
//     <div className="flex flex-col h-full pb-2">
//       {/* Nav Tabs */}
//       <div style={{ display: "flex", gap: 20 }}>
//         <NavLink to={`/repository/${repoId}/overview`}>
//           Overview
//         </NavLink>
//         <NavLink to={`/repository/${repoId}/t`}>
//           Tickets
//         </NavLink>

//         <NavLink to={`/repository/${repoId}/p`}>
//           Projects
//         </NavLink>
//       </div>

//       <hr />

//       <Outlet />
//     </div>
//   )
// }

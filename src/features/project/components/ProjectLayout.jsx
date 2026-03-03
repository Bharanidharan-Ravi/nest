import { useParams, NavLink, Outlet, Navigate, useLocation } from "react-router-dom"
import { useSmartNavigation } from "../../../core/navigation/useSmartNavigation";
import { ROUTE_KEYS } from "../../../core/routing/paths";

export default function ProjectLayout() {
  const { projId } = useParams();
  const location = useLocation();
  const { getPath, goTo } = useSmartNavigation();


  const detailPath = getPath(ROUTE_KEYS.PROJ_DETAIL, { projId });
  if (location.pathname === detailPath) {
    return (
      <Navigate to={getPath(ROUTE_KEYS.PROJ_TICKET_LIST, { projId })} replace />
    );
  }

  // If user lands exactly on /repository/:repoId → redirect to tickets tab
  // if (location.pathname === `/projects/${projId}`) {
  //   return <Navigate to={`/projects/${projId}/t`} replace />
  // }

  const createConfig = {
    [ROUTE_KEYS.PROJ_TICKET_LIST]: {
      label: "Create Ticket",
      route: ROUTE_KEYS.PROJ_TICKET_CREATE,
    },
  };

  const tabs = [
    { key: ROUTE_KEYS.PROJ_OVERVIEW, label: "Overview" },
    { key: ROUTE_KEYS.PROJ_TICKET_LIST, label: "Tickets" },
  ];
  const activeTab = tabs.find(({ key }) =>
    location.pathname.startsWith(getPath(key, { projId })),
  );

  const activeCreate = activeTab ? createConfig[activeTab.key] : null;
  const isActionRoute = location.pathname.endsWith('/create') || location.pathname.endsWith('/edit');
  return (
    <div className="flex flex-col h-full pb-2">
      {/* Nav Tabs */}
      <div className="flex items-center justify-between gap-5 border-b border-gray-200 mb-3">
        <div className="flex gap-5" >
          {tabs.map(({ key, label }) => (
            <NavLink
              key={key}
              to={getPath(key, { projId })}
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
        {activeCreate && !isActionRoute && (
          <button
            onClick={() => goTo(activeCreate.route, { projId })}
            className="bg-brand-yellow text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-yellow-500 transition-colors"
          >
            {activeCreate.label}
          </button>
        )}
      </div>

      <hr />

      <Outlet />
    </div>
  )
}

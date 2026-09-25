import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useSmartNavigation } from "../../core/navigation/useSmartNavigation";
import { useCurrentUser } from "../../core/auth/useCurrentUser";
import { PERMISSIONS } from "../../core/auth/permissions";
import { PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { WGLogoLoader } from "../shared/GlobalUI/WGLogoLoader";
import workglowlogo from "../../assets/WORKGLOWLOGO.png";

import { useState, useMemo } from "react";
import { useMasterData } from "../../core/master/masterCall/useMasterData";
import { ROUTE_KEYS } from "../../core/routing/paths";
import MessengerNavBadge from "../../features/messenger/components/MessengerNavBadge";
import LeaveRequestNavBadge from "../../features/leaveRequest/components/LeaveRequestNavBadge";

// Sidebar nav keys that carry an unread/pending badge, and the badge to render.
const NAV_BADGES = {
  [ROUTE_KEYS.MESSENGER]: MessengerNavBadge,
  [ROUTE_KEYS.LEAVE_LIST]: LeaveRequestNavBadge,
};

export const Sidebar = ({ isOpen, onClose, onToggle }) => {
  const { data } = useMasterData();
  const { getSidebarRoutes } = useSmartNavigation();
  const { can, isViewer } = useCurrentUser();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Logo (eyes when collapsed, full logo when expanded) goes home:
  // dashboard, or tickets for viewers who have no dashboard
  const handleLogoClick = () => {
    const home = isViewer ? "/tickets" : "/dashboard";
    if (pathname !== home) navigate(home);
    onClose?.();
  };

  // State for Search and Sort
  const [searchQuery, setSearchQuery] = useState("");
  // Defaulting to recently updated is often good UX for repos, but you can change it back to "asc"
  const [sortOrder, setSortOrder] = useState("asc");

  const sidebarRoutes = getSidebarRoutes();
  const repos = data?.RepoList || [];

  // Filter and Sort Logic
  const filteredAndSortedRepos = useMemo(() => {
    // 1. Filter based on search query
    let processedRepos = repos.filter((repo) =>
      repo.Title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // 2. Sort based on the selected order
    processedRepos.sort((a, b) => {
      if (sortOrder === "asc") {
        return a.Title.localeCompare(b.Title);
      } else if (sortOrder === "desc") {
        return b.Title.localeCompare(a.Title);
      } else if (sortOrder === "recent-updated") {
        // Ensure "UpdatedAt" matches your actual API data property
        return new Date(b.UpdatedAt || 0) - new Date(a.UpdatedAt || 0);
      } else if (sortOrder === "recent-created") {
        // Ensure "CreatedAt" matches your actual API data property
        return new Date(b.CreatedAt || 0) - new Date(a.CreatedAt || 0);
      }
      return 0;
    });

    return processedRepos;
  }, [repos, searchQuery, sortOrder]);

  // Labels fade in after the panel has started widening, and out immediately on collapse
  const labelClass = [
    "whitespace-nowrap transition-opacity duration-200",
    isOpen ? "opacity-100 delay-100" : "opacity-0",
  ].join(" ");

  // Shared row shape: a 40px icon box that stays put, the label grows to its right
  const rowClass = "relative h-10 shrink-0 flex items-center gap-3 px-2.5 rounded-md";

  return (
    <>
      {/* Backdrop while expanded */}
      <div
        onClick={onClose}
        className={[
          "fixed inset-0 bg-black/30 z-[9998] transition-opacity duration-300",
          isOpen ? "opacity-100 visible" : "opacity-0 invisible",
        ].join(" ")}
      />

      {/* Placeholder keeps a 64px column in the layout; the panel inside widens
          over the page, so the content never jumps */}
      <div className="relative flex-none w-16 h-full z-[9999]">
        <nav
          className={[
            "absolute inset-y-0 left-0 flex flex-col gap-1 py-3 overflow-hidden border-r border-gray-200",
            "transition-[width,background-color,box-shadow] duration-300 ease-in-out",
            isOpen ? "w-[260px] bg-white shadow-2xl" : "w-16 bg-brand-gray-light",
          ].join(" ")}
        >
          {/* Logo — eyes when collapsed, cross-fading to the full logo when expanded */}
          <button
            onClick={handleLogoClick}
            title="WorkGlow"
            className="relative h-10 mx-3 mb-1 shrink-0 flex items-center"
          >
            <WGLogoLoader
              animate={false}
              className={`absolute left-1 w-8 h-auto transition-opacity duration-200 ${isOpen ? "opacity-0" : "opacity-100"}`}
            />
            <img
              src={workglowlogo}
              alt="WorkGlow"
              className={`absolute left-1 w-[100px] max-w-none h-auto transition-opacity duration-200 ${isOpen ? "opacity-100 delay-100" : "opacity-0"}`}
            />
          </button>

          <div className="mx-3 border-t border-gray-200 mb-2 shrink-0" />

          {/* Toggle — same spot in both states, only the icon swaps */}
          <button
            onClick={onToggle}
            title={isOpen ? "Collapse menu" : "Expand menu"}
            className={`${rowClass} mx-3 mb-2 text-gray-600 hover:bg-white hover:text-gray-800 font-semibold text-sm`}
          >
            {isOpen ? <PanelLeftClose size={20} className="shrink-0" /> : <PanelLeftOpen size={20} className="shrink-0" />}
            <span className={labelClass}>Menu</span>
          </button>

          {/* Scrollable body: routes + (expanded only) repositories */}
          {/* Collapsed: scrollbar hidden (still scrollable) so it doesn't eat into the
              64px rail and push the icon boxes off-center */}
          <div
            className={[
              "flex-1 min-h-0 flex flex-col gap-1 px-3 overflow-y-auto overflow-x-hidden",
              isOpen ? "wg-scrollbar" : "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            ].join(" ")}
          >
            {sidebarRoutes.map((route) => {
              const Icon = route.icon;
              const Badge = NAV_BADGES[route.key];
              return (
                <NavLink
                  key={route.key}
                  to={route.fullPath}
                  onClick={onClose}
                  title={isOpen ? undefined : route.title}
                  className={({ isActive }) =>
                    [
                      rowClass,
                      "text-sm font-medium transition-colors",
                      isActive
                        ? "bg-brand-yellow text-white shadow-sm hover:text-white"
                        : "text-gray-600 hover:bg-white hover:shadow-sm",
                    ].join(" ")
                  }
                >
                  {Icon ? (
                    <Icon size={20} className="shrink-0" />
                  ) : (
                    <span className="w-5 text-center shrink-0">{route.title.charAt(0)}</span>
                  )}
                  <span className={labelClass}>{route.title}</span>
                  {Badge && (
                    <span className={isOpen ? "ml-auto" : "absolute -top-1 -right-1"}>
                      <Badge />
                    </span>
                  )}
                </NavLink>
              );
            })}

            {/* Repo Section — only meaningful with labels, so it fades with them */}
            {can(PERMISSIONS.REPO_CREATE) && (
              <div
                className={[
                  "mt-4 pt-3 border-t border-gray-200 flex flex-col min-h-0 w-[236px] transition-all duration-200",
                  isOpen ? "opacity-100 visible delay-100" : "opacity-0 invisible",
                ].join(" ")}
              >
                <div className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Repositories
                </div>

                {/* Search and Sort Controls */}
                <div className="px-3 mt-2 mb-1 flex gap-2">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:border-gray-500 transition-colors"
                  />
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="text-sm px-1 py-1.5 border border-gray-300 rounded-md bg-white focus:outline-none focus:border-gray-500 cursor-pointer max-w-[100px]"
                    title="Sort repositories"
                  >
                    <option value="recent-updated">Updated</option>
                    <option value="recent-created">Created</option>
                    <option value="asc">A-Z</option>
                    <option value="desc">Z-A</option>
                  </select>
                </div>

                {/* Repository List */}
                <div className="mt-1 flex flex-col gap-1 max-h-[40vh] overflow-y-auto overflow-x-hidden">
                  {filteredAndSortedRepos.length > 0 ? (
                    filteredAndSortedRepos.map((repo) => (
                      <NavLink
                        key={repo.Repo_Id}
                        to={`/repository/${repo.Repo_Id}`}
                        onClick={onClose}
                        className={({ isActive }) =>
                          [
                            "flex items-center px-3 py-2 font-semibold rounded-md text-sm transition-colors hover:bg-gray-100 truncate",
                            isActive
                              ? "bg-brand-yellow text-black"
                              : "text-gray-600 hover:none",
                          ].join(" ")
                        }
                        title={repo.Title}
                      >
                        {repo.Title}
                      </NavLink>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-sm text-gray-400 italic text-center">
                      No repositories found.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>
    </>
  );
};

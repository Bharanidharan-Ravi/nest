import { NavLink } from "react-router-dom";
import { useSmartNavigation } from "../../core/navigation/useSmartNavigation";
import { buildPath } from "../../core/routing/routeRegistry";
import { useCurrentUser } from "../../core/auth/useCurrentUser";
import { PERMISSIONS } from "../../core/auth/permissions";

import { useState, useMemo } from "react";
import { useMasterData } from "../../core/master/masterCall/useMasterData";

export const Sidebar = ({ isOpen, onClose }) => {
  const { data } = useMasterData();
  const { getSidebarRoutes } = useSmartNavigation();
  const { can } = useCurrentUser();

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

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={[
          "fixed inset-0 bg-black/40 z-40 transition-opacity duration-300",
          isOpen ? "opacity-100 visible" : "opacity-0 invisible",
        ].join(" ")}
      />

      {/* Sidebar */}
      <nav
        className={[
          "fixed top-0 left-0 h-screen w-[260px] bg-white border-r border-gray-200 z-50",
          "flex flex-col gap-1 p-3",
          "transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-2 py-2 mb-2">
          <h5 className="font-bold text-gray-700 m-0">Menu</h5>
          <button
            className="text-gray-500 hover:text-gray-800 text-2xl leading-none"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        {/* Main Routes */}
        {sidebarRoutes.map((route) => (
          <NavLink
            key={route.key}
            to={route.fullPath}
            onClick={onClose}
            className={({ isActive }) =>
              [
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-gray-100",
                isActive
                  ? "bg-brand-yellow text-black"
                  : "text-gray-700 hover:none",
              ].join(" ")
            }
          >
            {route.title}
          </NavLink>
        ))}

        {/* Repo Section */}
        {can(PERMISSIONS.REPO_CREATE) && (
          <div className="mt-4 pt-3 border-t border-gray-200 flex flex-col min-h-0">
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
      </nav>
    </>
  );
};
///////////////Gemini code//////////////////
// // src/components/Sidebar/Sidebar.jsx
// import React, { Fragment } from "react";
// import { NavLink } from "react-router-dom";
// import { useSmartNavigation } from "../../core/navigation/useSmartNavigation";
// import { useMasterData } from "../../core/master/useMasterData";

// export const Sidebar = ({ isOpen, onClose }) => {
//   const { getSidebarRoutes } = useSmartNavigation();
//   const sidebarRoutes = getSidebarRoutes();

//   // Bring back the dynamic data fetch
//   const { data } = useMasterData();

//   // Helper to keep the base NavLink classes DRY
//   const getBaseLinkClass = ({ isActive }) =>
//     [
//       "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
//       isActive
//         ? "bg-brand-yellow text-white"
//         : "text-gray-700 hover:bg-gray-100",
//     ].join(" ");

//   return (
//     <>
//       {/* Mobile overlay */}
//       {isOpen && (
//         <div
//           className="fixed inset-0 bg-black/40 z-20 lg:hidden"
//           onClick={onClose}
//         />
//       )}

//       <nav
//         className={[
//           "flex flex-col gap-1 p-3 bg-white border-r border-gray-200 z-30 min-w-[200px] h-full overflow-y-auto",
//           "transition-transform duration-200 fixed lg:static top-0 left-0 bottom-0",
//           isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
//         ].join(" ")}
//       >
//         {/* Mobile Header with Close Button (Restored from old UI) */}
//         <div className="flex items-center justify-between px-2 py-2 mb-2 lg:hidden">
//           <h5 className="font-bold text-gray-700 m-0">Menu</h5>
//           <button
//             className="text-gray-500 hover:text-gray-800 text-2xl leading-none"
//             onClick={onClose}
//           >
//             &times;
//           </button>
//         </div>

//         {/* Map through the smart routes but intercept specific items for layout control */}
//         {sidebarRoutes.map((route) => (
//           <Fragment key={route.key}>
//             {/* 1. Render the main route link */}
//             <NavLink
//               to={route.fullPath}
//               onClick={onClose}
//               className={getBaseLinkClass}
//             >
//               {route.title}
//             </NavLink>

//             {/* 2. Inject <hr /> separators to recreate your UI blocks */}
//             {(route.title === "Dashboard" || route.title === "Employee master") && (
//               <hr className="my-2 border-gray-200" />
//             )}

//             {/* 3. Inject Dynamic Repo List right under the Repositories link */}
//             {route.title === "Repositories" && data?.RepoList && (
//               <div className="flex flex-col gap-1 mt-1 pl-3 ml-2 border-l-2 border-gray-100">
//                 {data.RepoList.map((repo) => (
//                   <NavLink
//                     key={repo.Repo_Id}
//                     to={`/repository/${repo.Repo_Id}`}
//                     onClick={onClose}
//                     className={({ isActive }) =>
//                       [
//                         "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
//                         isActive
//                           ? "bg-gray-100 text-gray-900 font-semibold" // Subtle active state for sub-links
//                           : "text-gray-500 hover:bg-gray-100 hover:text-gray-900",
//                       ].join(" ")
//                     }
//                   >
//                     {repo.Title}
//                   </NavLink>
//                 ))}
//               </div>
//             )}
//           </Fragment>
//         ))}
//       </nav>
//     </>
//   );
// };

// import { Link } from "react-router-dom";
// import "../css/sideBar.css"; // Ensure you import the CSS file created above
// import { useMasterData } from "../../core/master/useMasterData";

// export default function Sidebar({ isOpen, onClose }) {
//   // const { data, isLoading } = useRepoMaster();
//    const { data } = useMasterData();

//   return (
//     <>
//       {/* 1. The Overlay (Clicking this closes the sidebar) */}
//       <div
//         className={`sidebar-overlay ${isOpen ? "open" : ""}`}
//         onClick={onClose}
//       />

//       {/* 2. The Sidebar Drawer */}
//       <div className={`sidebar-container ${isOpen ? "open" : ""}`}>

//         {/* Header with Close Button */}
//         <div className="sidebar-header">
//           <h5 style={{ margin: 0 }}>Menu</h5>
//           <button className="close-btn" onClick={onClose}>
//             &times; {/* This is an 'X' symbol */}
//           </button>
//         </div>

//         {/* Content */}
//         <div className="sidebar-content">
//           <div>
//             <Link to="/dashboard" onClick={onClose}>Dashboard</Link>
//           </div>

//           <hr />
//           <div className="d-flex flex-column gap-2">
//             <div>
//               <Link to="/tickets" onClick={onClose}>Tickets</Link>
//             </div>
//             <div>
//               <Link to="/projects" onClick={onClose}>Projects</Link>
//             </div>
//             <div>
//               <Link to="/projects" onClick={onClose}>Labels</Link>
//             </div><div>
//               <Link to="/projects" onClick={onClose}>Employee master</Link>
//             </div>
//           </div>
//           <hr />

//           <div>
//             <Link to="/repository" onClick={onClose}>Repositories</Link>
//           </div>

//           {/* {isLoading && <p>Loading...</p>} */}

//           <div className="d-flex flex-column gap-2 mt-2">
//             {data?.RepoList?.map((repo) => (
//               <div key={repo.Repo_Id}>
//                 <Link to={`/repository/${repo.Repo_Id}`} onClick={onClose}>
//                   {repo.Title}
//                 </Link>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

// src/components/Sidebar/Sidebar.jsx
/**
 * src/app/layout/Sidebar.jsx
 *
 * Sidebar links are driven entirely by routes with inSidebar: true.
 * No hardcoded list to maintain — add a route to a feature with inSidebar: true
 * and it appears here automatically.
 */

/**
 * src/app/layout/Sidebar.jsx
 *
 * Sidebar links come from routes with inSidebar: true in the nav registry.
 * No hardcoded list to maintain — set inSidebar: true in a route's nav object
 * and it appears here automatically.
 */

////////////////////////// new code////////////////////////////////////////
// import { NavLink } from "react-router-dom";
// import { useSmartNavigation } from "../../core/navigation/useSmartNavigation";

// export const Sidebar = ({ isOpen, onClose }) => {
//   const { getSidebarRoutes } = useSmartNavigation();
//   const sidebarRoutes = getSidebarRoutes();

//   return (
//     <>
//       {/* Mobile overlay */}
//       {isOpen && (
//         <div
//           className="fixed inset-0 bg-black/40 z-20 lg:hidden"
//           onClick={onClose}
//         />
//       )}

//       <nav
//         className={[
//           "flex flex-col gap-1 p-3 bg-white border-r border-gray-200 z-30 min-w-[200px]",
//           "transition-transform duration-200",
//           isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
//         ].join(" ")}
//       >
//         {sidebarRoutes.map((route) => (
//           <NavLink
//             key={route.key}
//             to={route.fullPath}
//             onClick={onClose}
//             className={({ isActive }) =>
//               [
//                 "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
//                 isActive
//                   ? "bg-brand-yellow text-white"
//                   : "text-gray-700 hover:bg-gray-100",
//               ].join(" ")
//             }
//           >
//             {route.title}
//           </NavLink>
//         ))}
//       </nav>
//     </>
//   );
// };

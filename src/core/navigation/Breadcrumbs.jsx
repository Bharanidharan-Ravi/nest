// import { Link, useLocation, useParams } from "react-router-dom";
// import { useTicketMaster } from "../../features/tickets/hooks/useTicketMaster";
// import "./Breadcrumbs.css";
// import { useMasterData } from "../master/useMasterData";

// export default function Breadcrumbs() {
//   const location = useLocation();
//   const { repoId, ticketId, projId } = useParams();

//   const pathnames = location.pathname.split("/").filter(Boolean);
//   // const { data: repoList } = useRepoMaster();
//   // const { data: ticketList } = useTicketMaster(repoId);
//   const { data } = useMasterData();
//   const { data: ticketList } = useTicketMaster(repoId, {
//     enabled: !!ticketId,
//   });

//   const getLabel = (value) => {
//     if (value === "repository") return "Repository";
//     if (value === "t") return "Tickets";
//     if (value === "p") return "Projects";
//     if (value === "overview") return "Overview";
//     if (value === "projects") return "Projects";

//     if (value === repoId) {
//       if (!data?.RepoList) return "Loading...";
//       const repo = data?.RepoList?.find((r) => r.Repo_Id === value);
//       return repo?.Title || "Unknown Repo";
//     }

//     if (value === ticketId) {
//       if (!ticketList) return "Loading...";
//       const ticket = ticketList?.find((t) => t.Issue_Id === value);
//       return ticket?.Issue_Title || "Unknown Ticket";
//     }

//     if (value === projId) {
//       if (!data?.ProjectList) return "Loading...";
//       const ticket = data?.ProjectList?.find((t) => t.Id === value);
//       return ticket?.Project_Name || "Unknown Project";
//     }
//     return value;
//   };
//   const isHidden = (value) => {
//     return value === "dashboard";
//   };

//   return (
//     <nav aria-label="breadcrumb" className="breadcrumb-container">
//       <Link to="/dashboard" className="breadcrumb-link">
//         Home
//       </Link>

//       {pathnames.map((value, index) => {
//         // 1. Hide unwanted segments
//         if (isHidden(value)) return null;

//         const isLast = index === pathnames.length - 1;

//         // 2. FIX: Join the array to create a valid URL string
//         let to = "/" + pathnames.slice(0, index + 1).join("/");

//         // if (value === repoId) {
//         //   to = `${to}/overview`;
//         // }
//         return (
//           // 3. FIX: Renamed class to 'custom-breadcrumb-item' to stop Bootstrap double slashes
//           <span key={to} className="custom-breadcrumb-item">
//             <span className="breadcrumb-separator">/</span>

//             {isLast ? (
//               <span className="breadcrumb-active">{getLabel(value)}</span>
//             ) : (
//               <Link to={to} className="breadcrumb-link">
//                 {getLabel(value)}
//               </Link>
//             )}
//           </span>
//         );
//       })}
//     </nav>
//   );
// }
// //   return (
// //     <div className="textdesign">
// //       <Link to="/dashboard">Home</Link>
// //       {pathnames.map((value, index) => {
// //         const to = "/" + pathnames.slice(0, index + 1).join("/");
// //         if (isHidden(value)) return null;
// //         return (
// //           <span key={to}>
// //             {" / "}
// //             <Link to={to}>{getLabel(value, index)}</Link>
// //           </span>
// //         );
// //       })}
// //     </div>
// //   );
// // }

// src/components/Breadcrumbs/Breadcrumbs.jsx

/**
 * src/core/routing/Breadcrumbs.jsx
 *
 * Breadcrumbs derived from the route registry's parent chain.
 * Dynamic labels (repo name, ticket title) resolved from React Query cache
 * — no extra API calls, no prop drilling.
 *
 * To add a dynamic label for a new route:
 *   Add a case to `titleResolver` below.
 */
/**
 * src/core/routing/Breadcrumbs.jsx
 *
 * Breadcrumb trail from root → current page.
 * Dynamic labels (real repo name, ticket title) pulled from React Query cache —
 * no extra API calls, no prop drilling.
 *
 * To add a dynamic label for a new route:
 *   Add a case to titleResolver() below.
 */

import { Link, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useSmartNavigation } from "./useSmartNavigation";
import { queryKeys } from "../query/queryKeys";
import { masterKeys } from "../master/masterKeys";
import { ROUTE_KEYS } from "../routing/paths";
import { useMasterData } from "../master/useMasterData";

export const Breadcrumbs = () => {
  const { getBreadcrumbs } = useSmartNavigation();
  const { repoId, ticketId, projId } = useParams();
  const queryClient = useQueryClient();
  const { data } = useMasterData();

  /**
   * Return a human-readable label for dynamic route segments.
   * Data is already in cache (prefetched by RouteDataLoader).
   * Return null to fall back to the static route.title from paths.js.
   */
  const titleResolver = (key) => {
    switch (key) {
      case ROUTE_KEYS.REPO_DETAIL: {
        if (!data?.RepoList) return "Loading...";
        const master = data?.RepoList;
        return (
          master?.find((r) => r.Repo_Id === repoId)?.Title ?? null
        );
      }
      case ROUTE_KEYS.TICKET_DETAIL: {
        if (!ticketId) return null;
        const tickets = queryClient.getQueryData(
          queryKeys.ticket.list({ repoId }),
        );
        return (
          tickets?.find((t) => t.Issue_Id === ticketId)?.Issue_Title ?? null
        );
      }
      case ROUTE_KEYS.PROJ_DETAIL: {
        if (!data?.ProjectList) return "Loading...";
        const projs = data?.ProjectList;
        return projs?.find((t) => t.Id === projId)?.Project_Name ?? null;
      }
      default:
        return null;
    }
  };

  const breadcrumbs = getBreadcrumbs(titleResolver);

  return (
    <nav
      aria-label="breadcrumb"
      className="flex items-center gap-1 text-sm text-gray-500"
    >
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        return (
          <span key={crumb.key} className="flex items-center gap-1">
            {index > 0 && <span className="text-gray-300 select-none">/</span>}
            {isLast ? (
              <span className="text-gray-900 font-medium" aria-current="page">
                {crumb.title}
              </span>
            ) : (
              <Link
                to={crumb.path}
                className="hover:text-gray-900 transition-colors"
              >
                {crumb.title}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
};

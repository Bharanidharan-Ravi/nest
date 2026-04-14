import { Link, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useSmartNavigation } from "./useSmartNavigation";
import { queryKeys } from "../query/queryKeys";
import { ROUTE_KEYS } from "../routing/paths";
import { useMasterData } from "../master/masterCall/useMasterData";

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
          queryKeys.ticket.list(),
        );
        
        return (
          tickets?.find((t) => t.Issue_Id === ticketId)?.Title ?? null
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

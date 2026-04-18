import { Link, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useSmartNavigation } from "./useSmartNavigation";
import { queryKeys } from "../query/queryKeys";
import { ROUTE_KEYS } from "../routing/paths";
import { useMasterData } from "../master/masterCall/useMasterData";
import { useProjectById, useRepoById } from "../master/selectors/selectors";

export const Breadcrumbs = () => {
  const { getBreadcrumbs } = useSmartNavigation();
  const { repoId, ticketId, projId } = useParams();
  const queryClient = useQueryClient();
  const { data } = useMasterData();
  const repodata = useRepoById(repoId); // 👈 This is a hook, but it's safe to call here because it's not conditional. It will always run when the component renders, and it will read from the cache without causing a re-render
  const ProjectKey = useProjectById(projId);

  /**
   * Return a human-readable label for dynamic route segments.
   * Data is already in cache (prefetched by RouteDataLoader).
   * Return null to fall back to the static route.title from paths.js.
   */
  const titleResolver = (key) => {
    switch (key) {
      case ROUTE_KEYS.REPO_DETAIL: {
        if (!repodata) return "Loading...";
        const master = repodata?.key;
        // return master?.find((r) => r.Repo_Id === repoId)?.Title ?? null;
        return master;
      }
      case ROUTE_KEYS.TICKET_DETAIL: {
        if (!ticketId) return null;
        const tickets = queryClient.getQueryData(queryKeys.ticket.list());
  console.log("repo data :", tickets);

        return tickets?.find((t) => t.Issue_Id === ticketId)?.Issue_Code ?? null;
      }
      case ROUTE_KEYS.PROJ_DETAIL: {
        if (!ProjectKey) return "Loading...";
        const projs = ProjectKey.projectKey;
        return projs;
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

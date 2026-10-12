import { useApiQuery } from "../../../core/query/useApiQuery";
import { queryKeys } from "../../../core/query/queryKeys";
import {
  TICKET_DETAIL_KEY,
  TICKET_LIST_KEY,
  ticketDetailPayload,
  ticketListPayload,
} from "../../../core/sync/ticketListV2";

// Raw ticket rows (ids only; map names with normalizeTicketListRow):
//   { ticketId }          → that one ticket, with the ticket screen columns
//                           (TicketDetailV2)
//   { employeeId }        → tickets the employee owns, created or works on
//   { repoId, projectId } → that repo / project
//   nothing               → every ticket the user can see
export const useTicketMaster = (scope = {}, options = {}) => {
  const repoId = scope.repoId ?? null;
  const projectId = scope.projectId ?? null;
  const ticketId = scope.ticketId ?? null;
  const employeeId = scope.employeeId ?? null;

  const queryKey = ticketId
    ? queryKeys.ticket.detail(ticketId)
    : employeeId
    ? queryKeys.ticket.byEmployee(employeeId)
    : queryKeys.ticket.list({
        repoId: repoId ?? "global",
        projectId: projectId ?? "all",
      });

  const filters = employeeId
    ? { f: { member: [employeeId] } }
    : projectId
    ? { f: { project: [projectId] } }
    : {};

  const staleTime = (ticketId || employeeId) ? 0 : 1000 * 60 * 3;
  return useApiQuery({
    queryKey,
    url: "/sync/v2",
    method: "POST",
    payload: ticketId ? ticketDetailPayload(ticketId) : ticketListPayload(filters, repoId),
    source: ticketId ? TICKET_DETAIL_KEY : TICKET_LIST_KEY,
    options: {
      staleTime,
      enabled:
        options.enabled !== undefined
          ? options.enabled
          : ticketId
            ? Boolean(ticketId)
            : projectId
              ? Boolean(repoId || projectId)
              : true,
      ...options,
    },
  });
};

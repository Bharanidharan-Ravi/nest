import { useApiQuery } from "../../../core/query/useApiQuery";
import { queryKeys } from "../../../core/query/queryKeys";
import { buildSyncPayload } from "../../../core/sync/buildSyncPayload";

export const useTicketMaster = (scope = {}, options = {}) => {
  const repoId = scope.repoId ?? null;
  const projectId = scope.projectId ?? null;
  // 🔥 1. Extract ticketId
  const ticketId = scope.ticketId ?? null;
  const employeeId = scope.employeeId ?? null;

  const queryKey = ticketId
    ? queryKeys.ticket.detail(ticketId)
    : employeeId
    ? queryKeys.ticket.byEmployee(employeeId) // 👈 Uses the new key!
    : queryKeys.ticket.list({
        repoId: repoId ?? "global",
        projectId: projectId ?? "all",
      });
  let dynamicIdParams = {};

  if (ticketId) {
    dynamicIdParams = { idKey: "IssueId", idValue: ticketId };
  } else if (employeeId) {
    dynamicIdParams = { idKey: "EmployeeId", idValue: employeeId };
  } else if (projectId) {
    dynamicIdParams = { idKey: "projectId", idValue: projectId };
  }
  // 🔥 3. Prioritize ticketId in the payload
  const payload = buildSyncPayload({
    configKey: "TicketsList",
    repoId,
    ...dynamicIdParams,
  });
  
  const staleTime = (ticketId || employeeId) ? 0 : 1000 * 60 * 3;
  return useApiQuery({
    queryKey,
    url: "/sync/v2",
    method: "POST",
    payload,
    source: "TicketsList",
    options: {
      staleTime,
      enabled:
        options.enabled !== undefined
          ? options.enabled
          : ticketId // 🔥 4. Update enabled logic for ticketId
            ? Boolean(ticketId)
            : projectId
              ? Boolean(repoId || projectId)
              : true,
      ...options,
    },
  });
};

// export const useTicketMaster = (scope = {}, options = {}) => {
//   const isScopeObject = scope && typeof scope === "object";

//   const repoId = isScopeObject ? scope.repoId : scope;
//   const projectId = isScopeObject ? scope.projectId ?? scope.projId : null;

//   const hasRepoId = Boolean(repoId);
//   const hasProjectId = Boolean(projectId);

//   const payload = {
//     ConfigKeys: ["TicketsList"],
//     ...(hasRepoId || hasProjectId
//       ? {
//           Params: {
//             TicketsList: {
//               ...(hasRepoId ? { repoId } : {}),
//               ...(hasProjectId ? { projectId } : {}),
//             },
//           },
//         }
//       : {}),
//   };

//   return useApiQuery({
//     queryKey: queryKeys.ticket.list({
//       repoId: hasRepoId ? repoId : "global",
//       projectId: hasProjectId ? projectId : "all",
//     }),

//     url: "/sync/v2",
//     method: "POST",
//     payload,
//     source: "TicketsList",
//     options: {
//       staleTime: 5 * 60 * 1000,
//       // 2. Merge the passed options.
//       // If 'enabled' is passed in options, use it; otherwise default to true.
//       ...options,
//       enabled: options.enabled !== undefined ? options.enabled : true,
//     },
//   });
// };

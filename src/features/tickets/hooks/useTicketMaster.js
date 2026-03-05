import { useApiQuery } from "../../../core/query/useApiQuery";
import { queryKeys } from "../../../core/query/queryKeys";
import { buildSyncPayload } from "../../../core/sync/buildSyncPayload";

export const useTicketMaster = (scope = {}, options = {}) => {
  const repoId = scope.repoId ?? null;
  const projectId = scope.projectId ?? null;
  // 🔥 1. Extract ticketId
  const ticketId = scope.ticketId ?? null; 
  
  console.log("scope :", scope);

  ///- Query key- unique per scope -------------------
  // master: ["ticket", "list", "global", "all", "all"]
  // by repo: ["ticket", "list", "repo-Id", "all", "all"]
  // by project: ["ticket", "list", "repo-id", "proj-id", "all"]
  // by ticket: ["ticket", "list", "repo-id", "proj-id", "ticket-id"]

  // 🔥 2. Add ticketId to the query key so it caches separately from the list
  const queryKey = queryKeys.ticket.list({
    repoId: repoId ?? "global",
    projectId: projectId ?? "all",
    ticketId: ticketId ?? "all" 
  });

  // 🔥 3. Prioritize ticketId in the payload
  const payload = buildSyncPayload({
    configKey: "TicketsList",
    repoId,
    ...(ticketId 
      ? { idKey: "IssueId", idValue: ticketId } // Use whatever parameter name your GetIssuesByID SP expects (e.g., "IssuesId" or "Id")
      : projectId 
        ? { idKey: "projectId", idValue: projectId } 
        : {}
    )
  });

  return useApiQuery({
    queryKey,
    url: "/sync/v2",
    method: "POST",
    payload,
    source: "TicketsList",  
    options: {
      staleTime: 5 * 60 * 1000,
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

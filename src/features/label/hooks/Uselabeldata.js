// ─────────────────────────────────────────────────────────────────────────────
// useLabelData.js
// Matches useProjectData.js pattern exactly.
//
// Labels are global master data — no repoId scope.
// Read via sync/v2 with ConfigKey "LabelMaster" (matches SyncRepositoryConfigStore).
// ─────────────────────────────────────────────────────────────────────────────
import { executeApi }        from "../../../core/api/executor"
import { queryKeys }         from "../../../core/query/queryKeys"
import { useApiQuery }       from "../../../core/query/useApiQuery"
import { buildSyncPayload }  from "../../../core/sync/buildSyncPayload"

export const fetchLabelList = (config = {}, labelId = null) => {
  return executeApi({
    url:    "/sync/v2",
    method: "POST",
    payload: buildSyncPayload({
      configKey: "LabelMaster",
      // No repoId — labels are global, not scoped to a repo
      ...(labelId && { idKey: "Id", idValue: labelId })
    }),
    config
  })
}

export const useLabelData = (labelId = null) => {
  console.log("labelId :", labelId);
  
  return useApiQuery({
    queryKey: labelId
      ? queryKeys.label.detail(labelId)
      : queryKeys.label.list(),

    queryFn: (config) => fetchLabelList(config, labelId),
    source: "LabelMaster",

    options: {
      staleTime: 0,
      enabled: true,   // always enabled — no param dependency
    },
  })
}
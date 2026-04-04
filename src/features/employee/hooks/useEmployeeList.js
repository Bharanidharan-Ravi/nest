import { useQuery } from "@tanstack/react-query";
import { executeApi } from "../../../core/api/executor";
import { masterKeys } from "../../../core/master/masterKeys";
import { fetchMasterData } from "../../../core/master/masterService";
import { queryKeys } from "../../../core/query/queryKeys";
import { useApiQuery } from "../../../core/query/useApiQuery";
import { buildSyncPayload } from "../../../core/sync/buildSyncPayload";

export const fetchemployeeList = (config = {}, EmployeeId = null) => {
  console.log("its trigger:", EmployeeId, config);
  const payload = buildSyncPayload({
    configKey: "EmployeeList",
    // No repoId — labels are global, not scoped to a repo
    ...(EmployeeId && { idKey: "EmployeeID", idValue: EmployeeId }),
  });
  console.log("payload :", payload);

  return executeApi({
    url: "/sync/v2",
    method: "POST",
    payload: payload,
    config,
  });
};

export const getEmployeeList = (EmployeeId = null) => {
  const query = EmployeeId
    ? queryKeys.employee.list(EmployeeId)
    : queryKeys.employee.all;
  console.log("EmployeeList:", EmployeeId, query);

  const defaultKeys = ["EmployeeList"];
  return useApiQuery({
    queryKey: query,
    queryFn: (config) => fetchemployeeList(config, EmployeeId),
    source: "EmployeeList",

    options: {
      staleTime: 0,
      enabled: true,
    },
  });
};

//   import { useQuery } from "@tanstack/react-query";
// import { executeApi } from "../../../core/api/executor";
// import { masterKeys } from "../../../core/master/masterKeys";
// import { fetchMasterData } from "../../../core/master/masterService";

// export const EmployeeList = () => {
//   const defaultKeys = ["EmployeeList"];
//     return useQuery({
//       queryKey:  masterKeys.employee(),
//       queryFn: () => fetchMasterData(defaultKeys),
//     staleTime: Infinity,
//     gcTime: Infinity,
//     });
//   };0

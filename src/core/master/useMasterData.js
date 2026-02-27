// core/master/useMasterData.js

import { useQuery } from "@tanstack/react-query";
import { fetchMasterData } from "./masterService";
import { masterKeys } from "./masterKeys";

export const useMasterData = (configKeys) => {
  const defaultKeys = ["RepoList", "ProjectList", "EmployeeList", "LabelMaster"];
  const keys = Array.isArray(configKeys) && configKeys.length > 0
    ? configKeys
    : defaultKeys;
 
  return useQuery({
    queryKey: masterKeys.multi(keys),
    queryFn: () => fetchMasterData(keys),
    staleTime: Infinity,
    gcTime: Infinity,
  });
};

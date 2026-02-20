// core/master/useMasterData.js

import { useQuery } from "@tanstack/react-query";
import { fetchMasterData } from "./masterService";
import { masterKeys } from "./masterKeys";

export const useMasterData = (configKeys) => {
  const keys = ["RepoList", "ProjectList", "EmployeeList", "LabelMaster"];
 
  return useQuery({
    queryKey: masterKeys.multi(keys),
    queryFn: () => fetchMasterData(keys),
    staleTime: Infinity,
    gcTime: Infinity,
  });
};

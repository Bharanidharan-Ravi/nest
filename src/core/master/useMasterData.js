// core/master/useMasterData.js

import { useQuery } from "@tanstack/react-query";
import { fetchMasterData } from "./masterService";
import { masterKeys } from "./masterKeys";

export const useMasterData = (configKeys) => {
  const keys = ["RepoList", "ProjectList", "EmployeeList", "LabelList"];
 
  return useQuery({
    queryKey: masterKeys.multi(keys),
    queryFn: () => fetchMasterData(keys),
    staleTime: 0,
    gcTime: 0,
  });
};

// // core/master/useMasterData.js

// import { useQuery } from "@tanstack/react-query";
// import { fetchMasterData } from "./masterService";
// import { masterKeys } from "./masterKeys";

// export const useMasterData = (configKeys) => {
//   console.log("configKeys :", configKeys);
  
//   const defaultKeys = ["RepoList", "ProjectList", "EmployeeList", "LabelMaster","StatusMaster"];
//   const keys = Array.isArray(configKeys) && configKeys.length > 0
//     ? configKeys
//     : defaultKeys;
//  console.log("keys :", keys);
 
//   return useQuery({
//     queryKey: masterKeys.multi(keys),
//     queryFn: () => fetchMasterData(keys),
//     staleTime: Infinity,
//     gcTime: Infinity,
//   });
// };


// //anbu


// core/master/useMasterData.js

import { useQuery } from "@tanstack/react-query";
import { fetchMasterData } from "./masterService";
import { masterKeys } from "./masterKeys";

export const useMasterData = (configKeys) => {
  const defaultKeys = ["RepoList", "ProjectList", "EmployeeList", "LabelMaster","StatusMaster","TeamMaster"];
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

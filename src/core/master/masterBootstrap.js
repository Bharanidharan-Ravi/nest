// // core/master/masterBootstrap.js

// import { queryClient } from "../api/queryClient";
// import { masterKeys } from "./masterKeys";
// import { fetchMasterData } from "./masterService";

// export const preloadMasterData = async () => {
//   const keys = ["RepoList", "ProjectList", "EmployeeList", "LabelMaster","StatusMaster"];

//   await queryClient.ensureQueryData({
//     queryKey: masterKeys.multi(keys),
//     queryFn: () => fetchMasterData(keys),
//   });
// };


// core/master/masterBootstrap.js
//anbu

import { queryClient } from "../api/queryClient";
import { masterKeys } from "./masterKeys";
import { fetchMasterData } from "./masterService";

export const preloadMasterData = async () => {
  const keys = ["RepoList", "ProjectList", "EmployeeList", "LabelMaster","StatusMaster","TeamMaster"];

  await queryClient.ensureQueryData({
    queryKey: masterKeys.multi(keys),
    queryFn: () => fetchMasterData(keys),
  });
};

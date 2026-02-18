// core/master/masterBootstrap.js

import { queryClient } from "../api/queryClient";
import { masterKeys } from "./masterKeys";
import { fetchMasterData } from "./masterService";

export const preloadMasterData = async () => {
  const keys = ["RepoList", "ProjectList", "EmployeeList", "LabelList"];

  await queryClient.ensureQueryData({
    queryKey: masterKeys.multi(keys),
    queryFn: () => fetchMasterData(keys),
  });
};

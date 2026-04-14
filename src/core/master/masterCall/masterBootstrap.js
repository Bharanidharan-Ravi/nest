// src/core/master/masterCall/masterBootstrap.js

import { queryClient }     from "../../api/queryClient";
import { masterKeys }      from "./masterKeys";
import { fetchMasterData } from "./masterService";

const PRELOAD_KEYS = [
  "RepoList",
  "ProjectList",
  "EmployeeList",
  "LabelMaster",
  "StatusMaster",
  "TeamMaster",
];

/**
 * Called once on app boot (inside AppBootstrap.jsx).
 * Uses ensureQueryData → no duplicate fetch if cache already warm.
 */
export const preloadMasterData = async () => {
  await queryClient.ensureQueryData({
    queryKey: masterKeys.multi(PRELOAD_KEYS),
    queryFn:  () => fetchMasterData(PRELOAD_KEYS),
  });
};
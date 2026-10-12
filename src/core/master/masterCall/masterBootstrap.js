// src/core/master/masterCall/masterBootstrap.js

import { queryClient }     from "../../api/queryClient";
import { MASTER_DATA_KEYS, masterKeys } from "./masterKeys";
import { fetchMasterData } from "./masterService";

/**
 * Called once on app boot (inside AppBootstrap.jsx).
 * Uses ensureQueryData → no duplicate fetch if cache already warm.
 */
export const preloadMasterData = async () => {
  await queryClient.ensureQueryData({
    queryKey: masterKeys.multi(MASTER_DATA_KEYS),
    queryFn:  () => fetchMasterData(MASTER_DATA_KEYS),
  });
};
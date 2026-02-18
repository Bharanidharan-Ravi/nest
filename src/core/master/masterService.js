// core/master/masterService.js

import { executeApi } from "../api/executor";

export const fetchMasterData = async (configKeys) => {
  return executeApi({
    url: "/sync/v2",
    method: "POST",
    payload: {
      ConfigKeys: configKeys,
    },
  });
};

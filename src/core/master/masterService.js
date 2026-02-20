// core/master/masterService.js

import { executeApi } from "../api/executor";

export const fetchMasterData = async (configKeys) => {
  const response = await executeApi({
    url: "/sync/v2",
    method: "POST",
    payload: {
      ConfigKeys: configKeys,
    },
  });

  // response already comes from interceptor → response.data.Res
  const raw = response || {};

  const normalized = {};

  configKeys.forEach((key) => {
    const section = raw?.[key];

    if (section?.Ok && Array.isArray(section?.Data)) {
      normalized[key] = section.Data;
    } else {
      normalized[key] = [];
    }
  });

  return normalized;
};
// src/core/master/mutation/executeDashboardMutation.js
//
// Plain async function for fire-and-forget mutations (outside React components).
// For component use (with isPending / onSuccess / onError), use useRegistryMutation instead.

import { executeApi }        from "../../api/executor";
import { DASHBOARD_MUTATIONS } from "../registry/Dashboardregistry";

/**
 * @param {string} key        - entry key in DASHBOARD_MUTATIONS
 * @param {object} urlParams  - values for dynamic URL segments  e.g. { planId }
 * @param {any}    body       - request payload
 *
 * Example (event handler that doesn't need isPending):
 *   await executeDashboardMutation("commitCheckedTicket", {}, tickets);
 */
export const executeDashboardMutation = (key, urlParams = {}, body) => {
  const config = DASHBOARD_MUTATIONS[key];

  if (!config) {
    throw new Error(`[executeDashboardMutation] Unknown mutation key: "${key}"`);
  }

  const url =
    typeof config.url === "function" ? config.url(urlParams) : config.url;

  return executeApi({
    url,
    method:  config.method,
    payload: body,
  });
};
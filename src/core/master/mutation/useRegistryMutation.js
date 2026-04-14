// src/core/master/mutation/useRegistryMutation.js

import { useMutation } from "@tanstack/react-query";
import { executeApi }  from "../../api/executor";

/**
 * Generic useMutation wrapper driven by any mutations registry.
 *
 * ── Static URL  (e.g. commitCheckedTicket → "/dailyplan")
 *    mutate(payload)
 *    → payload is sent as request body directly
 *
 * ── Dynamic URL (e.g. uncheckCheckedTicket → "/dailyplan/:planId/uncheck")
 *    mutate({ urlParams: { planId: 251 }, body: { UncheckComment: "Comment" } })
 *    → urlParams builds the URL, body is sent as request body
 *
 * This distinction is automatic — driven by whether config.url is a function.
 */
export const useRegistryMutation = (registry, key, options = {}) => {
  const config = registry[key];

  if (!config) {
    throw new Error(`[useRegistryMutation] Unknown mutation key: "${key}"`);
  }

  const isDynamicUrl = typeof config.url === "function";

  const { onSuccess, onError, onSettled, ...restOptions } = options;

  return useMutation({
    mutationFn: (arg) => {
      // ── Dynamic URL: arg must be { urlParams, body }
      // ── Static URL:  arg is the payload directly
      const urlParams = isDynamicUrl ? (arg?.urlParams ?? {}) : {};
      const payload   = isDynamicUrl ? (arg?.body ?? {})      : arg;
      const url       = isDynamicUrl ? config.url(urlParams)  : config.url;

      return executeApi({ url, method: config.method, payload });
    },
    onSuccess,
    onError,
    onSettled,
    ...restOptions,
  });
};
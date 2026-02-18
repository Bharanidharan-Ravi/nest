// core/api/useApiMutation.js

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { executeApi } from "../api/executor";

export const useApiMutation = ({
  url,
  method = "POST",
  invalidateKeys = [],
  options = {},
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) =>
      executeApi({
        url,
        method,
        payload,
      }),

    onSuccess: (data, variables, context) => {
      invalidateKeys.forEach((key) =>
        queryClient.invalidateQueries({ queryKey: key })
      );

      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },

    ...options,
  });
};

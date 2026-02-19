import { useMutation, useQueryClient } from "@tanstack/react-query";
import { executeApi } from "../api/executor";

export const useApiMutation = ({
  url,
  method = "POST",
  invalidateKeys = [],
  onSuccess,
  onError,
  ...rest
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const result = await executeApi({
        url,
        method,
        payload,
      });

      // Optional business validation
      if (result?.Ok === false) {
        throw new Error(result?.Err?.M || "Operation failed");
      }

      return result;
    },

    onSuccess: (data, variables, context) => {
      invalidateKeys.forEach((key) =>
        queryClient.invalidateQueries({ queryKey: key })
      );

      if (onSuccess) {
        onSuccess(data, variables, context);
      }
    },

    onError: (error) => {
      console.log("Mutation failed:", error);
      if (onError) onError(error);
    },

    ...rest
  });
};

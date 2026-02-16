import { useQuery } from "@tanstack/react-query";
import { executeApi } from "../api/executor";

export const useApiQuery = ({
  queryKey,
  url,
  method = "GET",
  payload,
  params,
  source,
  options = {},
}) => {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const res = await executeApi({
        url,
        method,
        payload,
        params,
      });
      if (source && res && typeof res === "object") {
        return res[source];
      }

      return res;
    },
    ...options,
  });
};

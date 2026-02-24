import { useQuery } from "@tanstack/react-query";
import { executeApi } from "../api/executor";

export const useApiQuery = ({
  queryKey,
  url,
  method = "GET",
  payload,
  params,
  source,
  queryFn,
  options = {},
}) => {
  console.log("queryFn :", queryFn);
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      const res = queryFn 
        ? await queryFn() 
        : await executeApi({ url, method, payload, params });

      if (source && res?.Res?.[source]) {
        return res.Res[source].Data; // 👈 Standardize extraction for your .NET JSON
      }
      return res;
    },
    ...options,
  });
};

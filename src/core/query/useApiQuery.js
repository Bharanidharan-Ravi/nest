import { useQuery } from "@tanstack/react-query";
import { executeApi } from "../api/executor";
import { queryClient } from "../api/queryClient";

// const extractSourceData = (res, source) => {
//   const section = res?.Res?.[source] ?? res?.[source];

//   if (section === undefined) {
//     return undefined;
//   }

//   if (section && typeof section === "object" && "Data" in section) {
//     return section.Data;
//   }

//   return section;
// };

const extractSourceData = (res, source) => {
  // MULTIPLE SOURCES SUPPORT
  if (Array.isArray(source)) {
    const result = {};

    source.forEach((key) => {
      const section = res?.Res?.[key] ?? res?.[key];

      if (section !== undefined) {
        if (section && typeof section === "object" && "Data" in section) {
          result[key] = section.Data;
        } else {
          result[key] = section;
        }
      }
    });

    return result;
  }

  // SINGLE SOURCE (existing behavior)
  const section = res?.Res?.[source] ?? res?.[source];

  if (section === undefined) return undefined;

  if (section && typeof section === "object" && "Data" in section) {
    return section.Data;
  }

  return section;
};
export const useApiQuery = ({
  queryKey,
  url,
  method = "GET",
  payload,
  params,
  source,
  queryFn,
  silent = false,
  options = {},
}) => {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const cachedData = queryClient.getQueryData(queryKey);

      // If we have cached data, this is a background refetch -> make it silent!
      // (Unless the developer explicitly passed silent: false to force a loader)
      const isSilent = silent !== undefined ? silent : !!cachedData;

      const res = queryFn
        ? await queryFn({ _silent: isSilent })
        : await executeApi({
            url,
            method,
            payload,
            params,
            config: { _silent: isSilent }, // Pass down to Axios interceptor
          });
      if (source) {
        const extracted = extractSourceData(res, source);
        if (extracted !== undefined) {
          return extracted;
        }
      }

      return res;
    },
    ...options,
  });
};

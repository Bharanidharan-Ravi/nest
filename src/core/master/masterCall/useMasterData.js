import { useQuery } from "@tanstack/react-query";
import { fetchMasterData } from "./masterService";
import { MASTER_DATA_KEYS, masterKeys } from "./masterKeys";

export const useMasterData = (configKeys) => {
  const keys = Array.isArray(configKeys) && configKeys.length > 0
    ? configKeys
    : MASTER_DATA_KEYS;

  return useQuery({
    queryKey: masterKeys.multi(keys),
    queryFn: () => fetchMasterData(keys),
    staleTime: Infinity,
    gcTime: Infinity,
  });
};

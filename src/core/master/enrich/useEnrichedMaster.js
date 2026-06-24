import { useMemo } from "react";
import { enrichData } from "./enrichData";
import { useEnrichmentSources } from "./useEnrichmentSources";

export const useEnrichedMaster = (
  data,
  enrichConfig
) => {
  const sources = useEnrichmentSources();

  return useMemo(() => {
    if (!enrichConfig) return data;

    return enrichData(
      data,
      enrichConfig,
      sources
    );
  }, [data, enrichConfig, sources]);
};
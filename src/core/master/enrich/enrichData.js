export const enrichData = (
  data,
  enrichConfig = {},
  masterDataMap = {}
) => {
  if (!data) return data;

  const enrichItem = (item) => {
    let enriched = { ...item };

    Object.values(enrichConfig).forEach((config) => {
      const {
        master,
        localKey,
        matchKey = "id",
        fields = {},
      } = config;

      const sourceList = masterDataMap[master] || [];

      const match = sourceList.find(
        (x) => x?.[matchKey] === item?.[localKey]
      );

      if (!match) return;

      Object.entries(fields).forEach(([targetField, sourceField]) => {
        enriched[targetField] = match[sourceField];
      });
    });

    return enriched;
  };

  return Array.isArray(data)
    ? data.map(enrichItem)
    : enrichItem(data);
};
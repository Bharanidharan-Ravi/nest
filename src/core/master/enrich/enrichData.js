export const enrichData = (
  data,
  enrichConfig = {},
  sources = {}
) => {
  if (!data) return data;

  const enrichItem = (item) => {
    let enriched = { ...item };

    Object.values(enrichConfig).forEach((config) => {
      const {
        source,
        localKey,
        matchKey = "id",
        fields = {},
      } = config;

      const sourceList = sources[source] || [];

      const match = sourceList.find(
        (row) =>
          row?.[matchKey] === item?.[localKey]
      );

      if (!match) return;

      Object.entries(fields).forEach(
        ([targetField, sourceField]) => {
          enriched[targetField] =
            match[sourceField];
        }
      );
    });

    return enriched;
  };

  return Array.isArray(data)
    ? data.map(enrichItem)
    : enrichItem(data);
};
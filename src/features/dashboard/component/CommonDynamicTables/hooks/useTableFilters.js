import { useState, useMemo, useEffect } from "react";

const useTableFilters = (data = [], columns = []) => {

  const buildInitialFilters = () =>
    columns.reduce((acc, col) => {
      if (col.searchable) acc[col.key] = "";
      return acc;
    }, {});

  const [filters, setFilters] = useState(buildInitialFilters);

  // Rebuild filters if columns change
  useEffect(() => {
    setFilters(buildInitialFilters());
  }, [columns]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const filteredData = useMemo(() => {
    return data.filter((row) =>
      Object.keys(filters).every((key) => {
        const filterValue = filters[key]?.toLowerCase();
        const cellValue = String(row[key] ?? "").toLowerCase();
        return cellValue.includes(filterValue);
      })
    );
  }, [data, filters]);

  return {
    filters,
    handleFilterChange,
    filteredData,
  };
};

export default useTableFilters;
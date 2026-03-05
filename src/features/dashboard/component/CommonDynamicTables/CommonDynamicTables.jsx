

import React, { useState, useMemo } from "react";
import { Tooltip } from "@mui/material";
import useTableFilters from "./hooks/useTableFilters";
import useTablePagination from "./hooks/useTablePagination";
import DateRangePickerComponent from "../DatePicker/DatePicker"; 
import "./CommonDynamicTables.css";

const CommonDynamicTables = ({
  data = [],
  config = {},
  fromDate,
  toDate,
}) => {
  const {
    excludeColumns = [],
    pagination = true,
    headerSearch = false,
    showDateRangePicker = true,
  } = config;

  const [searchingColumns, setSearchingColumns] = useState([]);

  /* -------------------- Columns -------------------- */
  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0])
      .filter((key) => !excludeColumns.includes(key))
      .map((key) => ({
        key,
        label: key.replace(/_/g, " ").toUpperCase(),
      }));
  }, [data, excludeColumns]);

  /* -------------------- Filters -------------------- */
  const { filters, handleFilterChange, filteredData } =
    useTableFilters(data, columns);

  /* -------------------- Pagination -------------------- */
  const {
    page,
    rowsPerPage,
    paginatedData,
    handleChangePage,
    handleChangeRowsPerPage,
  } = useTablePagination(filteredData);

  /* -------------------- Date Filtering -------------------- */
  const handleDateRangeChange = () => {
    if (fromDate && toDate) {
      const filteredByDate = data.filter((row) => {
        const rowDate = new Date(row.date);  // Assuming each row has a `date` property
        return rowDate >= fromDate && rowDate <= toDate;
      });
      return filteredByDate;
    }
    return data;  // If no date range, return all data
  };

  const filteredDataWithDate = handleDateRangeChange();


  // const handleDateRangeChange = () => {
  //   if (fromDate && toDate) {
  //     const filteredByDate = data.filter((row) => {
  //       const rowDate = new Date(row.date);  // Assuming each row has a `date` property
  //       return rowDate >= fromDate && rowDate <= toDate;
  //     });
  //     return filteredByDate;
  //   }
  //   return data;  // If no date range, return all data
  // };

  // const filteredDataWithDate = handleDateRangeChange();

  
  return (
    <div>
      {/* -------------------- Date Range Picker -------------------- */}
    

      {/* -------------------- Search Inputs -------------------- */}
      {headerSearch && searchingColumns.length > 0 && (
        <div className="filters-container">
          {searchingColumns.map((colKey) => {
            const col = columns.find((c) => c.key === colKey);
            return (
              <div key={colKey} className="filter-input-wrapper">
                <input
                  type="text"
                  placeholder={`Search ${col.label}`}
                  value={filters[colKey] || ""}
                  onChange={(e) =>
                    handleFilterChange(colKey, e.target.value)
                  }
                />
                <span
                  className="filter-close"
                  onClick={() => handleCloseSearch(colKey)}
                >
                  ×
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* -------------------- Scrollable Table -------------------- */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th style={{ width: "60px" }}>S.NO</th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    width: "160px",
                    cursor: headerSearch ? "pointer" : "default",
                  }}
                  onClick={headerSearch ? () => handleHeaderClick(col.key) : undefined}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} style={{ textAlign: "center" }}>
                  No Data Found
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr key={row.id || row._id || rowIndex}>
                  <td>{page * rowsPerPage + rowIndex + 1}</td>
                  {columns.map((col) => {
                    const value = row[col.key];
                    const displayValue =
                      typeof value === "object" ? value?.name ?? "-" : value ?? "-";

                    return (
                      <td key={col.key} style={{ width: "160px" }}>
                        <Tooltip title={String(displayValue)}>
                          <span className="cell-content">
                            {displayValue}
                          </span>
                        </Tooltip>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* -------------------- Pagination -------------------- */}
      {pagination && (
        <div className="pagination-container">
          <button
            disabled={page === 0}
            onClick={() => handleChangePage(null, page - 1)}
          >
            Prev
          </button>

          <span>Page {page + 1}</span>

          <button
            disabled={(page + 1) * rowsPerPage >= filteredDataWithDate.length}
            onClick={() => handleChangePage(null, page + 1)}
          >
            Next
          </button>

          <select value={rowsPerPage} onChange={handleChangeRowsPerPage}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      )}
    </div>
  );
};

export default CommonDynamicTables;

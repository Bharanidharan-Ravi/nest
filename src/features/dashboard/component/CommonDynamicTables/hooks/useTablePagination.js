// import { useState, useMemo } from "react";

// const useTablePagination = (data = [], initialRows = 20) => {
//   const [page, setPage] = useState(0);
//   const [rowsPerPage, setRowsPerPage] = useState(initialRows);

//   const paginatedData = useMemo(() => {
//     return data.slice(
//       page * rowsPerPage,
//       page * rowsPerPage + rowsPerPage
//     );
//   }, [data, page, rowsPerPage]);

//   const handleChangePage = (_, newPage) => setPage(newPage);

//   const handleChangeRowsPerPage = (event) => {
//     const newRows = parseInt(event.target.value, 10);
//     setRowsPerPage(newRows);
//     setPage(0);
//   };

//   return {
//     page,
//     rowsPerPage,
//     paginatedData,
//     handleChangePage,
//     handleChangeRowsPerPage,
//   };
// };

// export default useTablePagination;



import { useState, useMemo, useEffect } from "react";

const useTablePagination = (data = [], initialRows = 20) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialRows);

  const paginatedData = useMemo(() => {
    return data.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [data, page, rowsPerPage]);

  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    const newRows = parseInt(event.target.value, 10);
    setRowsPerPage(newRows);
    setPage(0);
  };

  // Prevent empty page after filtering
  useEffect(() => {
    const maxPage = Math.max(Math.ceil(data.length / rowsPerPage) - 1, 0);
    if (page > maxPage) {
      setPage(0);
    }
  }, [data, rowsPerPage, page]);

  return {
    page,
    rowsPerPage,
    paginatedData,
    handleChangePage,
    handleChangeRowsPerPage,
  };
};

export default useTablePagination;

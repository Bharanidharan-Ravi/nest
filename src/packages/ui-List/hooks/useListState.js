import { useMemo, useState } from "react"

export function useListState(config, rawData = []) {
  const [view, setView] = useState("table")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState({})
  const [search, setSearch] = useState("")

  // 🔍 Apply filtering + search
  const filteredData = useMemo(() => {
    let data = [...rawData]

    // Search
    if (search) {
      data = data.filter(item =>
        item.title?.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        data = data.filter(item => item[key] === value)
      }
    })

    return data
  }, [rawData, search, filters])

  // 📄 Pagination
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, page, pageSize])

  return {
    view,
    setView,
    page,
    setPage,
    pageSize,
    setPageSize,
    filters,
    setFilters,
    search,
    setSearch,
    total: filteredData.length,
    data: paginatedData
  }
}
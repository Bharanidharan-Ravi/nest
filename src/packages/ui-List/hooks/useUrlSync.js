import { useEffect } from "react"
import { useSearchParams } from "react-router-dom"

export function useUrlSync(state) {
  const [, setParams] = useSearchParams()

  useEffect(() => {
    const params = {}

    if (state.query) params.q = state.query
    if (state.sortField) params.sort = state.sortField
    if (state.sortOrder) params.order = state.sortOrder
    if (state.statusTab) params.tab = state.statusTab

    Object.entries(state.filters || {}).forEach(
      ([key, value]) => {
        if (value) params[key] = value
      }
    )

    setParams(params)
  }, [
    state.query,
    state.sortField,
    state.sortOrder,
    state.statusTab,
    state.filters
  ])
}
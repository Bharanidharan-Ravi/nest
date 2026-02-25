import { useEffect } from "react"
import { useSearchParams } from "react-router-dom"

export function useUrlSync(state) {
  const [, setParams] = useSearchParams()

  useEffect(() => {
    const params = {}

    if (state.query) params.q = state.query.trim()
    if (state.sortField) params.sort = state.sortField
    if (state.sortOrder) params.order = state.sortOrder
    if (state.statusTab) params.tab = state.statusTab

    Object.entries(state.filters || {}).forEach(
      ([key, value]) => {
        if (value) params[key] = value
      }
    )

    // 🔥 FIX 2: { replace: true } ensures we don't spam the browser's history stack!
    setParams(params, { replace: true })
    
  }, [
    state.query,
    state.sortField,
    state.sortOrder,
    state.statusTab,
    state.filters,
    setParams
  ])
}




// import { useEffect } from "react"
// import { useSearchParams } from "react-router-dom"

// export function useUrlSync(state) {
//   const [, setParams] = useSearchParams()

//   useEffect(() => {
//     const params = {}

//     if (state.query) params.q = state.query
//     if (state.sortField) params.sort = state.sortField
//     if (state.sortOrder) params.order = state.sortOrder
//     if (state.statusTab) params.tab = state.statusTab

//     Object.entries(state.filters || {}).forEach(
//       ([key, value]) => {
//         if (value) params[key] = value
//       }
//     )

//     setParams(params)
//   }, [
//     state.query,
//     state.sortField,
//     state.sortOrder,
//     state.statusTab,
//     state.filters
//   ])
// }
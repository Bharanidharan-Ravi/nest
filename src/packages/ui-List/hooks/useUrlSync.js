import { useEffect } from "react"
import { useSearchParams } from "react-router-dom"

export function useUrlSync(state) {
  const [searchParams, setParams] = useSearchParams();

  useEffect(() => {
    if (state.config.syncUrl === false) return;
    
    // 🔥 Find out what module we are currently on
    const currentModule = searchParams.get("module") || "default";
    
    // We start with existing params so we don't accidentally delete 'module=timesheets'
    const newParams = new URLSearchParams(searchParams);

    // Prefix our parameters with the current module ID
    const prefix = `${currentModule}_`;

    if (state.query) newParams.set(`${prefix}q`, state.query.trim());
    else newParams.delete(`${prefix}q`);

    if (state.sortField) newParams.set(`${prefix}sort`, state.sortField);
    else newParams.delete(`${prefix}sort`);

    if (state.sortOrder) newParams.set(`${prefix}order`, state.sortOrder);
    else newParams.delete(`${prefix}order`);

    if (state.statusTab) newParams.set(`${prefix}tab`, state.statusTab);
    else newParams.delete(`${prefix}tab`);

    // 🔥 FIX: { replace: true } ensures we don't spam the browser's history
    setParams(newParams, { replace: true });
    
  }, [
    state.query,
    state.sortField,
    state.sortOrder,
    state.statusTab,
    state.config.syncUrl,
    searchParams,
    setParams
  ]);
}





// export function useUrlSync(state) {
//   const [searchParams, setParams] = useSearchParams();

//   useEffect(() => {
//     if (state.config.syncUrl === false) return;
    
//     const params = {}

//     if (state.query) params.q = state.query.trim()
//     if (state.sortField) params.sort = state.sortField
//     if (state.sortOrder) params.order = state.sortOrder
//     if (state.statusTab) params.tab = state.statusTab

//     Object.entries(state.filters || {}).forEach(
//       ([key, value]) => {
//         if (value) params[key] = value
//       }
//     )

//     // 🔥 FIX 2: { replace: true } ensures we don't spam the browser's history stack!
//     setParams(params, { replace: true })
    
//   }, [
//     state.query,
//     state.sortField,
//     state.sortOrder,
//     state.statusTab,
//     state.filters,
//     state.config.syncUrl,
//     setParams
//   ])
// }

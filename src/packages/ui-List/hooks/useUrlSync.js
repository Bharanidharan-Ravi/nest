import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export function useUrlSync(state) {
  const [searchParams, setParams] = useSearchParams();

  useEffect(() => {
    // 1. Bail if URL syncing is disabled for this module
    if (state.config.syncUrl === false) return;

    // 2. Identify the prefix (e.g., "timesheets_")
    const currentModule = searchParams.get("module") || "default";
    const prefix = `${currentModule}_`;
    
    // 3. Clone current URL params
    const newParams = new URLSearchParams(searchParams);
    let hasChanges = false;

    // Helper function to safely update or delete params
    const syncParam = (key, stateValue, defaultVal) => {
      const currentUrlVal = newParams.get(key);
      
      // If the state isn't the default, it belongs in the URL
      if (stateValue && stateValue !== defaultVal) {
        if (currentUrlVal !== String(stateValue)) {
          newParams.set(key, String(stateValue));
          hasChanges = true;
        }
      } else {
        // If it is empty or default, it should NOT be in the URL
        if (newParams.has(key)) {
          newParams.delete(key);
          hasChanges = true;
        }
      }
    };

    // 4. Run our checks
    syncParam(`${prefix}q`, state.query, "");
    syncParam(`${prefix}sort`, state.sortField, state.config.defaultSort?.field);
    syncParam(`${prefix}order`, state.sortOrder, state.config.defaultSort?.order);
    syncParam(`${prefix}tab`, state.statusTab, state.config.tabConfig?.[0]?.key);
    
    // 🚀 VIEW SYNC LOGIC
    const defaultView = state.config.defaultView || "table";
    syncParam(`${prefix}view`, state.view, defaultView);

    // 5. Only push to React Router if something actually changed!
    if (hasChanges) {
      setParams(newParams, { replace: true });
    }
    
  }, [
    state.query,
    state.sortField,
    state.sortOrder,
    state.statusTab,
    state.view, // Ensures the effect triggers when you click Graph/Card/Table
    state.config.syncUrl,
    state.config.defaultView,
    searchParams, // Ensures we compare against the freshest URL
    setParams
  ]);
}

// export function useUrlSync(state) {
//   const [searchParams, setParams] = useSearchParams();

//   useEffect(() => {
//     if (state.config.syncUrl === false) return;
    
//     // 🔥 Find out what module we are currently on
//     const currentModule = searchParams.get("module") || "default";
    
//     // We start with existing params so we don't accidentally delete 'module=timesheets'
//     const newParams = new URLSearchParams(searchParams);

//     // Prefix our parameters with the current module ID
//     const prefix = `${currentModule}_`;

//     if (state.query) newParams.set(`${prefix}q`, state.query.trim());
//     else newParams.delete(`${prefix}q`);

//     if (state.sortField) newParams.set(`${prefix}sort`, state.sortField);
//     else newParams.delete(`${prefix}sort`);

//     if (state.sortOrder) newParams.set(`${prefix}order`, state.sortOrder);
//     else newParams.delete(`${prefix}order`);

//     if (state.statusTab) newParams.set(`${prefix}tab`, state.statusTab);
//     else newParams.delete(`${prefix}tab`);

//     // 🔥 FIX: { replace: true } ensures we don't spam the browser's history
//     setParams(newParams, { replace: true });
    
//   }, [
//     state.query,
//     state.sortField,
//     state.sortOrder,
//     state.statusTab,
//     state.config.syncUrl,
//     searchParams,
//     setParams
//   ]);
// }


import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export function useUrlSync(state) {
  const [searchParams, setParams] = useSearchParams();

  useEffect(() => {
    if (state.config.syncUrl === false) return;

    const currentModule = state.config.moduleId || searchParams.get("module") || "default";
    const prefix = `${currentModule}_`;
    
    // 1. Define our Cache Key scoped to the specific module
    const CACHE_KEY = `wgnest_cache_${currentModule}`;
    
    const newParams = new URLSearchParams(searchParams);
    let hasChanges = false;

    // 👇 FIX 1: Add a 'forceKeep' parameter to the helper
    const syncParam = (key, stateValue, defaultVal, forceKeep = false) => {
      const currentUrlVal = newParams.get(key);
      
      // 👇 FIX 2: If forceKeep is true, ignore the defaultVal check and ALWAYS keep it in the URL
      if (stateValue && (forceKeep || stateValue !== defaultVal)) {
        if (currentUrlVal !== String(stateValue)) {
          newParams.set(key, String(stateValue));
          hasChanges = true;
        }
      } else {
        if (newParams.has(key)) {
          newParams.delete(key);
          hasChanges = true;
        }
      }
    };

    syncParam(`${prefix}q`, state.query, "");
    syncParam(`${prefix}sort`, state.sortField, state.config.defaultSort?.field);
    syncParam(`${prefix}order`, state.sortOrder, state.config.defaultSort?.order);
    syncParam(`${prefix}tab`, state.statusTab, state.config.tabConfig?.[0]?.key);
    
    const defaultView = state.config.defaultView || "table";
    
    // 👇 FIX 3: Pass `true` as the 4th argument so the view is NEVER deleted from the URL!
    syncParam(`${prefix}view`, state.view, defaultView, true);

    if (hasChanges) {
      setParams(newParams, { replace: true });
    }
    
    // 2. ALWAYS SAVE TO SESSION STORAGE
    const cacheSnapshot = {
      query: state.query,
      sortField: state.sortField,
      sortOrder: state.sortOrder,
      view: state.view
    };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheSnapshot));
    
  }, [
    state.query,
    state.sortField,
    state.sortOrder,
    state.statusTab,
    state.view, 
    state.config.syncUrl,
    state.config.defaultView,
    searchParams, 
    setParams
  ]);
}



// import { useEffect } from "react";
// import { useSearchParams } from "react-router-dom";

// export function useUrlSync(state) {
//   const [searchParams, setParams] = useSearchParams();

//   useEffect(() => {
//     // 1. Bail if URL syncing is disabled for this module
//     if (state.config.syncUrl === false) return;

//     // 2. Identify the prefix (e.g., "timesheets_")
//     const currentModule = searchParams.get("module") || "default";
//     const prefix = `${currentModule}_`;
    
//     // 3. Clone current URL params
//     const newParams = new URLSearchParams(searchParams);
//     let hasChanges = false;

//     // Helper function to safely update or delete params
//     const syncParam = (key, stateValue, defaultVal) => {
//       const currentUrlVal = newParams.get(key);
      
//       // If the state isn't the default, it belongs in the URL
//       if (stateValue && stateValue !== defaultVal) {
//         if (currentUrlVal !== String(stateValue)) {
//           newParams.set(key, String(stateValue));
//           hasChanges = true;
//         }
//       } else {
//         // If it is empty or default, it should NOT be in the URL
//         if (newParams.has(key)) {
//           newParams.delete(key);
//           hasChanges = true;
//         }
//       }
//     };

//     // 4. Run our checks
//     syncParam(`${prefix}q`, state.query, "");
//     syncParam(`${prefix}sort`, state.sortField, state.config.defaultSort?.field);
//     syncParam(`${prefix}order`, state.sortOrder, state.config.defaultSort?.order);
//     syncParam(`${prefix}tab`, state.statusTab, state.config.tabConfig?.[0]?.key);
    
//     // 🚀 VIEW SYNC LOGIC
//     const defaultView = state.config.defaultView || "table";
//     syncParam(`${prefix}view`, state.view, defaultView);

//     // 5. Only push to React Router if something actually changed!
//     if (hasChanges) {
//       setParams(newParams, { replace: true });
//     }
    
//   }, [
//     state.query,
//     state.sortField,
//     state.sortOrder,
//     state.statusTab,
//     state.view, // Ensures the effect triggers when you click Graph/Card/Table
//     state.config.syncUrl,
//     state.config.defaultView,
//     searchParams, // Ensures we compare against the freshest URL
//     setParams
//   ]);
// }



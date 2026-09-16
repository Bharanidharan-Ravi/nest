// import { useEffect } from "react";
// import { useSearchParams } from "react-router-dom";

// export function useUrlSync(state) {
//   const [searchParams, setParams] = useSearchParams();

//   useEffect(() => {
//     if (state.config.syncUrl === false) return;

//     const currentModule = state.config.moduleId || searchParams.get("module") || "default";
//     const prefix = `${currentModule}_`;
    
//     // 1. Define our Cache Key scoped to the specific module
//     const CACHE_KEY = `wgnest_cache_${currentModule}`;
    
//     const newParams = new URLSearchParams(searchParams);
//     let hasChanges = false;

//     // 👇 FIX 1: Add a 'forceKeep' parameter to the helper
//     const syncParam = (key, stateValue, defaultVal, forceKeep = false) => {
//       const currentUrlVal = newParams.get(key);
      
//       // 👇 FIX 2: If forceKeep is true, ignore the defaultVal check and ALWAYS keep it in the URL
//       if (stateValue && (forceKeep || stateValue !== defaultVal)) {
//         if (currentUrlVal !== String(stateValue)) {
//           newParams.set(key, String(stateValue));
//           hasChanges = true;
//         }
//       } else {
//         if (newParams.has(key)) {
//           newParams.delete(key);
//           hasChanges = true;
//         }
//       }
//     };

//     syncParam(`${prefix}q`, state.query, "");
//     syncParam(`${prefix}sort`, state.sortField, state.config.defaultSort?.field);
//     syncParam(`${prefix}order`, state.sortOrder, state.config.defaultSort?.order);
//     syncParam(`${prefix}tab`, state.statusTab, state.config.tabConfig?.[0]?.key);
    
//     const defaultView = state.config.defaultView || "table";
    
//     // 👇 FIX 3: Pass `true` as the 4th argument so the view is NEVER deleted from the URL!
//     syncParam(`${prefix}view`, state.view, defaultView, true);

//     if (hasChanges) {
//       setParams(newParams, { replace: true });
//     }
    
//     // 2. ALWAYS SAVE TO SESSION STORAGE
//     const cacheSnapshot = {
//       query: state.query,
//       sortField: state.sortField,
//       sortOrder: state.sortOrder,
//       view: state.view
//     };
//     sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheSnapshot));
    
//   }, [
//     state.query,
//     state.sortField,
//     state.sortOrder,
//     state.statusTab,
//     state.view, 
//     state.config.syncUrl,
//     state.config.defaultView,
//     searchParams, 
//     setParams
//   ]);
// }

import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export function useUrlSync(state) {
  const [searchParams, setParams] = useSearchParams();

  useEffect(() => {
    if (state.config.syncUrl === false) return;

    const currentModule =
      state.config.moduleId || searchParams.get("module") || "default";
    const prefix = `${currentModule}_`;

    // 👇 NEW: same guard as useListState — only split cache for real multi-view modules
    const hasMultipleViews =
      Array.isArray(state.config.allowViewSwitch) &&
      state.config.allowViewSwitch.length > 1;

    const VIEW_CACHE_KEY = hasMultipleViews
      ? `wgnest_cache_${currentModule}_${state.view}`
      : `wgnest_cache_${currentModule}`;

    const newParams = new URLSearchParams(searchParams);
    let hasChanges = false;

    const syncParam = (key, stateValue, defaultVal, forceKeep = false) => {
      const currentUrlVal = newParams.get(key);
      if (stateValue && (forceKeep || stateValue !== defaultVal)) {
        if (currentUrlVal !== String(stateValue)) {
          newParams.set(key, String(stateValue));
          hasChanges = true;
        }
      } else if (newParams.has(key)) {
        newParams.delete(key);
        hasChanges = true;
      }
    };

    syncParam(`${prefix}q`, state.query, "");
    syncParam(`${prefix}sort`, state.sortField, state.config.defaultSort?.field);
    syncParam(`${prefix}order`, state.sortOrder, state.config.defaultSort?.order);
    syncParam(`${prefix}tab`, state.statusTab, state.config.tabConfig?.[0]?.key);

    const defaultView = state.config.defaultView || "table";
    syncParam(`${prefix}view`, state.view, defaultView, true);

    if (hasChanges) setParams(newParams, { replace: true });

    // 👇 CHANGED: only write the separate "which view is active" tracker
    //             when the module genuinely has multiple views
    if (hasMultipleViews) {
      sessionStorage.setItem(
        `wgnest_cache_${currentModule}`,
        JSON.stringify({ view: state.view }),
      );
    }

    // 👇 CHANGED: this is the ONLY write for single-view modules (matches original behavior),
    //             and the per-view write for multi-view modules
    sessionStorage.setItem(
      VIEW_CACHE_KEY,
      JSON.stringify({
        query: state.query,
        sortField: state.sortField,
        sortOrder: state.sortOrder,
        ...(hasMultipleViews ? {} : { view: state.view }),
      }),
    );
  }, [
    state.query,
    state.sortField,
    state.sortOrder,
    state.statusTab,
    state.view,
    state.config.syncUrl,
    state.config.defaultView,
    searchParams,
    setParams,
  ]);
}




// import { useEffect } from "react";
// import { useSearchParams } from "react-router-dom";

// export function useUrlSync(state) {
//   const [searchParams, setParams] = useSearchParams();


//   useEffect(() => {
//     if (state.config.syncUrl === false) return;
//     const currentModule = state.config.moduleId || searchParams.get("module") || "default";
//     const prefix = `${currentModule}_`;
//     // 1. Define our Cache Key scoped to the specific module
//     const currentView =state.view || state.config.defaultView || "table";
// console.log("state :", state);

//   // Only separate cache by view when allowViewSwitch has values
//   const hasViewSwitch =
//     Array.isArray(state.config.allowViewSwitch) &&
//     state.config.allowViewSwitch.length > 0;

//   const CACHE_KEY = hasViewSwitch
//     ? `wgnest_cache_${currentModule}_${currentView}`
//     : `wgnest_cache_${currentModule}`;
//     // Full query string
//     const newParams = new URLSearchParams(searchParams);

//     let hasChanges = false;

//     // 👇 FIX 1: Add a 'forceKeep' parameter to the helper
//     const syncParam = (key, stateValue, defaultVal, forceKeep = false) => {
//       const currentUrlVal = newParams.get(key);
      
//       // 👇 FIX 2: If forceKeep is true, ignore the defaultVal check and ALWAYS keep it in the URL
//       if (stateValue && (forceKeep || stateValue !== defaultVal)) {
//         if (currentUrlVal !== String(stateValue)) {
//           newParams.set(key, String(stateValue));
//           hasChanges = true;
//         }
//       } else {
//         if (newParams.has(key)) {
//           newParams.delete(key);
//           hasChanges = true;
//         }
//       }
//     };

//     syncParam(`${prefix}q`, state.query, "");
//     syncParam(`${prefix}sort`, state.sortField, state.config.defaultSort?.field);
//     syncParam(`${prefix}order`, state.sortOrder, state.config.defaultSort?.order);
//     syncParam(`${prefix}tab`, state.statusTab, state.config.tabConfig?.[0]?.key);
    
//     const defaultView = state.config.defaultView || "table";
    
//     // 👇 FIX 3: Pass `true` as the 4th argument so the view is NEVER deleted from the URL!
//     syncParam(`${prefix}view`, state.view, defaultView, true);


//     if (hasChanges) {
//       setParams(newParams, { replace: true });
//     }
    
//     // 2. ALWAYS SAVE TO SESSION STORAGE
//     const cacheSnapshot = {
//       query: state.query,
//       sortField: state.sortField,
//       sortOrder: state.sortOrder,
//       view: currentView
//     };
//     sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheSnapshot));
    
//   }, [
//     state.query,
//     state.sortField,
//     state.sortOrder,
//     state.statusTab,
//     state.view, 
//     state.config.syncUrl,
//     state.config.defaultView,
//     searchParams, 
//     setParams
//   ]);
// }
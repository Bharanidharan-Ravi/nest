import { ListCardView } from "./ListCardView";
import { ListTableView } from "./ListTableView";
import { useList } from "../context/ListContext";
import { ListViewSwitcher } from "./ListViewSwitcher";
import { ListSortDropdown } from "./ListSortDropdown";
import { ListSearchBar } from "./ListSearchBar";
import { ListTabs } from "./ListTabs";
import { ListFilters } from "./ListFilters";
import { ListGraphView } from "./ListGraphView";

export function ListLayout({ className }) {
  const { view, config } = useList();
  const layoutClasses = className || config.theme?.layout || "flex flex-col w-full";

  const renderView = () => {
    if (view === "graph") return <ListGraphView />;
    if (view === "table") return <ListTableView />;
    return <ListCardView />;
  };

  return (
    <div className={`rounded-lg bg-white shadow-sm ${layoutClasses}`}>
      <div className="sticky top-0 z-20 bg-white border border-gray-200 border-b-0 rounded-t-lg">
        {config.enableSearch && <ListSearchBar />}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 border-b border-gray-200 bg-gray-50 gap-4">
          <div className="flex items-center gap-3">
            <div>{config.enableTabs && <ListTabs />}</div>
            <div className="flex items-center">{config.tabsExtra?.()}</div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ListViewSwitcher />
            <ListFilters />
            {/* Hide filters/sort when in graph view — optional */}
           
            {view !== "graph" && <ListSortDropdown />}
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white p-0 relative border border-gray-200 border-t-0 rounded-b-lg">
        {renderView()}
      </div>
    </div>
  );
}



// export function ListLayout({ className }) {
//   const { view, config } = useList();
//   const layoutClasses =
//     className || config.theme?.layout || "flex flex-col w-full";
//   return (
//     // 1. Container fills height (h-full) and manages internal scrolling
//     <div className={`rounded-lg bg-white shadow-sm ${layoutClasses}`}>
//       {/* 2. FIXED TOP SECTION (Search + Toolbar) */}
//       <div className="sticky top-0 z-20 bg-white border border-gray-200 border-b-0 rounded-t-lg">
//         {config.enableSearch && <ListSearchBar />}

//         <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 border-b border-gray-200 bg-gray-50 gap-4">
//           <div className="flex items-center gap-3">
//             <div>{config.enableTabs && <ListTabs />}</div>
//             <div className="flex items-center">
//               {config.tabsExtra?.()}
//             </div>
//           </div>
//           <div className="flex flex-wrap items-center gap-3">
//             <ListViewSwitcher />
//             <ListFilters />
//             <ListSortDropdown />
//           </div>
//         </div>
//       </div>

//       <div className="flex-1 bg-white p-0 relative border border-gray-200 border-t-0 rounded-b-lg">
//         {view === "table" ? <ListTableView /> : <ListCardView />}
//       </div>
//     </div>
//   );
// }

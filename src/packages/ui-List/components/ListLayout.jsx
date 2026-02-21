import { ListCardView } from "./ListCardView";
import { ListTableView } from "./ListTableView";
import { useList } from "../context/ListContext";
import { ListViewSwitcher } from "./ListViewSwitcher";
import { ListSortDropdown } from "./ListSortDropdown";
import { ListSearchBar } from "./ListSearchBar";
import { ListTabs } from "./ListTabs";
import { ListFilters } from "./ListFilters";

export function ListLayout() {
  const { view, config } = useList();

  return (
  // 1. Container fills height (h-full) and manages internal scrolling
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm flex flex-col h-full overflow-hidden">
      {/* 2. FIXED TOP SECTION (Search + Toolbar) */}
      <div className="flex-none z-10 bg-white">
        {config.enableSearch && <ListSearchBar />}

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 border-b border-gray-200 bg-gray-50 gap-4">
          <div>{config.enableTabs && <ListTabs />}</div>

          <div className="flex flex-wrap items-center gap-3">
            <ListViewSwitcher />
            <ListFilters />
            <ListSortDropdown />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white p-0 relative">
        {view === "table" ? <ListTableView /> : <ListCardView />}
      </div>
    </div>
  );
}

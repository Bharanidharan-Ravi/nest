import { Menu, Plus } from "lucide-react";
import { VIEW_MODES } from "../Helpers/common";
import { Button } from "./Common";

export default function SchedulerHeader({
  subtitle,
  viewMode,
  viewModes = VIEW_MODES,
  onViewModeChange,
  onNewMeeting,
  onMenuClick,
}) {

  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-100 bg-white flex-wrap">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="p-1 rounded-md hover:bg-gray-100 transition sm:block"
          aria-label="Toggle sidebar"
        >
          <Menu size={18} className="text-black-900" aria-hidden="true" />
        </button>

        <div>
          <h2 className="text-lg font-bold text-gray-900 leading-tight">
            Meetings
          </h2>
          <p className="text-sm text-gray-500 mt-1" aria-live="polite">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div
          role="tablist"
          aria-label="Scheduler view"
          className="flex rounded-md border border-gray-200 overflow-hidden text-sm"
        >
          {viewModes.map((mode) => (
            <button
              type="button"
              key={mode}
              role="tab"
              aria-selected={viewMode === mode}
              onClick={() => onViewModeChange(mode)}
              className={`px-3 py-1.5 font-medium transition border-r border-gray-200 last:border-r-0
                ${viewMode === mode ? "bg-white text-gray-900" : "bg-gray-50 text-gray-400 hover:text-gray-600"}`}
            >
              {mode}
            </button>
          ))}
        </div>

        <Button icon={Plus} onClick={() => onNewMeeting()}>
          New Meeting
        </Button>
      </div>
    </div>
  );
}
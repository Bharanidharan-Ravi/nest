import React, { useMemo } from "react";
import { format } from "date-fns";
import { readUserFromSession } from "../../../core/auth/useCurrentUser";
import { useEmployeeOptions, useProjectOptions } from "../../../core/master/selectors/selectors";
import { ListLayout } from "../../../packages/ui-List/components/ListLayout";
import { ListProvider } from "../../../packages/ui-List/components/ListProvider";
import MeetingScheduler from "./MeetingScheduler";
import { normalizeMeeting } from "../Helpers/common";
import { DATE_RANGE_KEY } from "../hooks";
import { buildMeetingFilters, MEETING_SEARCH_FIELDS } from "../config/meetingFilters";

// Meetings come from the list's own API call (the Host filter and the dates),
// so the list needs no rows of its own.
const NO_ROWS = [];

const MeetingDashboard = () => {
  const user = readUserFromSession();
  const currentUserId = user?.userId;
  const today = format(new Date(), "yyyy-MM-dd");

  const employeeFilterOptions = useEmployeeOptions(true);
  const projectFilterOptions = useProjectOptions(true);
  const listConfigWithNav = useMemo(
    () => ({
      moduleId: "meeting_scheduler",
      defaultView: "Scheduler",
      allowViewSwitch: false,
      // Fixed-height layout: only the List/Week/Month view area scrolls, not the whole page.
      theme: {
        layout: "flex flex-col w-full h-full min-h-0",
        customModuleClass: "flex-1 min-h-0 flex flex-col",
      },
      enableTabs: false,
      enableSearch: false,
      enablePagination: false,
      hideTopFilter: true,

      // The component itself, not a new arrow each time this config is rebuilt:
      // ListLayout renders <Custommodule />, so a new function would remount the
      // scheduler and lose the open view, popup and dialogs.
      Custommodule: MeetingScheduler,

      normalizer: normalizeMeeting,
      filters: buildMeetingFilters({ employeeFilterOptions, projectFilterOptions, currentUserId }),
      // Used by the search box in the scheduler's filter bar.
      searchFields: MEETING_SEARCH_FIELDS,
      CalenderFilter: [
        {
          type: "CustomCalender",
          key: DATE_RANGE_KEY,
          enableDailyNav: true,
          filterType: "api",
          api: "/sync/v2",
          configKey: "MeetingData",
          source: "MeetingData",
          defaultRange: "today",
          // Start on today, so the first meetings call already has its dates.
          initialValue: `${today}~${today}`,
          apiMode: "split",
          apiStartKey: "FromDate",
          apiEndKey: "ToDate",
          apiDateFormat: "YYYY-MM-DD",
        },
      ]
    }),
    [
      employeeFilterOptions,
      projectFilterOptions,
      currentUserId,
      today,
    ]
  );

  return (
    <div className="h-full flex flex-col">
      <ListProvider config={listConfigWithNav} data={NO_ROWS}>
        <ListLayout />
      </ListProvider>
    </div>
  );
};

export default MeetingDashboard;

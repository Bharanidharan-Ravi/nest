import React, { useState, useMemo } from "react";
import dayjs from "dayjs";
import { readUserFromSession } from "../../../core/auth/useCurrentUser";
import "./Dashboard.css";
import { TicketListConfig } from "../../tickets/config/TicketUI.config";
import ModuleSwitcher from "../component/ModuleSwitcher";
import { ROUTE_KEYS } from "../../../core/routing/paths";
import { useSmartNavigation } from "../../../core/navigation/useSmartNavigation";
import { normalizeTicket } from "../../../app/shared/utils/ticketNormalizer";
import { createTimesheetNormalizer } from "../../../app/shared/utils/timesheetNormalizer";
import { normalizeCheckedTickets } from "../../../app/shared/utils/normalizeCheckedTickets";
import { useQueryClient } from "@tanstack/react-query";
import {
  useEmployeeOptions,
  useLabelOptions,
  useProjectOptions,
  useRepoOptions,
  useTeamOptions,
} from "../../../core/master/selectors/selectors";
import {
  useCheckedTickets,
  useCommitCheckedTicket,
  useUncheckCheckedTicket,
} from "../../../core/master/selectors/dashboardSelectors";
import { useSearchParams } from "react-router-dom";

export default function Dashboard() {
  const user = readUserFromSession();
  const currentUserId = user?.userId;
  const { goTo } = useSmartNavigation();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const timesheetsView = searchParams.get("timesheet_view") || "card";

  const [selectedTickets, setSelectedTickets] = useState([]);
  const [selectedUncheckTickets, setSelectedUncheckTickets] = useState([]);

  const today = dayjs().startOf("day").format("YYYY-MM-DD");

  // ── Query — feeds committedIds only ───────────────────────────────────────
  const { data: checkedTicketsData = [] } = useCheckedTickets({
    employeeId: currentUserId,
    planDate: today,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const { mutateAsync: commitTickets, isPending: isCommitting } =
    useCommitCheckedTicket();

  const { mutateAsync: uncheckTicket } = useUncheckCheckedTicket();

  // ── Derived state ─────────────────────────────────────────────────────────
  const committedIds = checkedTicketsData.map((t) => t?.TicketId);

  const allCheckedIds = useMemo(
    () => [...committedIds, ...selectedTickets.map((t) => t.id || t.issueId)],
    [selectedTickets, committedIds],
  );

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSelectionChange = (item, isChecked) => {
    if (committedIds.includes(item.id || item.issueId)) return;
    setSelectedTickets((prev) =>
      isChecked
        ? prev.some((i) => i.id === item.id)
          ? prev
          : [...prev, item]
        : prev.filter((i) => i.id !== item.id),
    );
  };

  const handleCommitTickets = async () => {
    if (selectedTickets.length === 0) return;

    // 1. Build Payload
    const ticketsPayload = selectedTickets.map((ticket) => ({
      TicketId: ticket.issueId || ticket.id,
      ProjKey: ticket.ProjKey || ticket.project,
    }));

    try {
      // 2. Await the new mutation (replacing commitCheckedTicket)
      await commitTickets(ticketsPayload);

      // 3. Exactly like your old code: Clear selection
      setSelectedTickets([]);

      // 4. Exactly like your old code: Invalidate the cache
      // We invalidate both your old key and the new registry key just to be completely safe
      await queryClient.invalidateQueries({ queryKey: ["CheckedTickets"] });
      await queryClient.invalidateQueries({
        queryKey: ["dashboard", "checkedTickets"],
      });
    } catch (error) {
      console.error("Failed to commit tickets:", error);
    }
  };

  const handleUncheckSelectionChange = (item, isChecked) => {
    setSelectedUncheckTickets((prev) =>
      isChecked
        ? prev.some((i) => i.id === item.id)
          ? prev
          : [...prev, item]
        : prev.filter((i) => i.id !== item.id),
    );
  };

  const handleUncheckTickets = async () => {
    if (selectedUncheckTickets.length === 0) return;

    try {
      // 1. Fire all uncheck mutations in parallel
      await Promise.all(
        selectedUncheckTickets.map((ticket) =>
          uncheckTicket({
            urlParams: { planId: ticket.id },
            body: { UncheckComment: "Comment" },
          }),
        ),
      );

      // 2. Clear the selection exactly like the old code
      setSelectedUncheckTickets([]);

      // 3. Invalidate caches to refresh both your hook and the ModuleSwitcher filters
      await queryClient.invalidateQueries({ queryKey: ["CheckedTickets"] });
      await queryClient.invalidateQueries({
        queryKey: ["dashboard", "checkedTickets"],
      });
    } catch (error) {
      console.error("Failed to uncheck tickets:", error);
    }
  };

  // ── Dropdown options ──────────────────────────────────────────────────────
  const employeeFilterOptions = useEmployeeOptions(true);
  const projectFilterOptions = useProjectOptions(true);
  const LabelFilterOptions = useLabelOptions(true);
  const repoFilterOptions = useRepoOptions(true);
  const teamFilterOptions = useTeamOptions(true);

  // ── Module configs ────────────────────────────────────────────────────────
  const dashboardTickets = {
    ...TicketListConfig,
    defaultView: "card",
    syncUrl: true,
    moduleId: "dash_tickets",
    allowViewSwitch: false,
    enableSelection: true,
    disabledIds: committedIds,
    selectedIds: allCheckedIds,
    onEditClick: (item) => {
      goTo(ROUTE_KEYS.TICKET_DETAIL, { ticketId: item.navId || item.issueId });
    },
    onSelectionChange: (item, isChecked) => {
      if (committedIds.includes(item.id || item.issueId)) return;
      handleSelectionChange(item, isChecked);
    },
    onItemClick: (item) =>
      goTo(ROUTE_KEYS.TICKET_DETAIL, { ticketId: item.issueId || item.id }),
    filters: [
      {
        key: "repoId",
        view: "Repo",
        options: repoFilterOptions,
        showCounts: true,
      },
      {
        key: "assignedTo",
        view: "Assignee",
        options: employeeFilterOptions,
        defaultValue: currentUserId,
        filterType: "api",
        api: "/sync/v2",
        apiKey: "EmployeeId",
        configKey: "TicketsList",
        // showCounts: true,
        normalizer: normalizeTicket,
      },
      {
        key: "project", // 👈 MUST match the 'owner' key in normalizeProj
        view: "Project",
        showCounts: true,
        options: projectFilterOptions,
      },
      {
        key: "label", // 👈 MUST match the 'owner' key in normalizeProj
        view: "Label",
        showCounts: true,
        options: LabelFilterOptions,
        filterType: "array",
        allowMultiple: true,
        filterKey: "LABEL_ID", // Because label is an array of objects, we need to specify which key to filter on
      },
    ],
    tabsExtra: () => (
      <button
        onClick={handleCommitTickets}
        disabled={selectedTickets.length === 0 || isCommitting}
        className={`bg-brand-yellow text-white text-sm px-4 py-1.5 rounded-md font-medium transition-colors flex items-center ${
          selectedTickets.length === 0 || isCommitting
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-yellow-500 shadow-sm"
        }`}
      >
        {isCommitting ? "Saving…" : "Commit"}
      </button>
    ),
  };

  // ✅ Static — no external dependency
const dashboardTimesheetGraph = (filters) => {
    // Determine if we are looking at the whole team
    const isAllEmployees = !filters?.assignedTo || filters?.assignedTo === "";

    return {
      graphType: "stackedBar",
      graphXAxisKey: "updatedAt",
      graphValueKey: "ConsumeTime",
      
      // 1. Dynamic Grouping Keys Passed Down
      graphGroupIdKey: isAllEmployees ? "mployeeName" : "TicketName",
      graphLabelKey: isAllEmployees ? "employeeName" : "TicketName",
      graphColorKey: isAllEmployees ? null : "statusColor",
      
      // 2. Tooltip Customization (Only show employee name if looking at specific tickets)
      tooltipSecondaryLabelKey: isAllEmployees ? null : "employeeName",
      
      // 3. Status IDs Passed Down (No hardcoding in the graph!)
      terminalStatusKey: "StatusId",
      terminalStatusIds: [14, 15, 16, 17],

      isDateAxis: true,
      minYValue: 8,
      yAxisStep: 2,
      valueFormatter: (val) => {
        const h = Math.floor(val);
        const m = Math.round((val % 1) * 60);
        return `${h.toString().padStart(2, "0")} : ${m.toString().padStart(2, "0")}hr`;
      },
    };
  };

  const dashboardTimesheet = {
    ...TicketListConfig,
    syncUrl: true,
    moduleId: "timesheet",
    enableSearch: false,
    enableTabs: false,
    enableSort: false,
    defaultView: "card",
    tabConfig:[],
    enablePagination: timesheetsView !== "graph",
    allowViewSwitch: ["card", "graph"],
    graphConfig: dashboardTimesheetGraph,
    onEditClick: (item) => {
      goTo(ROUTE_KEYS.TICKET_DETAIL, { ticketId: item.navId || item.issueId });
    },
    onItemClick: (item) =>
      goTo(ROUTE_KEYS.TICKET_DETAIL, { ticketId: item.issueId || item.navId }),
    filters: [
      {
        type: "weekRange",
        key: "weekRange", // internal query key

        // ── Navigation ──────────────────────────────
        enableDailyNav: true, // shows −  + buttons
        // enableMonthlyNav: true, // shows «  » buttons

        // ── View restriction ─────────────────────────
        // showOnViews: ["graph"], // only visible in graph view
        filterType: "api",
        api: "/sync/v2",
        configKey: "TimeSheet",
        source: "TimeSheet",
        // ── API output ───────────────────────────────
        // Option A — single range value
        // apiMode: "range",
        // query value used as-is: "2026-04-19~2026-04-25"
        // defaultValue: dayjs().startOf("day").format("MM-DD-YYYY"),
        defaultRange: timesheetsView === "graph" ? "week" : "today",
        normalizer: createTimesheetNormalizer,
        // Option B — two separate named params
        apiMode: "split",
        apiStartKey: "FromDate",
        apiEndKey: "ToDate",
        apiDateFormat: "MM-DD-YYYY", // dayjs format string
      },
      {
        key: "assignedTo",
        apiKey: "EmployeeID",
        view: "Assignee",
        filterType: "api",
        // showCounts: true,
        api: "/sync/v2",
        configKey: "TimeSheet",
        source: "TimeSheet",
        normalizer: createTimesheetNormalizer,
        options: employeeFilterOptions,
        defaultValue: currentUserId,
      },
      {
        key: "project", // 👈 MUST match the 'owner' key in normalizeProj
        view: "Project",
        showCounts: true,
        options: projectFilterOptions,
      },
      {
        key: "label", // 👈 MUST match the 'owner' key in normalizeProj
        view: "Label",
        showCounts: true,
        options: LabelFilterOptions,
        filterType: "array",
        allowMultiple: true,
        filterKey: "LABEL_ID", // Because label is an array of objects, we need to specify which key to filter on
      },
      // {
      //   key: "fromDate",
      //   apiKey: "FromDate",
      //   view: "From Date",
      //   type: "date",
      //   filterType: "api",
      //   api: "/sync/v2",
      //   configKey: "TimeSheet",
      //   source: "TimeSheet",
      //   normalizer: createTimesheetNormalizer,
      //   defaultValue: dayjs().startOf("day").format("MM-DD-YYYY"),
      // },
      // {
      //   key: "toDate",
      //   apiKey: "ToDate",
      //   view: "To Date",
      //   type: "date",
      //   filterType: "api",
      //   api: "/sync/v2",
      //   configKey: "TimeSheet",
      //   source: "TimeSheet",
      //   normalizer: createTimesheetNormalizer,
      //   defaultValue: dayjs().startOf("day").format("MM-DD-YYYY"),
      // },
    ],
  };

  const dashboardPickedList = {
    ...TicketListConfig,
    syncUrl: false,
    moduleId: "picklist",
    enableSearch: false,
    enableTabs: false,
    enableSort: false,
    enableSelection: true,
    onSelectionChange: handleUncheckSelectionChange,
    selectedIds: selectedUncheckTickets.map((t) => t.id),
    onEditClick: (item) => {
      goTo(ROUTE_KEYS.TICKET_DETAIL, { ticketId: item.navId || item.issueId });
    },
    onItemClick: (item) =>
      goTo(ROUTE_KEYS.TICKET_DETAIL, { ticketId: item.issueId || item.navId }),
    tabsExtra: () => (
      <button
        onClick={handleUncheckTickets}
        disabled={selectedUncheckTickets.length === 0}
        className={`bg-brand-yellow text-white text-sm px-4 py-1.5 rounded-md font-medium transition-colors flex items-center ${
          selectedUncheckTickets.length === 0
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-yellow-500 shadow-sm"
        }`}
      >
        Uncheck
      </button>
    ),
    filters: [
      {
        key: "assignedTo",
        apiKey: "userId",
        view: "Assignee",
        // showCounts: true,
        filterType: "api",
        api: "/sync/v2",
        configKey: "CheckedTickets",
        source: "CheckedTickets",
        options: employeeFilterOptions,
        normalizer: normalizeCheckedTickets,
        defaultValue: currentUserId,
      },
      {
        key: "project", // 👈 MUST match the 'owner' key in normalizeProj
        view: "Project",
        showCounts: true,
        options: projectFilterOptions,
      },
      // {
      //   key: "teamId",
      //   view: "Team",
      //   showCounts: true,
      //   options: teamFilterOptions,
      //   filterType: "custom",
      //   customFilter: (item, value) => {
      //     if (!value || value === "") return true;
      //     // Check if ANY assignee on this ticket belongs to the selected team
      //     return item.multiAssignees?.some(
      //       (a) =>
      //         String(a.Assignee_TeamId) === String(value) &&
      //         a.Assignee_Type === "Main Assignee",
      //     );
      //   },
      // },
      {
        key: "label", // 👈 MUST match the 'owner' key in normalizeProj
        view: "Label",
        showCounts: true,
        options: LabelFilterOptions,
        filterType: "array",
        allowMultiple: true,
        filterKey: "LABEL_ID", // Because label is an array of objects, we need to specify which key to filter on
      },
      {
        key: "planDate",
        apiKey: "planDate",
        view: "Plan Date",
        type: "date",
        filterType: "api",
        api: "/sync/v2",
        configKey: "CheckedTickets",
        source: "CheckedTickets",
        normalizer: normalizeCheckedTickets,
        defaultValue: dayjs().startOf("day").format("MM-DD-YYYY"),
      },
    ],
  };

  const dashboardModules = [
    { id: "dash_tickets", label: "My Tickets", config: dashboardTickets },
    { id: "timesheets", label: "Timesheet", config: dashboardTimesheet },
    {
      id: "checkedTickets",
      label: "Checked Tickets",
      config: dashboardPickedList,
    },
  ];

  return (
    <div className="dashview">
      <h2>Dashboard</h2>
      <ModuleSwitcher modules={dashboardModules} />
    </div>
  );
}

import React, { useState, useMemo, useEffect } from "react";
import dayjs from "dayjs";
import { readUserFromSession, useCurrentUser } from "../../../core/auth/useCurrentUser";
import "./Dashboard.css";
import { TicketListConfig } from "../../tickets/config/TicketUI.config";
import ModuleSwitcher from "../component/ModuleSwitcher";
import { ROUTE_KEYS } from "../../../core/routing/paths";
import { useSmartNavigation } from "../../../core/navigation/useSmartNavigation";
import { normalizeTicket } from "../../../app/shared/utils/normalizer";
import { createTimesheetNormalizer } from "../../../app/shared/utils/normalizer";
import { normalizeCheckedTickets } from "../../../app/shared/utils/normalizer";
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
import { FiX } from "react-icons/fi";
import EntityFormPage from "../../../packages/crud/pages/EntityFormPage";
import { ThreadFormConfig } from "../../tickets/config/ThreadForm.config";
import { ThreadFieldConfig } from "../../tickets/config/Thread.config";
import TimesheetTree from "../component/TimesheetTree";
import TicketListCard from "../../tickets/component/TicketListCard";
import { useGetStaleTicketData } from "../../../app/shared/Header/hook/GetStaleTickets.Api";
import { Tooltip } from "@mui/material";
import { TimesheetSummary } from "../component/summery/TreeTableSummary";
import { isAllowedToView } from "../../../app/shared/utils/ticketVisibility";



// dashboard edited
export default function Dashboard() {
  const user = readUserFromSession();
  const currentUserId = user?.userId;
  const { goTo } = useSmartNavigation();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const timesheetsView = searchParams.get("timesheets_view") || "graph";
  const [quickTicketStatus, setQuickTicketStatus] = useState(null);
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [selectedUncheckTickets, setSelectedUncheckTickets] = useState([]);
  const { isViewer } = useCurrentUser();
  const today = dayjs().startOf("day").format("YYYY-MM-DD");
  const [showStaleTicketsModal, setshowStaleTicketsModal] = useState(false)
  const { data: staleTicketsData } = useGetStaleTicketData(currentUserId)
  const staleTickets = staleTicketsData || []
  const staleCount = staleTickets.length
  useEffect(() => {
    if (staleCount === 0) {
      return
    }
    const todayKey = today;
    const lastShownKey = `staleTicketsShown_${currentUserId}`
    const lastShown = localStorage.getItem(lastShownKey)

    if (lastShown === todayKey) {
      return
    }

    setshowStaleTicketsModal(true)
    localStorage.setItem(lastShownKey, todayKey)

  }, [staleCount, currentUserId, today])

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
  console.log("employeeFilterOptions",employeeFilterOptions)
  const projectFilterOptions = useProjectOptions(true);

  const LabelFilterOptions = useLabelOptions(true);
  const repoFilterOptions = useRepoOptions(true);

  const teamFilterOptions = useTeamOptions(true);


  //---------------------------------------------------------------------

  const visibleTicketNormalizer=useMemo(()=>{
  
      return (rawItem)=>normalizeTicket(rawItem)
  
  },[])

  // ── Module configs ────────────────────────────────────────────────────────
  const dashboardTickets = {
    ...TicketListConfig(isViewer),
    itemVisibilityFilter:(item)=>isAllowedToView(item,currentUserId),
    theme: {
      stickyTop: 50,
    },
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
        allowMultiple: true,
      },
      {
        key: "project", // 👈 MUST match the 'owner' key in normalizeProj
        view: "Project",
        showCounts: true,
        allowMultiple: true,
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
      {
        key: "assignedTo",
        view: "owner",
        options: employeeFilterOptions.filter((option) => option.value !== ""),
        defaultValue: currentUserId,
        persistOnClear: true,
        filterType: "api",
        api: "/sync/v2",
        apiKey: "EmployeeId",
        configKey: "TicketsList",
        // showCounts: true,
        normalizer: normalizeTicket,
      },
      {
        key: "multiAssignees",
        view: "Assignee",
        allowedRoles: [1, 2, 3],
        options: isViewer
          ? [
            { label: "All Assignees", value: "" },
            ...repoFilterOptions.filter(
              (item) => item.label !== "All Repositories"
            ),
            {
              label: "WorkGlow Solutions",
              value: "7c4039b9-248c-4d4c-a66b-976554d603b1",
            },
          ]
          : [
            ...employeeFilterOptions,
          ],
        filterType: "custom",
        allowMultiple: true,
        showCounts: true,
        customFilter: (item, selectedValues) => {
          if (!selectedValues || selectedValues.length === 0) return true;
          const values = Array.isArray(selectedValues)
            ? selectedValues.map((v) => String(v).toLowerCase())
            : [String(selectedValues).toLowerCase()];
          // Check multiAssignees
          if (Array.isArray(item.multiAssignees)) {
            const isAssigneeMatch = item.multiAssignees.some((assignee) => {
              if (assignee.Assignee_Type === "Main Assignee") return false;

              const assigneeName = String(
                assignee.Assignee_Name || ""
              ).toLowerCase();

              const assigneeId = String(
                assignee.Assignee_Id || ""
              ).toLowerCase();

              return (
                values.includes(assigneeName) ||
                values.includes(assigneeId)
              );
            });

            if (isAssigneeMatch) return true;
          }
          if (item.move_toJson) {
            try {
              const moveToData = JSON.parse(item.move_toJson);

              const isMoveToMatch = moveToData.some((move) => {
                const moveId = String(
                  move.Move_to || ""
                ).toLowerCase();

                const moveTitle = String(
                  move.Title || ""
                ).toLowerCase();

                return (
                  values.includes(moveId) ||
                  values.includes(moveTitle)
                );
              });

              if (isMoveToMatch) return true;
            } catch (error) {
              console.error("Move_toJson parse error:", error);
            }
          }

          return false;
        },
      },

      {
        key: "customBoolean",
        view: "Special Flags",
        showCounts: true,
        options: [
          { label: "Flags", value: "allFlags" },
          { label: "Close Requested", value: "isCloseRequested" },
          { label: "Priority Request", value: "priorityRequest" },
          { label: "Func Response", value: "funcResponse" },
          { label: "Technical Response", value: "webResponse" },
          { label: "Web Response", value: "technicalResponse" },
          { label: "Admin Response", value: "adminResponse" },
            {label:"Client Tickets",value:"raiseToClient"},
        ],
        filterType: "custom",
        allowMultiple: true,
        customFilter: (item, selectedValues) => {
          const values = Array.isArray(selectedValues)
            ? selectedValues
            : String(selectedValues)
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean);

          const flagFields = ["isCloseRequested", "priorityRequest", "funcResponse", "webResponse", "technicalResponse", "adminResponse","raiseToClient"];

          if (values.includes("allFlags")) {
            return flagFields.some((field) => item[field] === true);
          }

          if (values.length === 0) return true;

          return values.some((field) => item[field] === true);
        },
      },

      {
        key: "teamId",
        view: "Team",
        showCounts: true,
        options: teamFilterOptions,
        filterType: "custom",
        allowMultiple: true,
        customFilter: (item, selectedValues) => {
          if (!selectedValues || selectedValues.length === 0) return true;

          const values = Array.isArray(selectedValues)
            ? selectedValues.map(String)
            : [String(selectedValues)];

          return item.multiAssignees?.some(
            (a) =>
              values.includes(String(a.Assignee_TeamId)) &&
              a.Assignee_Type === "Main Assignee",
          );
        },
      },


      {
        key: "move_toJson",
        view: "Handler",
        options: [
          { label: "Handler", value: "" },
          ...repoFilterOptions.filter(
            (item) => item.label !== "Repositories"),
        ],
        filterType: "custom",
        showCounts: true,
        customFilter: (item, selectedValues) => {
          if (!selectedValues || selectedValues.length === 0) return true;
          const values = Array.isArray(selectedValues)
            ? selectedValues.map((v) => String(v).toLowerCase())
            : [String(selectedValues).toLowerCase()];

          if (item.move_toJson) {
            try {
              const moveToData = JSON.parse(item.move_toJson);
              const isMoveToMatch = moveToData.some((move) => {
                const moveId = String(
                  move.Move_to || "",
                ).toLowerCase();

                const moveTitle = String(
                  move.Title || "",
                ).toLowerCase();

                return (
                  values.includes(moveId) ||
                  values.includes(moveTitle)
                );
              });

              if (isMoveToMatch) return true;

            } catch (error) {
              console.error("Move_toJson parse error:", error);
            }
          }

          return false;
        },
      },
      {
        key: "overallPercentage",
        view: "Battery",
        allowMultiple: true,
        showCounts: true,
        options: [
          { label: "Battery", value: "" },
          { label: "0% - 20%", value: "0-20" },
          { label: "21% - 40%", value: "21-40" },
          { label: "41% - 60%", value: "41-60" },
          { label: "61% - 80%", value: "61-80" },
          { label: "81% - 100%", value: "81-100" },
        ],

        filterType: "custom",

        customFilter: (item, selectedValues) => {
          // No filter / All Battery
          if (
            selectedValues == null ||
            selectedValues === "" ||
            (Array.isArray(selectedValues) && selectedValues.length === 0)
          ) {
            return true;
          }

          const values = Array.isArray(selectedValues)
            ? selectedValues.map((v) => String(v).trim())
            : String(selectedValues)
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean);

          // IMPORTANT: normalized item uses lowercase property
          const percentage = Number(item.overallPercentage);

          // Handle null / undefined / invalid percentage
          if (
            item.overallPercentage == null ||
            Number.isNaN(percentage)
          ) {
            return false;
          }

          return values.some((value) => {
            switch (value) {
              case "0-20":
                return percentage >= 0 && percentage <= 20;

              case "21-40":
                return percentage > 20 && percentage <= 40;

              case "41-60":
                return percentage > 40 && percentage <= 60;

              case "61-80":
                return percentage > 60 && percentage <= 80;

              case "81-100":
                return percentage > 80 && percentage <= 100;

              default:
                return false;
            }
          });
        },
      },
    ],
    tabsExtra: () => (
      <button
        onClick={handleCommitTickets}
        disabled={selectedTickets.length === 0 || isCommitting}
        className={`bg-brand-yellow text-white text-sm px-4 py-1.5 rounded-md font-medium transition-colors flex items-center ${selectedTickets.length === 0 || isCommitting
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-yellow-500 shadow-sm"
          }`}
      >
        {isCommitting ? "Saving…" : "Commit"}
      </button>
    ),
  };



const dashboardTimesheetGraph = (parsedFilters) => {
  const isReport = timesheetsView === "report";

  const isAllEmployees =
    !parsedFilters?.filters?.assignedTo ||
    String(parsedFilters.filters.assignedTo).trim() === "";

  const isAllProjects =
    !parsedFilters?.filters?.project ||
    String(parsedFilters.filters.project).trim() === "";

  return {
    graphType: "stackedBar",
    graphXAxisKey: isReport ? "employeeId" : "updatedAt",
    graphValueKey: "ConsumeTime",
    isDateAxis: !isReport,

    // Tell StackedBarDesign which grouping mode to use
    reportMode: isReport ? "report" : "date",

    graphGroupIdKey: isAllEmployees
      ? (item) =>
          `${item.EmployeeID || item.employeeId || "emp"}_${
            item.EmployeeName || item.employeeName || "Unknown"
          }`
      : (item) =>
          item.Issue_Id ||
          item.issueId ||
          item.TicketId ||
          item.ticketId ||
          item.id,

    graphLabelKey: isReport
      ? (item) =>
          item.EmployeeName ||
          item.employeeName ||
          `Employee ${item.EmployeeID || item.employeeId || ""}`
      : isAllEmployees
        ? "employeeName"
        : (item) => {
            const repo = item.repoName
              ? item.repoName
                  .split(" ")
                  .map((w) => w[0]?.toUpperCase())
                  .join("")
              : "Repo";

            const projName = item.projectName || item.project || "";

            const project =
              projName.split(" ").length > 2
                ? projName.split(" ").slice(0, 2).join(" ") + "..."
                : projName;

            const ticketName = item.TicketName || item.title || "";

            let truncatedTicket = ticketName;
            const words = ticketName.split(" ");

            if (words.length > 4) {
              const halfPoint = Math.ceil(words.length / 2);
              truncatedTicket =
                words.slice(0, halfPoint).join(" ") + "...";
            } else if (ticketName.length > 30) {
              truncatedTicket = ticketName.substring(0, 30) + "...";
            }

            return (
              <div className="flex flex-col leading-tight">
                <span className="text-gray-800">
                  [{repo}] {project}
                </span>

                <span
                  className="text-[11.5px] font-medium text-gray-500 mt-0.5"
                  title={ticketName}
                >
                  {truncatedTicket}
                </span>
              </div>
            );
          },

    graphColorKey: (item) => {
      if (item.isDirectUpdate) return "#94a368";

      if (
        item.threadStatusId === 15 ||
        item.threadStatusId === 16
      ) {
        return "#ef4444";
      }

      return null;
    },

    // Tooltip fields
    tooltipSecondaryLabelKey: isReport
      ? "TicketName"
      : isAllEmployees
        ? null
        : "employeeName",

    tooltipEstimateKey: "estimateHours",

    tooltipEstimateFormatter: (val) => {
      if (!val || val === "00:00") return null;
      return `${val}hr`;
    },

    tooltipTotalKey: "EntireWorkingTime",

    tooltipTotalFormatter: (val) => {
      if (!val || val === "00:00") return null;
      return `${val}hr`;
    },

    tooltipFormatter: (item) => {
      const rawTime =
        !item.ConsumeTime || item.ConsumeTime === 0.1
          ? 0
          : item.ConsumeTime;

      const h = Math.floor(rawTime);
      const m = Math.round((rawTime % 1) * 60);

      return `${h.toString().padStart(2, "0")} : ${m
        .toString()
        .padStart(2, "0")}hr`;
    },

    terminalStatusKey: "threadStatusId",
    terminalStatusIds: [15, 16],

    minYValue: 0,
    yAxisStep: 2,

    valueFormatter: (val) => {
      if (!val || val === 0.1) return "";

      const totalMins = Math.round(val * 60);
      const h = Math.floor(totalMins / 60);
      const m = totalMins % 60;

      return `${h.toString().padStart(2, "0")} : ${m
        .toString()
        .padStart(2, "0")}hr`;
    },
  };
};

  const dashboardTimesheet = {
    ...TicketListConfig(isViewer),

    theme: {
      stickyTop: 50,
    },
    itemVisibilityFilter:(item)=>isAllowedToView(item,currentUserId),
    syncUrl: true,
    moduleId: "timesheets",
    enableSearch: false,
    enableTabs: false,
    enableSort: false,
    defaultView: "graph",
    tabConfig: [],
    enablePagination: !["graph", "report"].includes(timesheetsView),

    allowViewSwitch: ["card", "graph", "report"],

    graphConfig: dashboardTimesheetGraph,

    Custommodule: () => <TimesheetSummary />,

    onEditClick: (item) => {
      goTo(ROUTE_KEYS.TICKET_DETAIL, {
        ticketId: item.navId || item.issueId,
      });
    },

    onItemClick: (item) => {
      if (
        timesheetsView === "graph" ||
        timesheetsView === "report"
      ) {
        setQuickTicketStatus(item);
      } else {
        goTo(ROUTE_KEYS.TICKET_DETAIL, {
          ticketId: item.issueId || item.navId,
        });
      }
    },

    filters:
      timesheetsView == "report"
        ? [
          // Report: ONLY weekRange exists
          {
            type: "weekRange",
            key: "weekRange",

            enableDailyNav: true,

            filterType: "api",
            api: "/sync/v2",
            configKey: "TimeSheet",
            source: "TimeSheet",

            defaultRange: "today",

            normalizer: createTimesheetNormalizer,

            apiMode: "split",
            apiStartKey: "FromDate",
            apiEndKey: "ToDate",
            apiDateFormat: "YYYY-MM-DD",
          },
        ]
        : [
          // Graph / Card
          {
            type: "weekRange",
            key: "weekRange",

            enableDailyNav: true,

            filterType: "api",
            api: "/sync/v2",
            configKey: "TimeSheet",
            source: "TimeSheet",

            defaultRange:"today",

            normalizer: createTimesheetNormalizer,

            apiMode: "split",
            apiStartKey: "FromDate",
            apiEndKey: "ToDate",
            apiDateFormat: "YYYY-MM-DD",
          },

          {
            key: "assignedTo",
            apiKey: "EmployeeID",
            view: "Assignee",

            filterType: "api",
            api: "/sync/v2",
            configKey: "TimeSheet",
            source: "TimeSheet",

            normalizer: createTimesheetNormalizer,

            options: employeeFilterOptions,

            defaultValue: currentUserId
          },

          {
            key: "project",
            view: "Project",
            showCounts: true,
            options: projectFilterOptions,
          },

          {
            key: "repoId",
            view: "Repo",
            options: repoFilterOptions,
            showCounts: true,
          },

          {
            key: "label",
            view: "Label",
            showCounts: true,
            options: LabelFilterOptions,
            filterType: "array",
            allowMultiple: true,
            filterKey: "LABEL_ID",
          },
        ],

  };

  const dashboardPickedList = {
    ...TicketListConfig(isViewer),
    theme: {
      stickyTop: 50,
    },
    itemVisibilityFilter:(item)=>isAllowedToView(item,currentUserId),
    syncUrl: true,
    moduleId: "checkedTickets",
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
    cardRenderer: (item, controls, config) => (
      <div style={{ position: "relative" }}>
        <TicketListCard item={item} controls={controls} config={config} />
        {item.Checked_Person && (
          <div style={{
            position: "absolute",
            bottom: 0,
            right: 300,
            background: "#absolute",
            color: "#92400E",
            fontWeight: 500,
            fontSize: "11px",
            padding: "2px 8px",
            borderRadius: "4px",
            display: "flex",
            zIndex: 10,
            alignItems: "center",
            gap: "4px"
          }}>
            {item.Checked_Person}
          </div>
        )}
      </div>
    ),
    tabsExtra: () => (
      <button
        onClick={handleUncheckTickets}
        disabled={selectedUncheckTickets.length === 0}
        className={`bg-brand-yellow text-white text-sm px-4 py-1.5 rounded-md font-medium transition-colors flex items-center ${selectedUncheckTickets.length === 0
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
      <ModuleSwitcher modules={dashboardModules}  />
      {showStaleTicketsModal && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-[9999] transition-opacity"
            onClick={() => setshowStaleTicketsModal(false)}
          />

          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <div
              className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-gray-100 flex-shrink-0 bg-white z-10">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                      Stale Tickets
                    </h3>
                    <p className="text-base sm:text-lg text-gray-600 truncate">
                      {staleCount} Ticket{staleCount === 1 ? "" : "s"} haven't been updated recently
                    </p>
                  </div>
                  <button
                    onClick={() => setshowStaleTicketsModal(null)}
                    className="closebtn w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-all"
                  >
                    <FiX size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {staleTickets.map((item) => (
                  <div
                    key={item.issueId}
                    className="px-3 py-2.5 border-b hover:bg-gray-50 cursor-pointer transition"
                    onClick={() => {
                      goTo(ROUTE_KEYS.TICKET_DETAIL, { ticketId: item.Issue_Id })
                      setshowStaleTicketsModal(false);
                    }}>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-800">
                        #{item.Issue_Code}
                      </span>
                      <span className="text-sm text-gray-800 truncate">
                        {item.Title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 min-w-0">
                      {/* Repo */}
                      <Tooltip title={item.Repo_Name} arrow>
                        <span className="text-xs font-medium text-gray-700 uppercase">
                          {item?.Repo_Name
                            ?.split(" ")
                            .map((w) => w[0]?.toUpperCase())
                            .join("")}
                        </span>
                      </Tooltip>

                      <span className="text-gray-400">•</span>

                      {/* Project */}
                      <Tooltip title={item.Proj_Name} arrow>
                        <span className="text-xs text-gray-600 truncate max-w-[140px]">
                          {item?.Proj_Name?.split(" ").length > 2
                            ? item.Proj_Name.split(" ").slice(0, 2).join(" ") + "..."
                            : item.Proj_Name}
                        </span>
                      </Tooltip>
                    </div>

                    <div className="text-xs text-gray-400 mt-0.5">
                      {item.DaysSinceLastUpdate} day{item.DaysSinceLastUpdate === 1 ? "" : "s"} ago
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-100 flex-shrink-0">
                <button
                  onClick={() => setshowStaleTicketsModal(false)}
                  className="closebtn w-full py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-sm font-medium">Dismiss</button>
              </div>
            </div>
          </div>
        </>
      )}



      {quickTicketStatus && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-[9999] transition-opacity"
            onClick={() => setQuickTicketStatus(null)}
          />

          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <div
              className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-gray-100 flex-shrink-0 bg-white z-10">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                      Quick Status
                    </h3>
                    <p className="text-base sm:text-lg text-gray-600 truncate">
                      Ticket #{quickTicketStatus?.ticketKey || quickTicketStatus?.id} -{" "}
                      {quickTicketStatus?.title || quickTicketStatus?.TicketName}
                    </p>
                  </div>
                  <button
                    onClick={() => setQuickTicketStatus(null)}
                    className="closebtn w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-all"
                  >
                    <FiX size={18} />
                  </button>
                </div>
              </div>

              {/* Form Engine */}
              <div className="flex-1 overflow-hidden flex flex-col relative bg-white min-h-0">
                <EntityFormPage
                  mode="Create"
                  config={{
                    ...ThreadFormConfig,
                    theme: {
                      ...ThreadFormConfig.theme,
                      formContainer: "flex flex-col h-full min-h-0",
                      footer: "flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50 flex justify-end items-center gap-3",
                    },
                    fields: ThreadFieldConfig(quickTicketStatus?.navId || quickTicketStatus?.issueId || quickTicketStatus?.id)
                      .filter((field) => [
                        "TicketOverallPercentage",
                        "TicketStatusSummary",
                        "TicketProgressHistoryWidget",
                        "issueId",
                      ].includes(field.name))
                      .map((field) => {
                        if (field.name === "TicketProgressHistoryWidget") {
                          return {
                            ...field,
                            options: { ...field.options, isQuickStatusOpen: true },
                          };
                        }
                        return field;
                      }),
                  }}
                  module="Thread"
                  onCancel={() => setQuickTicketStatus(null)}
                  onSuccessCallback={() => {
                    setQuickTicketStatus(null);
                    // Refresh data after submit so the graph updates immediately!
                    queryClient.invalidateQueries({ queryKey: ["TimeSheet"] });
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

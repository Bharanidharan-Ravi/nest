import React, { useState, useEffect, useMemo } from "react";
import dayjs from "dayjs";
import { readUserFromSession } from "../../../core/auth/useCurrentUser";
import {
  useCheckedTicketsData,
  commitCheckedTicket,
  uncheckcheckedtickets,
} from "../hooks/dashboard.api";
import { useMasterData } from "../../../core/master/useMasterData";
import "./Dashboard.css";
import { TicketListConfig } from "../../tickets/config/TicketUI.config";
import ModuleSwitcher from "../component/ModuleSwitcher";
import { ROUTE_KEYS } from "../../../core/routing/paths";
import { useSmartNavigation } from "../../../core/navigation/useSmartNavigation";
import { normalizeTicket } from "../../../app/shared/utils/ticketNormalizer";
import { createTimesheetNormalizer } from "../../../app/shared/utils/timesheetNormalizer";
import { normalizeCheckedTickets } from "../../../app/shared/utils/normalizeCheckedTickets";
import { useQueryClient } from "@tanstack/react-query";

export default function Dashboard() {
  const user = readUserFromSession();
  const currentUserName = user?.userId;
  const { goTo } = useSmartNavigation();
  // State
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [selectedUncheckTickets, setSelectedUncheckTickets] = useState([]);
  const queryClient = useQueryClient();
  // Data Hooks
  const { data: Master } = useMasterData();

  const { data: CheckedTicketsResponse } =
    useCheckedTicketsData(user.userId, dayjs().format("YYYY-MM-DD"));
  console.log("CheckedTicketsResponse :", CheckedTicketsResponse, Master);

  const handleSelectionChange = (item, isChecked) => {
    if (committedIds.includes(item.id || item.issueId)) return;
    setSelectedTickets((prev) => {
      if (isChecked) {
        const exists = prev.some((i) => i.id === item.id);
        if (exists) return prev;
        return [...prev, item];
      }
      return prev.filter((i) => i.id !== item.id);
    });
  };

  const handleCommitTickets = async () => {
    if (selectedTickets.length === 0) return;
    const ticketsPayload = selectedTickets.map((ticket) => ({
      TicketId: ticket.issueId || ticket.id,
      ProjKey: ticket.ProjKey || ticket.project,
    }));
    await commitCheckedTicket(ticketsPayload);
    setSelectedTickets([]);
    await queryClient.invalidateQueries({ queryKey: ["CheckedTickets"] });
  };

  const committedIds = Array.isArray(CheckedTicketsResponse)
    ? CheckedTicketsResponse.map((t) => t?.TicketId)
    : [];
  // const committedIds = [];
  // const viewChecked =
  //   CheckedTicketsResponse?.map(normalizeCheckedTickets) || [];
  const allCheckedIds = useMemo(() => {
    const newIds = selectedTickets.map((t) => t.id || t.issueId);
    return [...committedIds, ...newIds];
  }, [selectedTickets, committedIds]);

  const handleUncheckSelectionChange = (item, isChecked) => {
    setSelectedUncheckTickets((prev) => {
      if (isChecked) {
        const exists = prev.some((i) => i.id === item.id);
        if (exists) return prev;
        return [...prev, item];
      }
      return prev.filter((i) => i.id !== item.id);
    });
  };
  // --- Timesheet Module Logic ---
  // --- Filter Options ---
  const employeeFilterOptions = [
    // { label: "All Employees", value: "" },
    ...(Master?.EmployeeList?.map((user) => ({
      label: user.UserName,
      value: user.UserID,
    })) || []),
  ];
  console.log("committedIds :", committedIds);

  // --- Module Configurations ---
  const dashboardTickets = {
    ...TicketListConfig,
    defaultView: "card",
    syncUrl: true,
    allowViewSwitch: false,
    enableSelection: true,
    disabledIds: committedIds,

    // 🔥 2. Double-check protection in the handler
    onSelectionChange: (item, isChecked) => {
      // If it's already committed, ignore the click completely!
      if (committedIds.includes(item.id || item.issueId)) return;
      handleSelectionChange(item, isChecked);
    },
    selectedIds: allCheckedIds,
    onItemClick: (item) =>
      goTo(ROUTE_KEYS.TICKET_DETAIL, { ticketId: item.issueId || item.id }),
    // defaultFilters: { assignedTo: currentUserName },
    filters: [
      {
        key: "assignedTo",
        view: "Assignee",
        options: employeeFilterOptions,
        defaultValue: currentUserName,
        filterType: "api",
        api: "/sync/v2",
        apiKey: "EmployeeId",
        configKey: "TicketsList",
        normalizer: normalizeTicket,
      },
    ],
    tabsExtra: () => (
      <button
        onClick={handleCommitTickets}
        disabled={selectedTickets.length === 0}
        className={`bg-brand-yellow text-white text-sm px-4 py-1.5 rounded-md font-medium transition-colors flex items-center ${
          selectedTickets.length === 0
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-yellow-500 shadow-sm"
        }`}
      >
        Commit
      </button>
    ),
  };

  const dashboardTimesheet = {
    ...TicketListConfig,
    syncUrl: true,
    enableSearch: false,
    enableTabs: false,
    enableSort: false,
    filters: [
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
        defaultValue: user.userId,
      },
      {
        key: "fromDate",
        apiKey: "FromDate",
        view: "From Date",
        type: "date",
        filterType: "api",
        api: "/sync/v2",
        configKey: "TimeSheet",
        source: "TimeSheet",
        normalizer: createTimesheetNormalizer,
        defaultValue: dayjs().format("MM-DD-YYYY"),
      },
      {
        key: "toDate",
        apiKey: "ToDate",
        view: "To Date",
        type: "date",
        filterType: "api",
        api: "/sync/v2",
        configKey: "TimeSheet",
        source: "TimeSheet",
        normalizer: createTimesheetNormalizer,
        defaultValue: dayjs().format("MM-DD-YYYY"),
      },
    ],
  };

  const dashboardPickedList = {
    ...TicketListConfig,
    // defaultFilters: {
    //   assignedTo: user.userId,
    //   planDate: dayjs().format("MM-DD-YYYY"),
    // },
    syncUrl: false,
    enableSearch: false,
    enableTabs: false,
    enableSort: false,
    enableSelection: true,
    onSelectionChange: handleUncheckSelectionChange,
    selectedIds: selectedUncheckTickets.map((t) => t.id),
    tabsExtra: () => (
      <button
        onClick={async () => {
          await Promise.all(
            selectedUncheckTickets.map((ticket) =>
              uncheckcheckedtickets(ticket.id, { UncheckComment: "Comment" }),
            ),
          );
          setSelectedUncheckTickets([]);
          await queryClient.invalidateQueries({ queryKey: ["CheckedTickets"] });
        }}
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
        filterType: "api",
        api: "/sync/v2",
        configKey: "CheckedTickets",
        source: "CheckedTickets",
        options: employeeFilterOptions,
        normalizer: normalizeCheckedTickets,
        defaultValue: user.userId,
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
        defaultValue: dayjs().format("MM-DD-YYYY"),
      },
    ],
  };

  const dashboardModules = [
    {
      id: "tickets",
      label: "My Tickets",
      config: dashboardTickets,
      data: [],
    },
    {
      id: "timesheets",
      label: "Timesheet",
      config: dashboardTimesheet,
      data: [],
    },
    {
      id: "checkedTickets",
      label: "Checked Tickets",
      config: dashboardPickedList,
      // data: viewChecked,

    },
  ];

  return (
    <div className="dashview">
      <h2>Dashboard</h2>
      <ModuleSwitcher modules={dashboardModules} />
    </div>
  );
}

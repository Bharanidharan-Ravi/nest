import React, { useState, useEffect, useMemo } from "react";
import dayjs from "dayjs";
import { readUserFromSession } from "../../../core/auth/useCurrentUser";
import { 
    useCheckedTicketsData, 
    commitCheckedTicket, 
    useDashboardTimesheetData, 
    uncheckcheckedtickets 
} from "../hooks/dashboard.api";
import { useMasterData } from "../../../core/master/useMasterData";
import "./Dashboard.css";
import { useTicketMaster } from "../../tickets/hooks/useTicketMaster";
import { TicketListConfig } from "../../tickets/config/TicketUI.config";
import ModuleSwitcher from "../component/ModuleSwitcher";
import { ROUTE_KEYS } from "../../../core/routing/paths";
import { useSmartNavigation } from "../../../core/navigation/useSmartNavigation";
import { normalizeTicket } from "../../../app/shared/utils/ticketNormalizer";
import { useQueryClient } from "@tanstack/react-query";
import { createTimesheetNormalizer } from "../../../app/shared/utils/timesheetNormalizer";
import { useSearchParams } from "react-router-dom";

// const normalizeTicket = (ticket) => ({
//     id: ticket.Issue_Id,
//     issueId: ticket.Issue_Id,
//     title: ticket.Title,
//     ticketKey: ticket.Issue_Code,
//     status: ticket.Status,
//     statusId: ticket.StatusId,
//     description: ticket.HtmlDesc || ticket.Description,
//     assignedTo: ticket.Assignee_Name,
//     estimateHours: ticket.hours,
//     updatedBy: ticket.UpdatedBy,
//     repoId: ticket.RepoId,
//     dueDate: ticket.Due_Date,
//     project: ticket.Project_Id,
//     ProjKey: ticket.ProjKey,
//     RepoKey: ticket.RepoKey,
//     priority: ticket.Priority,
//     multiAssignees: ticket.All_Assignees ? JSON.parse(ticket.All_Assignees) : [],
//     label: ticket.Labels_JSON ? JSON.parse(ticket.Labels_JSON) : [],
//     CompletionPct: ticket.CompletionPct,
// });

export default function Dashboard() {
    const user = readUserFromSession();
    const currentUserName = user?.userId;
    const { goTo } = useSmartNavigation();
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    // State
    const [selectedTickets, setSelectedTickets] = useState([]);
    const [selectedUncheckTickets, setSelectedUncheckTickets] = useState([]);
    const [fromDate, setFromDate] = useState(dayjs());
    const [toDate, setToDate] = useState(dayjs());

    const timesheetsQuery = searchParams.get("timesheets_q") || searchParams.get("tickets_q") || "";
    const match = timesheetsQuery.match(/assignedTo:([^\s]+)/);
    const employeeId = match ? match[1].replace(/"/g, "") : null;
console.log("employeeId :", employeeId);

    // Data Hooks
    // const { data: ticketMasterDataRaw } = useTicketMaster({ employeeId: employeeId });
    // const { data: TimeSheet } = useDashboardTimesheetData(user.userId, fromDate, toDate);
    const { data: Master } = useMasterData();
    
    const { 
        data: CheckedTicketsResponse, 
        refetch: refetchCheckedTickets 
    } = useCheckedTicketsData(user.userId, dayjs().format("YYYY-MM-DD"));

    // const ticketMasterData = ticketMasterDataRaw?.data || [];

    // --- Ticket Module Logic ---
    // const TicketList = useMemo(() => (
    //     ticketMasterDataRaw?.map(normalizeTicket) || []
    // ), [ticketMasterDataRaw]);

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
        refetchCheckedTickets();
    };

    // --- Checked Tickets Module Logic ---
    const normalizeCheckedTickets = (item) => {
        // const SameTicket = ticketMasterDataRaw?.find((ticket) => ticket.Issue_Id === item.TicketId);
        return {
            // ...normalizeTicket,
            id: item.id,
            TicketId: item.TicketId,
            ProjKey: item.ProjKey,
            RepoKey: item.RepoKey ?? "-",
            Status: item.Status,
            PlannedDate: dayjs(item.PlannedDate).format("DD-MM-YYYY"),
            UncheckComment: item.UncheckComment ?? "-",
            Title: item.Title,
        };
    };

    const CheckedTicketsData = CheckedTicketsResponse?.CheckedTickets?.Data?.map(normalizeCheckedTickets) || [];
    const committedIds = Array.isArray(CheckedTicketsResponse?.CheckedTickets?.Data) 
        ? CheckedTicketsResponse.CheckedTickets.Data.map((t) => t?.TicketId) 
        : [];

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
    const normalizeTimesheetData = (Timedata) => {
    //    const matchedTicket = ticketMasterDataRaw?.find((ticket) => ticket.Issue_Id === Timedata.Issue_Id);
        return {
            // ...(matchedTicket ? normalizeTicket(matchedTicket) : {}),
            id: Timedata.ThreadId,
            ticketId: Timedata.Issue_Id,
            issueId: Timedata.Issue_Id,
            ticketNo: Timedata.TicketNo,
            TicketName: Timedata.TicketName,
            StartTime: Timedata.StartTime,
            Comment: Timedata.Comment,
            EndTime: Timedata.EndTime,
            ConsumeTime: Timedata.ConsumeTime,
            total: Timedata.total,
        };
    };

    // const TimeSheetData = TimeSheet?.map(normalizeTimesheetData) || [];

    // --- Filter Options ---
    const employeeFilterOptions = [
        // { label: "All Employees", value: "" },
        ...(Master?.EmployeeList?.map((user) => ({
            label: user.UserName,
            value: user.UserID,
        })) || []),
    ];

    const employeeFilterOptionsTs = [
        { label: "All Employees", value: "" },
        ...(Master?.EmployeeList?.map((user) => ({
            label: user.UserName,
            value: user.UserID,
        })) || []),
    ];

    // --- Module Configurations ---
    const listConfigWithNav = {
        ...TicketListConfig,
        defaultView: "card",
        syncUrl: true,
        allowViewSwitch: false,
        enableSelection: true,
        onSelectionChange: handleSelectionChange,
        selectedIds: allCheckedIds,
        onItemClick: (item) => goTo(ROUTE_KEYS.TICKET_DETAIL, { ticketId: item.issueId || item.id }),
        // defaultFilters: { assignedTo: currentUserName },
        filters: [
            {
                key: "assignedTo",
                view: "Assignee",
                options: employeeFilterOptions,
                defaultValue: currentUserName,
                filterType: "api",
                api:"/sync/v2",
                apiKey: "EmployeeId",
                configKey: "TicketsList",
                normalizer: normalizeTicket,
            },
        ],
        tabsExtra: () => (
            <button 
                onClick={handleCommitTickets}
                disabled={selectedTickets.length === 0}
                className={`commit-btn ${selectedTickets.length === 0 ? "commit-btn-disabled" : ""}`}
            >
                Commit
            </button>
        ),
    };    

    const listConfigWithpicked = {
        ...TicketListConfig,
        defaultFilters: {
            assignedTo: user.userId,
            planDate: dayjs().format("MM-DD-YYYY"),
        },
        normalizer: normalizeCheckedTickets,
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
                            uncheckcheckedtickets(ticket.id, { UncheckComment: "Comment" })
                        )
                    );
                    setSelectedUncheckTickets([]);
                    refetchCheckedTickets();
                }}
                disabled={selectedUncheckTickets.length === 0}
                className={`commit-btn ${selectedUncheckTickets.length === 0 ? "commit-btn-disabled" : ""}`}
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
                // defaultValue: user.userId,
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
            }
        ]
    };
    
    // Create the normalizer, empowering it with the cache client
    const timesheetNormalizer = createTimesheetNormalizer(queryClient);

    const listConfigWithNavTimesheet = {
        ...TicketListConfig,
        defaultFilters: {
            assignedTo: user.userId,
            fromDate: dayjs().format("MM-DD-YYYY"),
            toDate: dayjs().format("MM-DD-YYYY"),
        },
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
                normalizer:timesheetNormalizer,
                options: employeeFilterOptionsTs,
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
            }
        ]
    };
// console.log("TicketList :", TicketList, ticketMasterDataRaw);

    const dashboardModules = [
        {
            id: "tickets",
            label: "My Tickets",
            config: listConfigWithNav,
            data: [],
        },
        {
            id: "timesheets",
            label: "Timesheet",
            config: listConfigWithNavTimesheet,
            data: [],
        },
        {
            id: "checkedTickets",
            label: "Checked Tickets",
            config: listConfigWithpicked,
            data: CheckedTicketsData,
        },
    ];

    return (
        <div className="dashview">
            <h2>Dashboard</h2>
            <ModuleSwitcher modules={dashboardModules} />
        </div>
    );
}
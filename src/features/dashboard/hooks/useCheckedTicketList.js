// Checked Tickets tab (ui-List server mode, config.useServerData).
//
// "CheckedTickets" (GetDailyPlan_V2) gives only the daily plan rows for the
// picked user / date. The tickets themselves come from TicketListV2 with the
// "issue" filter, so the cards have the same data, visibility and filters as
// My Tickets, and nothing has to be added to the plan SP when the ticket list
// gets a new column.
// Each row gets planIds (for uncheck) and Checked_Person (who checked it).
// The plan day's threads come from "TimesheetV2" (same entries as the
// Timesheet tab): ConsumeTime (the ticket's full time that day, everyone's
// threads) and the last thread's
// Comment / time / poster.

import { useMemo } from "react";
import dayjs from "dayjs";
import { keepPreviousData } from "@tanstack/react-query";
import { useCheckedTickets } from "../../../core/master/selectors/Dashboardselectors";
import { useMasterLookup } from "../../../core/master/useMasterLookup";
import { useApiQuery } from "../../../core/query/useApiQuery";
import { buildSyncPayload } from "../../../core/sync/buildSyncPayload";
import { formatMinutes } from "../../../app/shared/utils/normalizer";
import { useTicketList } from "../../tickets/hooks/useTicketList";
import { TIMESHEET_KEY, TIMESHEET_QUERY_ROOT } from "./useTimesheetList";

const NO_ROWS = [];
const lower = (id) => String(id ?? "").toLowerCase();

// Timesheet entries → per ticket: total minutes and the latest thread.
// A thread comes once per person (author + co-contributors): count it once.
export const summarizeThreads = (rows) => {
  const byTicket = new Map();
  const seen = new Set();
  rows.forEach((row) => {
    if (!row.ThreadId || seen.has(row.ThreadId)) return; // close / reopen without a thread
    seen.add(row.ThreadId);
    const key = lower(row.Issue_Id);
    const sum = byTicket.get(key) ?? { minutes: 0, last: null };
    sum.minutes += row.Minutes ?? 0;
    if (!sum.last || dayjs(row.EventAt).isAfter(sum.last.EventAt)) sum.last = row;
    byTicket.set(key, sum);
  });
  return byTicket;
};

export function useCheckedTicketList(params, config) {
  const lookup = useMasterLookup();
  const { assignedTo, planDate } = params.filters;
  // "" (All) → every user's plan
  const employeeId = [].concat(assignedTo ?? [])[0] || null;
  const date = planDate || dayjs().format("YYYY-MM-DD");

  // Same cache entry as Dashboard's committedIds query (own user, today), so
  // opening the tab doesn't fetch the plans again. Commit / uncheck / realtime
  // invalidate it. enabled: the registry needs an employee, "All" has none.
  // Another user / date: the previous plans stay on screen and the new ones
  // load silently (no global loader), like the ticket list itself.
  const { data: plans = [], isLoading: plansLoading } = useCheckedTickets(
    { employeeId, planDate: date },
    { enabled: true, silent: true, placeholderData: keepPreviousData },
  );

  const plansByTicket = useMemo(() => {
    const map = new Map();
    plans.forEach((plan) => {
      const key = lower(plan.TicketId);
      map.set(key, [...(map.get(key) ?? []), plan]);
    });
    return map;
  }, [plans]);

  const serverConfig = useMemo(
    () => ({
      ...config,
      serverScope: { ...config.serverScope, f: { issue: [...plansByTicket.keys()] } },
    }),
    [config, plansByTicket],
  );

  const list = useTicketList(params, serverConfig);

  // Every thread of the plan day, by anyone: "Time taken" is the ticket's full
  // time that day, not only the picked user's part. Same cache entry as the
  // Timesheet tab's "All" view.
  const { data: threadRows = NO_ROWS } = useApiQuery({
    queryKey: [...TIMESHEET_QUERY_ROOT, "rows", "all", date, date],
    url: "/sync/v2",
    method: "POST",
    payload: buildSyncPayload({
      configKey: TIMESHEET_KEY,
      customParams: { EmployeeID: null, FromDate: date, ToDate: date },
    }),
    source: TIMESHEET_KEY,
    silent: true,
    options: { staleTime: 0, placeholderData: keepPreviousData },
  });

  const threadsByTicket = useMemo(() => summarizeThreads(threadRows), [threadRows]);

  const data = useMemo(
    () =>
      list.data.map((ticket) => {
        const key = lower(ticket.issueId ?? ticket.id);
        const ticketPlans = plansByTicket.get(key) ?? [];
        const threads = threadsByTicket.get(key);
        return {
          ...ticket,
          planIds: ticketPlans.map((plan) => plan.Id),
          Checked_Person: ticketPlans
            .map((plan) => lookup.get("employee", plan.UserId)?.name ?? plan.Checked_Person)
            .filter(Boolean)
            .join(", "),
          ConsumeTime: threads?.minutes ? formatMinutes(threads.minutes) : null,
          Comment: threads?.last?.Comment ?? null,
          lastThreadAt: threads?.last?.EventAt ?? null,
          lastThreadBy: threads
            ? (lookup.get("employee", threads.last.EmployeeId)?.name ?? null)
            : null,
        };
      }),
    [list.data, plansByTicket, threadsByTicket, lookup],
  );

  return { ...list, data, isLoading: plansLoading || list.isLoading };
}

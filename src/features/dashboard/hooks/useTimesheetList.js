// Timesheet tab (ui-List server mode, config.useServerData).
//
// "TimesheetV2" (GetTimesheet_V2) gives only the timesheet entries for the
// picked employee / days: work and meeting threads, and closes / reopens
// (with the thread that did it, or on their own when done without a thread).
// The tickets themselves come from TicketListV2 with the "issue" filter, like
// Checked Tickets, so title, labels, battery, logged hours and visibility come
// from one place and nothing is added to the timesheet SP when the ticket list
// gets a new column.
//
// Filters read here: weekRange ("from~to") and assignedTo ("" = everyone).
// The others (project, repo, label) filter the merged rows in the browser.

import { useMemo } from "react";
import dayjs from "dayjs";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useApiQuery } from "../../../core/query/useApiQuery";
import { buildSyncPayload } from "../../../core/sync/buildSyncPayload";
import { fetchTicketRows } from "../../../core/sync/ticketListV2";
import { useMasterLookup } from "../../../core/master/useMasterLookup";
import { applyListFilters } from "../../../packages/ui-List/core/filterEngine";
import {
  normalizeTicketListRow,
  normalizeTimesheetRow,
} from "../../../app/shared/utils/normalizer";

export const TIMESHEET_KEY = "TimesheetV2";
// Realtime refreshes ["dashboard", "timesheet", …] when a ticket changes
export const TIMESHEET_QUERY_ROOT = ["dashboard", "timesheet"];
// Sent to the SP, not filtered again in the browser
const SERVER_FILTER_KEYS = ["weekRange", "assignedTo"];

const NO_ROWS = [];
const noop = () => {};
const lower = (id) => String(id ?? "").toLowerCase();

const dayRange = (weekRange) => {
  const today = dayjs().format("YYYY-MM-DD");
  const [start, end] = String(weekRange ?? "").split("~");
  const from = start ? dayjs(start).format("YYYY-MM-DD") : today;
  return [from, end ? dayjs(end).format("YYYY-MM-DD") : from];
};

// Per option: rows passing every other filter and this option
const countOptions = (rows, filters, filter, config) => {
  const others = { ...filters };
  delete others[filter.key];
  const base = applyListFilters(rows, { config, filters: others }).data;
  return Object.fromEntries(
    (filter.options ?? []).map((opt) => [
      opt.value,
      opt.value === ""
        ? base.length
        : applyListFilters(base, { config, filters: { [filter.key]: opt.value } }).data.length,
    ]),
  );
};

export function useTimesheetList(params, config) {
  const lookup = useMasterLookup();
  const { weekRange, assignedTo } = params.filters;
  const [fromDate, toDate] = dayRange(weekRange);
  // "" (All) → every employee
  const employeeId = [].concat(assignedTo ?? [])[0] || null;

  // Another employee / range: the previous entries stay on screen and the new
  // ones load silently, like Checked Tickets.
  const { data: rows = NO_ROWS, isLoading: rowsLoading, dataUpdatedAt } = useApiQuery({
    queryKey: [...TIMESHEET_QUERY_ROOT, "rows", employeeId ?? "all", fromDate, toDate],
    url: "/sync/v2",
    method: "POST",
    payload: buildSyncPayload({
      configKey: TIMESHEET_KEY,
      customParams: { EmployeeID: employeeId, FromDate: fromDate, ToDate: toDate },
    }),
    source: TIMESHEET_KEY,
    silent: true,
    options: { staleTime: 0, placeholderData: keepPreviousData },
  });

  const issueIds = useMemo(
    () => [...new Set(rows.map((row) => lower(row.Issue_Id)))].sort(),
    [rows],
  );

  // Every ticket of the entries in one call (no "size" = all rows)
  const { data: ticketRows = NO_ROWS, isLoading: ticketsLoading } = useQuery({
    queryKey: [...TIMESHEET_QUERY_ROOT, "tickets", issueIds],
    queryFn: () => fetchTicketRows({ f: { issue: issueIds } }, { silent: true }),
    enabled: issueIds.length > 0,
    staleTime: 0,
    placeholderData: keepPreviousData,
  });

  const ticketsById = useMemo(
    () =>
      new Map(ticketRows.map((raw) => [lower(raw.Issue_Id), normalizeTicketListRow(raw, lookup)])),
    [ticketRows, lookup],
  );

  // An entry whose ticket isn't loaded (yet) is left out
  const entries = useMemo(
    () =>
      rows.flatMap((row) => {
        const ticket = ticketsById.get(lower(row.Issue_Id));
        return ticket ? [normalizeTimesheetRow(row, ticket, lookup)] : [];
      }),
    [rows, ticketsById, lookup],
  );

  // params.filters is a new object on every render: key it by content
  const localFiltersKey = JSON.stringify(
    Object.fromEntries(
      Object.entries(params.filters).filter(([key]) => !SERVER_FILTER_KEYS.includes(key)),
    ),
  );
  const localFilters = useMemo(() => JSON.parse(localFiltersKey), [localFiltersKey]);

  const data = useMemo(
    () => applyListFilters(entries, { config, filters: localFilters }).data,
    [entries, config, localFilters],
  );

  const filterCounts = useMemo(() => {
    const counts = {};
    (config.filters ?? []).forEach((filter) => {
      if (!filter.showCounts || SERVER_FILTER_KEYS.includes(filter.key)) return;
      counts[filter.key] = countOptions(entries, localFilters, filter, config);
    });
    return counts;
  }, [entries, localFilters, config]);

  return {
    data,
    total: data.length,
    hasMore: false,
    loadMore: noop,
    tabCounts: {},
    filterCounts,
    isLoading: rowsLoading || (issueIds.length > 0 && ticketsLoading),
    dataUpdatedAt,
  };
}

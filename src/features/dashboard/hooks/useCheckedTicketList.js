// Checked Tickets tab (ui-List server mode, config.useServerData).
//
// "CheckedTickets" (GetDailyPlan_V2) gives only the daily plan rows for the
// picked user / date. The tickets themselves come from TicketListV2 with the
// "issue" filter, so the cards have the same data, visibility and filters as
// My Tickets, and nothing has to be added to the plan SP when the ticket list
// gets a new column.
// Each row gets planIds (for uncheck) and Checked_Person (who checked it).

import { useMemo } from "react";
import dayjs from "dayjs";
import { keepPreviousData } from "@tanstack/react-query";
import { useCheckedTickets } from "../../../core/master/selectors/Dashboardselectors";
import { useMasterLookup } from "../../../core/master/useMasterLookup";
import { useTicketList } from "../../tickets/hooks/useTicketList";

const lower = (id) => String(id ?? "").toLowerCase();

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

  const data = useMemo(
    () =>
      list.data.map((ticket) => {
        const ticketPlans = plansByTicket.get(lower(ticket.issueId ?? ticket.id)) ?? [];
        return {
          ...ticket,
          planIds: ticketPlans.map((plan) => plan.Id),
          Checked_Person: ticketPlans
            .map((plan) => lookup.get("employee", plan.UserId)?.name ?? plan.Checked_Person)
            .filter(Boolean)
            .join(", "),
        };
      }),
    [list.data, plansByTicket, lookup],
  );

  return { ...list, data, isLoading: plansLoading || list.isLoading };
}

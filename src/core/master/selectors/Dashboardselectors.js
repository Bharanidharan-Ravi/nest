// src/core/master/selectors/dashboardSelectors.js
//
// ┌──────────────────────────────────────────────────────────────────────────┐
// │  Components import from HERE only for all dashboard data + actions.      │
// │                                                                          │
// │  What is pre-bound here:  registry + key + staleTime + enabled logic     │
// │  What the component passes:                                              │
// │    Queries   → params only   + optional overrides { staleTime, … }      │
// │    Mutations → urlParams (if any), then mutate(payload) at call time     │
// │                + optional callbacks { onSuccess, onError, onSettled }    │
// └──────────────────────────────────────────────────────────────────────────┘

import { useRegistryQuery }        from "../query/useRegistryQuery";
import { useRegistryMutation }     from "../mutation/useRegistryMutation";
import { DASHBOARD_REGISTRY,
         DASHBOARD_MUTATIONS } from "../registry/Dashboardregistry";

// ─── Queries ──────────────────────────────────────────────────────────────────
//
// Signature: (params, overrides?)
//
// params    → { employeeId, fromDate, toDate, … }   the dynamic values
// overrides → { staleTime, enabled, refetchInterval, select, … }  all optional
//
// ─────────────────────────────────────────────────────────────────────────────
// useTimesheetData
// ─────────────────────────────────────────────────────────────────────────────
//  Basic:
//    const { data, isLoading } = useTimesheetData({ employeeId, fromDate, toDate });
//
//  Override staleTime on one screen (always-fresh):
//    const { data } = useTimesheetData({ employeeId, fromDate, toDate }, { staleTime: 0 });
//
//  Disable until ready:
//    const { data } = useTimesheetData({ employeeId, fromDate, toDate }, { enabled: isReady });

export const useTimesheetData = (params = {}, overrides = {}) =>
  useRegistryQuery(DASHBOARD_REGISTRY, "timesheet", params, overrides);

// ─────────────────────────────────────────────────────────────────────────────
// useCheckedTickets
// ─────────────────────────────────────────────────────────────────────────────
//  Basic:
//    const { data, isLoading } = useCheckedTickets({ employeeId, planDate });

export const useCheckedTickets = (params = {}, overrides = {}) =>
  useRegistryQuery(DASHBOARD_REGISTRY, "checkedTickets", params, overrides);

// ─── Mutations ────────────────────────────────────────────────────────────────
//
// Returns full useMutation result: { mutate, mutateAsync, isPending, isError, data, … }
// Component calls mutate(payload) — payload is the only thing passed at call time.
//
// ─────────────────────────────────────────────────────────────────────────────
// useCommitCheckedTicket
// ─────────────────────────────────────────────────────────────────────────────
//  No urlParams (static URL).
//  options → onSuccess | onError | onSettled | retry | …
//
//  Basic:
//    const { mutate, isPending } = useCommitCheckedTicket();
//    mutate(tickets);
//
//  With callbacks:
//    const { mutate } = useCommitCheckedTicket({
//      onSuccess: (data) => { toast.success("Saved!"); navigate("/dashboard"); },
//      onError:   (err)  => toast.error(err.message),
//    });
//    mutate(tickets);

export const useCommitCheckedTicket = (options = {}) =>
  useRegistryMutation(DASHBOARD_MUTATIONS, "commitCheckedTicket", {}, options);

// ─────────────────────────────────────────────────────────────────────────────
// useUncheckCheckedTicket
// ─────────────────────────────────────────────────────────────────────────────
//  planId is a URL segment → bound at hook-setup time (not inside mutate).
//  body   is the payload   → passed to mutate() at call time.
//
//  Basic:
//    const { mutate } = useUncheckCheckedTicket(planId);
//    mutate(body);
//
//  With callbacks:
//    const { mutate, isPending } = useUncheckCheckedTicket(planId, {
//      onSuccess: () => {
//        queryClient.invalidateQueries(["dashboard", "checkedTickets"]);
//        toast.success("Reverted!");
//      },
//      onError: (err) => toast.error(err.message),
//    });
//    mutate(body);

export const useUncheckCheckedTicket = (planId, options = {}) =>
  useRegistryMutation(DASHBOARD_MUTATIONS, "uncheckCheckedTicket", { planId }, options);
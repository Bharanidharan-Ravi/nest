import { useParams } from "react-router-dom";
import React, { useMemo } from "react";
import { useTicketMaster } from "../hooks/useTicketMaster";
import "../css/ViewTickets.css";
import { ListProvider } from "../../../packages/ui-List/components/ListProvider";
import { ListLayout } from "../../../packages/ui-List/components/ListLayout";
import { TicketListConfig } from "../config/TicketUI.config";
import { ROUTE_KEYS } from "../../../core/routing/paths";
import { useSmartNavigation } from "../../../core/navigation/useSmartNavigation";
import { normalizeTicket } from "../../../app/shared/utils/normalizer";
import {
  useEmployeeOptions,
  useLabelOptions,
  useProjectOptions,
  useRepoOptions,
  useTeamOptions,
} from "../../../core/master/selectors/selectors";
import {
  readUserFromSession,
  useCurrentUser,
} from "../../../core/auth/useCurrentUser";
import { TicketsHeader } from "./TicketsHeader";

export default function TicketsPage() {
  const { repoId, projId } = useParams();
  const activeProjectId = projId;
  const { goTo } = useSmartNavigation();
  const { isViewer } = useCurrentUser();

  const { data } = useTicketMaster({
    repoId: repoId ?? null,
    projectId: activeProjectId ?? null,
  });

  const projectFilterOptions = useProjectOptions(true);
  const labelFilterOptions = useLabelOptions(true);
  const employeeFilterOptions = useEmployeeOptions(true);
  const repoFilterOptions = useRepoOptions(true);
  const teamFilterOptions = useTeamOptions(true);

  const currentUser = readUserFromSession();
  const currentUserId =
    currentUser?.id ?? currentUser?.userId ?? currentUser?.UserId ?? null;

  const editRouteKey = projId
    ? ROUTE_KEYS.PROJ_TICKET_EDIT
    : ROUTE_KEYS.TICKET_EDIT;

  const createRouteKey = repoId
    ? ROUTE_KEYS.REPO_TICKET_CREATE
    : projId
      ? ROUTE_KEYS.PROJ_TICKET_CREATE
      : ROUTE_KEYS.TICKET_CREATE;

  const isAllowedToView = (item, userId) => {
    if (Number(item?.statusId) !== 19) return true;
    if (!userId) return false;

    const normalizedUserId = String(userId).toLowerCase().trim();

    const assignedTo = String(item?.assignedTo ?? "")
      .toLowerCase()
      .trim();
    if (assignedTo && assignedTo === normalizedUserId) return true;

    if (Array.isArray(item?.multiAssignees)) {
      return item.multiAssignees.some((assignee) => {
        const assigneeId = String(assignee?.Assignee_Id ?? "")
          .toLowerCase()
          .trim();
        const assigneeName = String(assignee?.Assignee_Name ?? "")
          .toLowerCase()
          .trim();
        return (
          assigneeId === normalizedUserId || assigneeName === normalizedUserId
        );
      });
    }

    return false;
  };

  const ticketList = useMemo(() => {
    const rawList = (data ?? []).map(normalizeTicket);
    return rawList.filter((item) => isAllowedToView(item, currentUserId));
  }, [data, currentUserId]);

  const listConfigWithNav = {
    ...TicketListConfig(isViewer),
    enablequickComment: isViewer ? false : true,
    enablequickStatus: isViewer ? false : true,
    filters: [
      ...(!repoId
        ? [
            {
              key: "repoId",
              view: "Repo",
              allowMultiple: true,
              showCounts: true,
              allowedRoles: [1, 2],
              options: repoFilterOptions,
            },
          ]
        : []),

      {
        key: "assginedTo",
        view: "owner",
        allowedRoles: [1, 2],
        options: [
          ...useEmployeeOptions(true, "Owner"),
          { label: "No Owner", value: "__no_owner__" },
        ],
        filterType: "custom",
        allowMultiple: true,
        showCounts: true,
        customFilter: (item, selectedValue) => {
          if (
            selectedValue == null ||
            (Array.isArray(selectedValue) && selectedValue.length === 0)
          ) {
            return true;
          }

          const selectedValues = Array.isArray(selectedValue)
            ? selectedValue
            : String(selectedValue)
                .split(",")
                .map((v) => v.trim());

          return selectedValues.some((val) => {
            const assignedTo = item.assignedTo
              ? String(item.assignedTo).toLowerCase()
              : "";
            const safeVal = String(val).toLowerCase();

            if (safeVal === "__no_owner__") {
              return !item.assignedTo || item.assignedTo === "";
            }

            return assignedTo === safeVal;
          });
        },
      },

      {
        key: "multiAssignees",
        view: "Assignee",
        allowedRoles: [1, 2],
        options: employeeFilterOptions,
        filterType: "custom",
        allowMultiple: true,
        showCounts: true,
        customFilter: (item, selectedValues) => {
          if (!selectedValues || selectedValues.length === 0) return true;

          const values = Array.isArray(selectedValues)
            ? selectedValues.map((v) => String(v).toLowerCase())
            : [String(selectedValues).toLowerCase()];

          if (Array.isArray(item.multiAssignees)) {
            return item.multiAssignees.some((assignee) => {
              if (assignee.Assignee_Type === "Main Assignee") return false;

              const assigneeName = String(
                assignee.Assignee_Name || "",
              ).toLowerCase();
              const assigneeId = String(
                assignee.Assignee_Id || "",
              ).toLowerCase();

              return (
                values.includes(assigneeName) || values.includes(assigneeId)
              );
            });
          }

          return false;
        },
      },

      {
        key: "customBoolean",
        view: "Special Flags",
        showCounts: true,
        options: [
          { label: "All Flags", value: "allFlags" },
          { label: "Close Requested", value: "isCloseRequested" },
          { label: "Priority Request", value: "priorityRequest" },
          { label: "Func Response", value: "funcResponse" },
          { label: "Technical Response", value: "technicalResponse" },
          { label: "Web Response", value: "webResponse" },
          { label: "Admin Response", value: "adminResponse" },
        ],
        filterType: "custom",
        allowedRoles: [1, 2],
        allowMultiple: true,
        customFilter: (item, selectedValues) => {
          const values = Array.isArray(selectedValues)
            ? selectedValues
            : String(selectedValues)
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean);

          const flagFields = [
            "isCloseRequested",
            "priorityRequest",
            "funcResponse",
            "webResponse",
            "technicalResponse",
            "adminResponse",
          ];

          if (values.includes("allFlags")) {
            return flagFields.some((field) => item[field] === true);
          }

          if (values.length === 0) return true;

          return values.some((field) => item[field] === true);
        },
      },

      {
        key: "project",
        view: "Project",
        allowedRoles: [1, 2, 3],
        allowMultiple: true,
        showCounts: true,
        options: projectFilterOptions,
      },

      {
        key: "label",
        view: "Label",
        allowedRoles: [1, 2, 3],
        showCounts: true,
        options: labelFilterOptions,
        filterType: "array",
        allowMultiple: true,
        filterKey: "LABEL_ID",
      },

      {
        key: "teamId",
        view: "Team",
        allowedRoles: [1, 2],
        showCounts: true,
        options: teamFilterOptions,
        filterType: "custom",
        allowMultiple: true,
        customFilter: (item, value) => {
          if (!value || value === "") return true;

          return item.multiAssignees?.some(
            (a) =>
              String(a.Assignee_TeamId) === String(value) &&
              a.Assignee_Type === "Main Assignee",
          );
        },
      },
    ],
    onItemClick: (item) => {
      goTo(ROUTE_KEYS.TICKET_DETAIL, { ticketId: item.id });
    },
    onEditClick: (item) => {
      goTo(editRouteKey, { ticketId: item.id, repoId, projId });
    },
  };

  return (
    <>
      {/* {!repoId && !projId && (
        <div className="flex justify-between items-center mb-4 flex-none px-2">
          <h2 className="text-2xl font-bold text-gray-800">Tickets</h2>

          <button
            onClick={() => goTo(createRouteKey, { repoId, projId })}
            className="bg-brand-yellow text-white px-4 py-2 rounded-md font-medium hover:bg-yellow-500 transition-colors"
          >
            Create New Tickets
          </button>
        </div>
      )} */}

      <div className="w-full pb-10">
        <ListProvider
          config={listConfigWithNav}
          data={ticketList}
          userRole={currentUser?.role}
        >
          {!repoId && !projId && (
            <TicketsHeader
              onCreate={() => goTo(createRouteKey, { repoId, projId })}
            />
          )}
          <ListLayout />
        </ListProvider>
      </div>
    </>
  );
}

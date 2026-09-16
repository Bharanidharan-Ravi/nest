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
  useRepoWithOutId,
  useTeamOptions,
} from "../../../core/master/selectors/selectors";
import {
  readUserFromSession,
  useCurrentUser,
} from "../../../core/auth/useCurrentUser";
import { TicketsHeader } from "./TicketsHeader";
export const isAllowedToView = (item, userId) => {
  const normalizedUserId = String(userId ?? "").toLowerCase().trim();
  if (!item?.privateTicket && Number(item?.statusId) !== 19) {
    return true;
  }
  // Public items or items not in restricted status are visible to everyone.
  const assignedTo = String(item?.assignedTo ?? "")
    .toLowerCase()
    .trim();
  if (assignedTo === normalizedUserId) return true;

  if (!userId) return false;
  // Allow multi assignees.
  if (Array.isArray(item?.multiAssignees)) {
    return item.multiAssignees.some((assignee) => {
      const assigneeId = String(assignee?.Assignee_Id ?? "")
        .toLowerCase()
        .trim();

      const assigneeName = String(assignee?.Assignee_Name ?? "")
        .toLowerCase()
        .trim();

      return (
        assigneeId === normalizedUserId ||
        assigneeName === normalizedUserId
      );
    });
  }

  return false;
};
export default function TicketsPage() {
  const { repoId, projId } = useParams();
  const activeProjectId = projId;
  const { goTo } = useSmartNavigation();
  const { isViewer } = useCurrentUser();

  const { data } = useTicketMaster({
    repoId: repoId ?? null,
    projectId: activeProjectId ?? null,
  });
  // const data  = useTicketMaster(activeProjectId);

  const projectFilterOptions = useProjectOptions(true);
  const labelFilterOptions = useLabelOptions(true);
  const employeeFilterOptions = useEmployeeOptions(true);
  const repoFilterOptions = useRepoOptions(true);
  const repoMaster = useRepoWithOutId();
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
      : ROUTE_KEYS.TICKET_CREATE

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
        allowedRoles: [1, 2, 3],
        options: isViewer
          ? [
            { label: "Assignees", value: "" },
            ...repoFilterOptions.filter(
              (item) => item.label !== "Repositories"
            ),
            {
              label: "WorkGlow Solutions",
              value: "7c4039b9-248c-4d4c-a66b-976554d603b1"
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
          { label: "Technical Response", value: "technicalResponse" },
          { label: "Web Response", value: "webResponse" },
          { label: "Admin Response", value: "adminResponse" },
           {label:"Client Tickets",value:"raiseToClient"},
          
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
            "raiseToClient"
          ];

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
      {
        key: "move_toJson",
        view: "Handler",
        allowedRoles: [1, 2],
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
        allowedRoles: [1, 2],
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
    onItemClick: (item) => {
      goTo(ROUTE_KEYS.TICKET_DETAIL, { ticketId: item.id });
    },
    onEditClick: (item) => {
      goTo(editRouteKey, { ticketId: item.id, repoId, projId });
    },
  };

  return (
    <>
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

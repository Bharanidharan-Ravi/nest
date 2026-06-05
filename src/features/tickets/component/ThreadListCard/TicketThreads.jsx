import React, { useCallback, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { FaHistory, FaArrowRight, FaTags, FaClock } from "react-icons/fa";
import { ListProvider } from "../../../../packages/ui-List/components/ListProvider";
import { ListCardView } from "../../../../packages/ui-List/components/ListCardView";
import EntityFormPage from "../../../../packages/crud/pages/EntityFormPage";
import ThreadListCard from "../ThreadListCard/ThreadListCard";
import { ThreadListConfig } from "../../config/ThreadUI.Config";
import { ThreadFieldConfig } from "../../config/Thread.config";
import { ThreadFormConfig } from "../../config/ThreadForm.config";
import { queryKeys } from "../../../../core/query/queryKeys";
import { useApiMutation } from "../../../../core/query/useApiMutation";
import apiClient from "../../../../core/api/apiClient";
import { queryClient } from "../../../../core/api/queryClient";
import { GitCommitIcon } from "lucide-react";
import ConfirmDialog, { useConfirmDialog } from "../../../../app/shared/confirmation/confirmationModel";


dayjs.extend(relativeTime);

export function useThreadOverRides() {
  const [overrides, setOverRides] = useState({});

  const setOverRide = useCallback((threadId, field, value) => {
    setOverRides((prev) => ({
      ...prev,
      [threadId]: {
        ...(prev[threadId] ?? {}),
        [field]: value,
      },
    }));
  }, []);

  const getItem = useCallback(
    (item) => ({
      ...item,
      ...(overrides[item.id] ?? {}),
    }),
    [overrides],
  );

  return [overrides, setOverRide, getItem];
}

const TicketThreads = ({
  ticketId,
  threadsData,
  historyData,
  assigneesJsonString,
  selectedWorkStream,
  selectedHandoffId,
  parentTicket,
  formContext,
  editingItem,
  setEditingItem,
  currentUser,
}) => {
  const [expandCount, setExpandCount] = useState(0);

  // ✅ FIXED
  const [overrides, setOverRide, getItem] = useThreadOverRides();

  const { dialogProps, openDialog } = useConfirmDialog();
  const rawThreads = React.useMemo(() => {
    const threadsArray = Array.isArray(threadsData)
      ? threadsData
      : [];

    const allHandoffs = [];

    (assigneesJsonString || []).forEach((assignee) => {
      if (
        assignee.HandOffData &&
        Array.isArray(assignee.HandOffData)
      ) {
        allHandoffs.push(...assignee.HandOffData);
      }
    });

    return threadsArray.map((thread) => {
      const threadHandoffs = allHandoffs.filter(
        (handoff) =>
          handoff.InitiatingThreadId === thread.ThreadId &&
          handoff.Status !== "Inactive",
      );

      const inactiveStreamIds = allHandoffs
        .filter(
          (handoff) =>
            handoff.InitiatingThreadId === thread.ThreadId &&
            handoff.Status === "Inactive",
        )
        .map((h) => h.TargetStreamId);

      const mappedAssignees = threadHandoffs
        .map((handoff) => {
          const targetAssignee = (
            assigneesJsonString || []
          ).find(
            (a) => a.StreamId === handoff.TargetStreamId,
          );

          if (targetAssignee) {
            return {
              label: targetAssignee.Assignee_Name,
              value: {
                id: targetAssignee.Assignee_Id,
                name: targetAssignee.Assignee_Name,
                streamId: targetAssignee.StreamId,
              },
            };
          }

          return null;
        })
        .filter(Boolean);

      const directAssignees = (assigneesJsonString || [])
        .filter(
          (a) =>
            a.ParentThreadId === thread.ThreadId &&
            !inactiveStreamIds.includes(a.StreamId),
        )
        .map((a) => ({
          label: a.Assignee_Name,
          value: {
            id: a.Assignee_Id,
            name: a.Assignee_Name,
            streamId: a.StreamId,
          },
        }));

      const finalAssignees = [
        ...mappedAssignees,
        ...directAssignees,
      ].filter(
        (v, i, a) =>
          a.findIndex(
            (t) =>
              t.value.streamId === v.value.streamId,
          ) === i,
      );

      let parsedCoContributors = [];

      try {
        if (thread.CoContributors_JSON) {
          parsedCoContributors = JSON.parse(
            thread.CoContributors_JSON,
          );
        }
      } catch (error) {
        console.error(
          "failed to parse CoContributors",
          thread.ThreadId,
        );
      }

      return {
        id: thread.ThreadId,
        Issue_Id: thread.Issue_Id,
        description: thread.HtmlDesc,
        Hours: thread.Hours,
        fromTime: thread.From_Time,
        toTime: thread.To_Time,
        createdAt: thread.CreatedAt,
        CreatedBy: thread.CreatedBy,
        CreatedId: thread.CreatedId,
        UpdatedAt: thread.UpdatedAt,
        UpdatedBy: thread.UpdatedBy,
        workStreamId: thread.WorkStreamId,
        completionPct: thread.CompletionPct,
        assignees: finalAssignees,
        HandsOffId: thread.HandsOffId,
        CoContributors: parsedCoContributors,
        IsSupport: thread.IsSupport,
        toClient: thread.toClient,
        team: thread.team,
      };
    });
  }, [threadsData, assigneesJsonString]);

  // =========================================================
  // FILTERED THREADS
  // =========================================================

  const filteredThreads = React.useMemo(() => {
    if (!selectedWorkStream && !selectedHandoffId)
      return rawThreads;

    if (selectedHandoffId) {
      let activeHandoff = null;

      for (const ws of assigneesJsonString) {
        if (ws.HandOffData) {
          const found = ws.HandOffData.find(
            (h) => h.HandsOffId === selectedHandoffId,
          );

          if (found) {
            activeHandoff = found;
            break;
          }
        }
      }

      return rawThreads.filter(
        (thread) =>
          (activeHandoff &&
            thread.id ===
            activeHandoff.InitiatingThreadId) ||
          thread.HandsOffId === selectedHandoffId,
      );
    }

    if (selectedWorkStream) {
      const parentThreadId =
        selectedWorkStream.ParentThreadId;

      const targetAssigneeId =
        selectedWorkStream.Assignee_Id?.toLowerCase();

      const outgoingHandoffIds =
        selectedWorkStream.HandOffData?.map(
          (h) => h.HandsOffId,
        ) || [];

      const incomingHandoffIds = [];

      assigneesJsonString.forEach((ws) => {
        if (ws.HandOffData) {
          ws.HandOffData.forEach((h) => {
            if (
              h.TargetStreamId ===
              selectedWorkStream.StreamId
            ) {
              incomingHandoffIds.push(h.HandsOffId);
            }
          });
        }
      });

      const allRelevantHandoffIds = [
        ...outgoingHandoffIds,
        ...incomingHandoffIds,
      ];

      return rawThreads.filter((thread) => {
        if (
          parentThreadId &&
          thread.Id === parentThreadId
        )
          return true;

        const isByAssignee =
          thread.CreatedId?.toLowerCase() ===
          targetAssigneeId ||
          thread.CreatedBy?.toLowerCase() ===
          targetAssigneeId;

        if (isByAssignee) return true;

        if (
          thread.HandsOffId &&
          allRelevantHandoffIds.includes(
            thread.HandsOffId,
          )
        )
          return true;

        return false;
      });
    }

    return rawThreads;
  }, [
    rawThreads,
    selectedWorkStream,
    selectedHandoffId,
    assigneesJsonString,
  ]);

  // =========================================================
  // ENRICHED TIMELINE
  // =========================================================

  const enrichedTimeline = React.useMemo(() => {
    const combinedTimeline = [];

    filteredThreads.forEach((thread) => {
      combinedTimeline.push({
        ...thread,
        isChatThread: true,
        sortTime: new Date(thread.createdAt).getTime(),
      });
    });

    if (!formContext.isViewer) {
      (historyData || []).forEach((h) => {
        if (h.EventType === "TICKET_CREATED") return;

        combinedTimeline.push({
          isTimelineEvent: true,
          id: `history-${h.Id}`,
          eventType: h.EventType,
          summary: h.Summary,
          actorName: h.ActorName,
          createdAt: h.CreatedAt,
          sortTime: new Date(h.CreatedAt).getTime(),
        });
      });
    }

    combinedTimeline.sort(
      (a, b) => a.sortTime - b.sortTime,
    );

    let previousCommenter = null;

    return combinedTimeline.map((item) => {
      if (item.isChatThread) {
        let replyToName = null;

        if (
          previousCommenter &&
          previousCommenter !== item.CreatedBy
        ) {
          replyToName = previousCommenter;
        }

        previousCommenter = item.CreatedBy;

        return {
          ...item,
          ReplyToName: replyToName,
        };
      }

      previousCommenter = null;

      return item;
    });
  }, [filteredThreads, historyData]);

  // =========================================================
  // COLLAPSE LOGIC
  // =========================================================

  const finalTimeline = React.useMemo(() => {
    const TOTAL = enrichedTimeline.length;

    const INITIAL_TOP = 10;
    const INITIAL_BOTTOM = 10;

    if (TOTAL <= INITIAL_TOP + INITIAL_BOTTOM)
      return enrichedTimeline;

    const currentTopCount =
      INITIAL_TOP + expandCount;

    const remainingHidden =
      TOTAL -
      currentTopCount -
      INITIAL_BOTTOM;

    if (remainingHidden <= 0)
      return enrichedTimeline;

    const topPart = enrichedTimeline.slice(
      0,
      currentTopCount,
    );

    const bottomPart = enrichedTimeline.slice(
      TOTAL - INITIAL_BOTTOM,
    );

    return [
      ...topPart,
      {
        isCollapsedMarker: true,
        hiddenCount: remainingHidden,
        id: "collapsed-marker",
      },
      ...bottomPart,
    ];
  }, [enrichedTimeline, expandCount]);

  // =========================================================
  // TOGGLES
  // =========================================================
  const commitToggle = useCallback(
    async (item,checked,field) => {
console.log("item, checked:",  checked);
      try {
        await apiClient.post(`thread/${item.id}`, {[field]: checked })
        queryClient.invalidateQueries(queryKeys.ticket.thread(ticketId))
      } catch (err) {
        setOverRide(item.id, field, !checked)
      }
    },
    [queryClient, ticketId, setOverRide]
  )

  const togglesConfig = [
    {
      field: "toClient",
      name: "toClient",
      label: "Commit to Client",
      VisibleWhen: (item, isMe) => !formContext?.isViewer && isMe,
      onCommit: (item, checked, name) => {
        openDialog({
          variant: checked ? "info" : "warning",
      
          title: checked
            ? "Commit this thread to the client?"
            : "Remove client commitment for this thread?",
      
          description: "This will update the thread for all participants",
      
          confirmText: checked ? "Yes, Commit" : "Yes, Remove",
      
          cancelText: "Cancel",
      
          onConfirm: () => commitToggle(item,checked,name),
      
          onCancel: () => setOverRide(item.id,!checked,name),
        });
      
       
      }
    },
  ];

  // =========================================================
  // MERGED TIMELINE
  // =========================================================

  const mergedTimeLine = React.useMemo(
    () =>
      finalTimeline.map((item) =>
        item.isCollapsedMarker ||
          item.isTerminalState
          ? item
          : getItem(item),
      ),
    [finalTimeline, getItem],
  );

  // =========================================================
  // LIST CONFIG
  // =========================================================

  const listConfig = {
    ...ThreadListConfig,

    pageSize: 9999,
    infinite: false,

    cardRenderer: (item) => {
      // =====================================
      // COLLAPSED MARKER
      // =====================================

      if (item.isCollapsedMarker) {
        return (
          <div
            key="collapsed-marker"
            className="flex items-center justify-center my-6 relative w-full group"
          >
            <div className="absolute w-full h-px bg-gray-200"></div>

            <button
              onClick={() =>
                setExpandCount(
                  (prev) => prev + 30,
                )
              }
              className="relative z-10 bg-gray-50 hover:bg-white text-gray-500 hover:text-blue-600 text-xs font-bold px-5 py-2 border border-gray-200 hover:border-blue-300 shadow-sm rounded-full transition-all duration-200"
            >
              Load{" "}
              {Math.min(item.hiddenCount, 30)} more
              comments ({item.hiddenCount} hidden)
            </button>
          </div>
        );
      }

      // =====================================
      // HISTORY EVENTS
      // =====================================

      if (item.isTimelineEvent) {
        if (formContext.isViewer) return null;

        let EventIcon = FaHistory;

        if (
          item.eventType ===
          "WORKSTREAM_CREATED"
        ) {
          EventIcon = FaArrowRight;
        }

        if (
          item.eventType === "LABEL_ADDED" ||
          item.eventType === "LABEL_REMOVED"
        ) {
          EventIcon = FaTags;
        }

        if (
          item.eventType === "TICKET_UPDATED"
        ) {
          EventIcon = FaClock;
        }

        return (
          <div
            key={item.id}
            className="flex items-center gap-4 w-full mb-6 relative"
          >
            <div className="flex-shrink-0 relative z-10 flex justify-center w-10 mt-1">
              <div className="w-6 h-6 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center shadow-sm">
                <EventIcon className="text-gray-500 text-[10px]" />
              </div>
            </div>

            <div className="flex-1 text-[13px] text-gray-600 inline-flex items-center flex-wrap gap-1 w-fit max-w-fit bg-gray-50/50 px-3 py-1.5 rounded-full border border-gray-100">
              {item.summary.startsWith(
                item.actorName,
              ) ? (
                <>
                  <strong className="text-gray-800 mr-1">
                    {item.actorName}
                  </strong>

                  <span>
                    {item.summary
                      .replace(item.actorName, "")
                      .trim()}
                  </span>
                </>
              ) : (
                <span>{item.summary}</span>
              )}

              <span className="text-xs text-gray-400 ml-2">
                •{" "}
                {dayjs(item.createdAt).fromNow()}
              </span>
            </div>
          </div>
        );
      }

      // =====================================
      // EDIT FORM
      // =====================================

      if (
        editingItem &&
        editingItem.id === item.id
      ) {
        return (
          <EntityFormPage
            mode="Edit"
            config={{
              ...ThreadFormConfig,
              invalidateKeys:
                queryKeys.ticket.thread(
                  ticketId,
                ),
              api: `thread/${editingItem?.id}`,
            }}
            context={{
              isEdit: true,
              parentTicket,
              editingItem,
              ...formContext,
            }}
            module="Thread"
            onCancel={() =>
              setEditingItem(null)
            }
            onSuccessCallback={() =>
              setEditingItem(null)
            }
          />
        );
      }

      // =====================================
      // NORMAL THREAD CARD
      // =====================================

      return (
        <ThreadListCard
          item={item}
          currentUser={currentUser?.name}
          onEdit={() => setEditingItem(item)}
          formContext={formContext}
          toggles={togglesConfig}
        />
      );
    },
  };

  // =========================================================
  // TERMINAL STATE
  // =========================================================

  const isTerminalState = [14, 15, 16, 17].includes(
    parentTicket?.StatusId,
  );

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="relative pl-0">
        <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gray-200 z-0" />

        {/* ✅ FIXED */}
        <ListProvider
          config={listConfig}
          data={mergedTimeLine}
        >
          <ConfirmDialog {...dialogProps} />
          <ListCardView />
        </ListProvider>
      </div>

      {/* ===================================== */}
      {/* REPLY / REOPEN FORM */}
      {/* ===================================== */}

      {!editingItem && (
        <div className="rounded-3xl p-2">
          <EntityFormPage
            mode={
              isTerminalState
                ? "Reopen"
                : "Create"
            }
            config={{
              ...ThreadFormConfig,
              fields:
                ThreadFieldConfig(ticketId),
            }}
            context={{
              ...formContext,
              isClosed: isTerminalState,
              parentTicket,
              isQuickFormOpen: null,
              isQuickStatusOpen: null,
              openDialog, 
            }}
            module="Ticket"
          />
        </div>
      )}
    </div>
  );
};

export default TicketThreads;

import React, { useCallback, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { FaHistory, FaArrowRight, FaTags, FaClock, FaTimes } from "react-icons/fa";
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
  
  // Track which history blocks have been expanded
  const [expandedHistoryGroups, setExpandedHistoryGroups] = useState({});

  const [overrides, setOverRide, getItem] = useThreadOverRides();
  const [replyingToThread, setReplyingToThread] = useState(null)

  const { dialogProps, openDialog } = useConfirmDialog();
  
  const rawThreads = React.useMemo(() => {
    const threadsArray = Array.isArray(threadsData) ? threadsData : [];
    const allHandoffs = [];

    (assigneesJsonString || []).forEach((assignee) => {
      if (assignee.HandOffData && Array.isArray(assignee.HandOffData)) {
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
          const targetAssignee = (assigneesJsonString || []).find(
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

      const finalAssignees = [...mappedAssignees, ...directAssignees].filter(
        (v, i, a) => a.findIndex((t) => t.value.streamId === v.value.streamId) === i,
      );

      let parsedCoContributors = [];
let parsedReactionsJSON = []
      try {
        if (thread.CoContributors_JSON) {
          parsedCoContributors = JSON.parse(thread.CoContributors_JSON);
        } 
        console.log("thread :", thread)
        if (thread.Reactions_JSON) {
          parsedReactionsJSON = JSON.parse(thread.Reactions_JSON);
        }
      } catch (error) {
        console.error("failed to parse CoContributors", thread.ThreadId);
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
        reactionsJSON: parsedReactionsJSON,
        IsSupport: thread.IsSupport,
        toClient: thread.toClient,
        team: thread.team,
        Ref_Id: thread.Ref_Id,
      };
    });
  }, [threadsData, assigneesJsonString]);

  // =========================================================
  // FILTERED THREADS
  // =========================================================

  const filteredThreads = React.useMemo(() => {
    if (!selectedWorkStream && !selectedHandoffId) return rawThreads;

    if (selectedHandoffId) {
      let activeHandoff = null;
      for (const ws of assigneesJsonString) {
        if (ws.HandOffData) {
          const found = ws.HandOffData.find((h) => h.HandsOffId === selectedHandoffId);
          if (found) {
            activeHandoff = found;
            break;
          }
        }
      }

      return rawThreads.filter(
        (thread) =>
          (activeHandoff && thread.id === activeHandoff.InitiatingThreadId) ||
          thread.HandsOffId === selectedHandoffId,
      );
    }

    if (selectedWorkStream) {
      const parentThreadId = selectedWorkStream.ParentThreadId;
      const targetAssigneeId = selectedWorkStream.Assignee_Id?.toLowerCase();
      const outgoingHandoffIds = selectedWorkStream.HandOffData?.map((h) => h.HandsOffId) || [];
      const incomingHandoffIds = [];

      assigneesJsonString.forEach((ws) => {
        if (ws.HandOffData) {
          ws.HandOffData.forEach((h) => {
            if (h.TargetStreamId === selectedWorkStream.StreamId) {
              incomingHandoffIds.push(h.HandsOffId);
            }
          });
        }
      });

      const allRelevantHandoffIds = [...outgoingHandoffIds, ...incomingHandoffIds];

      return rawThreads.filter((thread) => {
        if (parentThreadId && thread.Id === parentThreadId) return true;

        const isByAssignee =
          thread.CreatedId?.toLowerCase() === targetAssigneeId ||
          thread.CreatedBy?.toLowerCase() === targetAssigneeId;

        if (isByAssignee) return true;

        if (thread.HandsOffId && allRelevantHandoffIds.includes(thread.HandsOffId)) return true;

        return false;
      });
    }

    return rawThreads;
  }, [rawThreads, selectedWorkStream, selectedHandoffId, assigneesJsonString]);

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

    combinedTimeline.sort((a, b) => a.sortTime - b.sortTime);

    let previousCommenter = null;

    return combinedTimeline.map((item) => {
      if (item.isChatThread) {
        let replyToName = null;
        if (previousCommenter && previousCommenter !== item.CreatedBy) {
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
  }, [filteredThreads, historyData, formContext.isViewer]);

  // =========================================================
  // LOCAL HISTORY COLLAPSE LOGIC
  // =========================================================

  const processedTimeline = React.useMemo(() => {
    const result = [];
    let historyBuffer = [];
    let groupIdCounter = 0;

    const flushBuffer = () => {
      if (historyBuffer.length > 0) {
        const groupId = `history-group-${groupIdCounter++}`;
        const isExpanded = expandedHistoryGroups[groupId];

        if (historyBuffer.length > 5 && !isExpanded) {
          const hiddenCount = historyBuffer.length - 5;
          const visibleItems = historyBuffer.slice(hiddenCount);

          result.push({
            isLocalHistoryCollapseMarker: true,
            id: `collapse-${groupId}`,
            groupId,
            hiddenCount,
          });
          result.push(...visibleItems);
        } else {
          result.push(...historyBuffer);
        }
        historyBuffer = []; 
      }
    };

    enrichedTimeline.forEach((item) => {
      if (item.isTimelineEvent) {
        historyBuffer.push(item);
      } else {
        flushBuffer(); 
        result.push(item);
      }
    });
    flushBuffer(); 

    return result;
  }, [enrichedTimeline, expandedHistoryGroups]);

  // =========================================================
  // GLOBAL PAGE COLLAPSE LOGIC
  // =========================================================

  const finalTimeline = React.useMemo(() => {
    const TOTAL = processedTimeline.length;

    const INITIAL_TOP = 10;
    const INITIAL_BOTTOM = 10;

    if (TOTAL <= INITIAL_TOP + INITIAL_BOTTOM) return processedTimeline;

    const currentTopCount = INITIAL_TOP + expandCount;
    const remainingHidden = TOTAL - currentTopCount - INITIAL_BOTTOM;

    if (remainingHidden <= 0) return processedTimeline;

    const topPart = processedTimeline.slice(0, currentTopCount);
    const bottomPart = processedTimeline.slice(TOTAL - INITIAL_BOTTOM);

    return [
      ...topPart,
      {
        isCollapsedMarker: true,
        hiddenCount: remainingHidden,
        id: "collapsed-marker",
      },
      ...bottomPart,
    ];
  }, [processedTimeline, expandCount]);

  // =========================================================
  // TOGGLES
  // =========================================================
  const commitToggle = useCallback(
    async (item, checked, field) => {
      try {
        await apiClient.post(`thread/${item.id}`, { [field]: checked })
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
          onConfirm: () => commitToggle(item, checked, name),
          onCancel: () => setOverRide(item.id, !checked, name),
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
        item.isCollapsedMarker || item.isLocalHistoryCollapseMarker || item.isTerminalState
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
      // GLOBAL COLLAPSED MARKER
      // =====================================
      if (item.isCollapsedMarker) {
        return (
          <div key="collapsed-marker" className="flex items-center justify-center my-6 relative w-full group">
            <div className="absolute w-full h-px bg-gray-200"></div>
            <button
              onClick={() => setExpandCount((prev) => prev + 30)}
              className="relative z-10 bg-gray-50 hover:bg-white text-gray-500 hover:text-blue-600 text-xs font-bold px-5 py-2 border border-gray-200 hover:border-blue-300 shadow-sm rounded-full transition-all duration-200"
            >
              Load {Math.min(item.hiddenCount, 30)} more comments ({item.hiddenCount} hidden)
            </button>
          </div>
        );
      }

      // =====================================
      // LOCAL HISTORY COLLAPSE MARKER (CLEAN UI)
      // =====================================
      if (item.isLocalHistoryCollapseMarker) {
        return (
          <div key={item.id} className="flex items-center gap-3 w-full mb-3 relative group">
            <div className="flex-shrink-0 relative z-10 flex justify-center w-10">
              <div 
                className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => setExpandedHistoryGroups((prev) => ({ ...prev, [item.groupId]: true }))}
              >
                <FaHistory className="text-gray-400 text-[10px]" />
              </div>
            </div>
            <button
              onClick={() => setExpandedHistoryGroups((prev) => ({ ...prev, [item.groupId]: true }))}
              className="text-[11px] font-medium text-blue-500 hover:text-blue-600 hover:underline transition-colors"
            >
              View {item.hiddenCount} older history events
            </button>
          </div>
        );
      }

      const referencedThread = item.Ref_Id
        ? rawThreads.find((t) => String(t.id) === String(item.Ref_Id)) ?? null : null

      // =====================================
      // HISTORY EVENTS (CLEAN & COMPACT UI)
      // =====================================

      if (item.isTimelineEvent) {
        if (formContext.isViewer) return null;

        let EventIcon = FaHistory;
        if (item.eventType === "WORKSTREAM_CREATED") EventIcon = FaArrowRight;
        if (item.eventType === "LABEL_ADDED" || item.eventType === "LABEL_REMOVED") EventIcon = FaTags;
        if (item.eventType === "TICKET_UPDATED") EventIcon = FaClock;

        return (
          <div key={item.id} className="flex items-start gap-3 w-full mb-3 relative group hover:bg-gray-50/50 py-1 -ml-1 rounded transition-colors">
            <div className="flex-shrink-0 relative z-10 flex justify-center w-10 mt-[2px] ml-1">
              <div className="w-5 h-5 rounded-full bg-gray-100/80 flex items-center justify-center text-gray-500">
                <EventIcon className="text-[10px]" />
              </div>
            </div>

            <div className="flex-1 text-[12px] text-gray-600 leading-tight pt-[3px]">
              {item.summary.startsWith(item.actorName) ? (
                <span>
                  <span className="font-semibold text-gray-800 mr-1">{item.actorName}</span>
                  <span>{item.summary.replace(item.actorName, "").trim()}</span>
                </span>
              ) : (
                <span>{item.summary}</span>
              )}
              <span className="text-[11px] text-gray-400 ml-2 whitespace-nowrap">
                {dayjs(item.createdAt).fromNow()}
              </span>
            </div>
          </div>
        );
      }

      // =====================================
      // EDIT FORM
      // =====================================

      if (editingItem && editingItem.id === item.id) {
        return (
          <EntityFormPage
            mode="Edit"
            config={{
              ...ThreadFormConfig,
              invalidateKeys: queryKeys.ticket.thread(ticketId),
              api: `thread/${editingItem?.id}`,
            }}
            context={{
              isEdit: true,
              parentTicket,
              editingItem,
              ...formContext,
            }}
            module="Thread"
            onCancel={() => setEditingItem(null)}
            onSuccessCallback={() => setEditingItem(null)}
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
          onReply={(thread) => {
            setReplyingToThread(thread)
            setTimeout(() => {
              document.getElementById("thread-compose-area")?.scrollIntoView({ behavior: "smooth", block: "nearest" })
            }, 50)
          }}
          referencedThread={referencedThread}
        />
      );
    },
  };

  // =========================================================
  // TERMINAL STATE
  // =========================================================

  const isTerminalState = [14, 15, 16, 17].includes(parentTicket?.statusId);

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="relative pl-0">
        <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gray-200 z-0" />

        <ListProvider config={listConfig} data={mergedTimeLine}>
          <ConfirmDialog {...dialogProps} />
          <ListCardView />
        </ListProvider>
      </div>

      {/* ===================================== */}
      {/* REPLY / REOPEN FORM */}
      {/* ===================================== */}
      {!editingItem && (
        <div id="thread-compose-area" className="rounded-3xl p-2">
          <div className={`overflow-hidden bg-white ${replyingToThread ? "border border-gray-200 rounded-xl" : "border border-gray-200 rounded-xl"}`}>

            {replyingToThread && (
              (() => {
                const cleanReplyText =
                  replyingToThread.description?.replace(/<[^>]+>/g, "")?.replace(/&nbsp;/g, "")?.trim() || "No content";

                return (
                  <div className="flex items-center gap-2 px-3.5 py-2 bg-gray-50 border-b border-gray-200">
                    <svg width="13" height="34" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                      <polyline points="9 14 4 9 9 4" />
                      <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
                    </svg>
                    <span className="text-[12px] font-semibold text-gray-500">Replying to</span>
                    <div className="flex items-center gap-2 px-2 py-1 bg-blue-100 rounded-full">
                      <div className="w-[22px] h-[22px] rounded-full bg-blue-300 flex items-center justify-center text-[9px] font-bold text-gray-800 flex-shrink-0">
                        {replyingToThread.CreatedBy?.split("").map((p) => p[0]?.toUpperCase()).join("").slice(0, 2)}
                      </div>
                      <span className="text-[12px] font-semibold text-gray-800 whitespace-nowrap">{replyingToThread.CreatedBy}</span>
                    </div>
                    <span className="text-[12px] text-gray-500 truncate max-w-[600px]" title={cleanReplyText}>
                      {cleanReplyText.slice(0, 300)}
                      {cleanReplyText.length > 300 ? "..." : ""}
                    </span>

                    <button onClick={() => setReplyingToThread(null)} className="ml-auto flex-shrink-0 w-[22px] h-[22px] rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <FaTimes size={10} />
                    </button>
                  </div>
                );
              })()
            )}

            <EntityFormPage
              key={`reply-form-${replyingToThread?.id ?? "new"}`}
              mode={isTerminalState ? "Reopen" : "Create"}
              config={{
                ...ThreadFormConfig,
                fields: ThreadFieldConfig(ticketId),
              }}
              context={{
                ...formContext,
                isClosed: isTerminalState,
                parentTicket,
                isQuickFormOpen: null,
                isQuickStatusOpen: null,
                openDialog,
                replyingToId: replyingToThread ? String(replyingToThread.id) : null
              }}
              module="Ticket"
              onSuccessCallback={() => {
                setReplyingToThread(null)
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketThreads;
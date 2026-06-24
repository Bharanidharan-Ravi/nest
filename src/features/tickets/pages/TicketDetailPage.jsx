import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useThreadMaster } from "../hooks/useTicketThread";
import { useMasterData } from "../../../core/master/masterCall/useMasterData";
import {
  readUserFromSession,
  useCurrentUser,
} from "../../../core/auth/useCurrentUser";
import { useSmartNavigation } from "../../../core/navigation/useSmartNavigation";
import FloatingArrowScroll from "../../../app/shared/Component/FloatingArrowScroll";
import AssigneesWidget from "../component/AssigneesWidget";

// Import your new split components
import ParentTicketHeader from "../component/ThreadParent/ParentTicketHeader";
import TicketThreads from "../component/ThreadListCard/TicketThreads";
import { ROUTE_KEYS } from "../../../core/routing/paths";
import {
  useProjectMaster,
  useTeamMaster,
  useTicketMaster,
  useTicketProgress,
} from "../../../core/master/selectors/selectors";
const TicketDetailPage = () => {
  const { ticketId } = useParams();

  // const { data } = useMasterData();
  const user = readUserFromSession();
  const { goTo } = useSmartNavigation();
  const editRouteKey = ROUTE_KEYS.TICKET_EDIT;
  const { isViewer } = useCurrentUser();
  const [editingItem, setEditingItem] = useState(null);
  const [isStuck, setIsStuck] = useState(false);
  const sentinelRef = useRef(null);

  const [selectedWorkStream, setSelectedWorkStream] = useState(null);
  const [selectedHandoffId, setSelectedHandoffId] = useState(null);

  //DDD
  const [supportModalOpen, setSupportMOdalOpen] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(null);

  // 🔥 FETCH DATA
  const { data: ThreadsList } = useThreadMaster(ticketId, editingItem?.Id);

  // const { data: ticketMasterData } = useTicketMaster();
  const projectMasterData = useProjectMaster();
  const ticketMasterData = useTicketMaster(ticketId);

  const TeamMaster = useTeamMaster();
  const { data: progressLogs, isLoading } = useTicketProgress(ticketId, {
    enabled: !!ticketId, // Only fire if ticketId exists in the URL
  });
  const toMinutes = (hoursStr) => {
    if (!hoursStr || typeof hoursStr !== "string") return 0;
    const [h = 0, m = 0] = hoursStr.trim().split(":").map(Number);
    return Math.max(0, h * 60 + m);
  };

  // Helper: convert minutes back to HH:MM string
  const toTimeStr = (totalMins) => {
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };
  // Handle header stickiness
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsStuck(!entry.isIntersecting),
      { root: null, threshold: 0, rootMargin: "-12px 0px 0px 0px" },
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, []);
  const parentTicket = ticketMasterData &&  ticketMasterData[0];
 

  // 1. Process Parent Ticket
  // const parentTicket = React.useMemo(() => {
  //   if (!ticketMasterData) return null;
  //   const targetId = String(ticketId).toLowerCase();
  //   const ticket = ticketMasterData.find(
  //     (issue) => issue.Issue_Id?.toLowerCase() === targetId||
  //     issue.navId?.toLowerCase() === targetId,
  //   );
  //   if (!ticket) return null;

  //   const projectDetails = projectMasterData?.find(
  //     (p) => p.id === ticket.Project_Id,
  //   );

  //   return {
  //     ...ticket,
  //     id: ticket.Issue_Id, // Ensure we have a consistent 'id' field for the ticket
  //     Project_Name: projectDetails?.name || "Unknown Project",
  //     projKey: projectDetails?.projectKey || "Unknown Repo",
  //     Repo_Name: projectDetails?.repoName || "Unknown Repo",
  //   };
  // }, [parentTicket, ticketId]);

  const bypassThreadRestriction = [14, 15, 16, 17, 18, 19].includes(
    parentTicket?.statusId,
  );

  const isTicketIncomplete =
    !parentTicket?.assignedTo ||
    !parentTicket?.dueDate ||
    (!parentTicket?.clientTime &&
      !parentTicket?.functionalTime &&
      !parentTicket?.technicalTime &&
      !parentTicket?.webTime);

  // const shouldBlockThreads = !bypassThreadRestriction && isTicketIncomplete;
  const shouldBlockThreads =
    !isViewer && !bypassThreadRestriction && isTicketIncomplete;
  // 2. Process Assignees and Roles
  const assigneesJsonString = parentTicket?.multiAssignees;
  const myAssignments = assigneesJsonString?.filter(
    (a) => a.Assignee_Id?.toLowerCase() === user?.userId?.toLowerCase(),
  );

  const activeStream = myAssignments?.find(
    (a) =>
      ![14, 15, 16].includes(a.StreamStatus) && Number(a.CompletionPct) < 100,
  );
  const myValidStreams = myAssignments?.filter((a) => a.StreamId !== null);
  const lastValidStream =
    myValidStreams?.length > 0
      ? myValidStreams[myValidStreams?.length - 1]
      : null;
  const myCurrentStream =
    activeStream ||
    (myAssignments?.length > 0 ? myAssignments[myAssignments.length - 1] : null);
  const evaluatedStream = selectedWorkStream || myCurrentStream;

  // const isOwner = parentTicket?.Assignee_Id === user?.userId;
  const isOwner = isViewer
    ? parentTicket?.createdBy === user?.userId
    : parentTicket?.assignedTo === user?.userId;
  let userRole = "Standard";
  const isWorkCompleted = evaluatedStream
    ? Number(evaluatedStream.CompletionPct) === 100 ||
      [14, 15, 16].includes(evaluatedStream.StreamStatus)
    : false;

  if (isOwner && !selectedWorkStream) userRole = "Owner";
  else if (evaluatedStream && isWorkCompleted) userRole = "Standard";
  else {
    if (user?.department === "Development") userRole = "Dev";
    if (user?.department === "Testing" || user?.department === "QA")
      userRole = "Tester";
  }

  const isAssignee = myAssignments?.length > 0;

  const formContext = {
    userRole,
    isOwner,
    isViewer,
    currentUser: user,
    activeWorkStream: evaluatedStream,
    selectedHandoffId: selectedHandoffId,
    lastValidStreamId: lastValidStream?.StreamId || null,

    onCommitIntercept: (submitFn) => {
      if (!isAssignee) {
        setPendingSubmit(() => submitFn);
        setSupportMOdalOpen(true);
      } else {
        submitFn(false);
      }
    },
  };

  const mainAssignee = assigneesJsonString?.find(
    (a) =>
      a.Assignee_Type === "Main Assignee" ||
      a.Assignment_Type === "Main Assignee",
  );

  const teamMap = React.useMemo(() => {
    const teams = TeamMaster || [];
    const map = {};
    teams.forEach((t) => {
      map[t.id] = t.name;
    });
    return map;
  }, [TeamMaster]);

  const teamTimeStats = React.useMemo(() => {
    const threads = Array.isArray(ThreadsList?.ThreadsList)
      ? ThreadsList?.ThreadsList
      : [];

    const teamTotals = {}; // teamId → total minutes

    threads.forEach((thread) => {
      if (!thread.Hours) return;
      const mins = toMinutes(thread.Hours);

      // 🔥 Use a Set to collect unique teams.
      // If 3 Web Devs are tagged, it only adds the 'Web' team ID once!
      const teamsInvolved = new Set();

      // 1. Add the Thread Creator's team
      if (thread.team) {
        teamsInvolved.add(thread.team);
      }

      // 2. Add the Co-Contributors' teams
      if (thread.CoContributors_JSON) {
        try {
          const coContributors = JSON.parse(thread.CoContributors_JSON);
          coContributors.forEach((c) => {
            if (c.team) {
              teamsInvolved.add(c.team);
            }
          });
        } catch (e) {
          console.error("Failed to parse CoContributors for team stats", e);
        }
      }

      // 3. Add the total minutes to every unique team involved in this thread
      teamsInvolved.forEach((teamId) => {
        if (!teamTotals[teamId]) teamTotals[teamId] = 0;
        teamTotals[teamId] += mins;
      });
    });

    // Convert to readable format: { TeamName: "02:30", ... }
    const result = {};
    Object.entries(teamTotals).forEach(([teamId, totalMins]) => {
      const teamName = teamMap[Number(teamId)] || `Team ${teamId}`;
      result[teamName] = toTimeStr(totalMins);
    });

    return result;
  }, [ThreadsList, toMinutes, toTimeStr, teamMap]);

  const timeStats = React.useMemo(() => {
    let totalMinutes = 0,
      myMinutes = 0;

    const threads = Array.isArray(ThreadsList?.ThreadsList)
      ? ThreadsList?.ThreadsList
      : [];

    threads.forEach((thread) => {
      if (thread?.Hours && typeof thread.Hours === "string") {
        const parts = thread.Hours.trim().split(":");

        const mins =
          (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);

        totalMinutes += mins;

        if (thread.UpdatedBy === user?.userId) {
          myMinutes += mins;
        }
      }
    });

    const formatTime = (totalMins) => {
      return `${String(Math.floor(totalMins / 60)).padStart(2, "0")}:${String(
        totalMins % 60,
      ).padStart(2, "0")}`;
    };

    return {
      total: formatTime(totalMinutes),
      mine: formatTime(myMinutes),
    };
  }, [ThreadsList, user]);

  if (!parentTicket) return null;
  return (
    <div className="flex flex-col relative w-full pb-10 wg-scrollbar bg-white">
      {/* Top Header extracted to its own Component */}
      <ParentTicketHeader
        parentTicket={parentTicket}
        timeStats={timeStats}
        teamTimeStats={teamTimeStats}
        mainAssignee={mainAssignee}
        isStuck={isStuck}
        sentinelRef={sentinelRef}
        goTo={goTo}
        isOwner={isOwner}
        progressLogs={progressLogs}
        isViewer={isViewer}
      />

      <div className="flex flex-col gap-8 mt-6 px-4 sm:px-6 relative">
        <div className="flex flex-col lg:flex-row gap-8 w-full relative">
          {/* ========================================= */}
          {/* LEFT COLUMN: Timeline & History           */}
          {/* ========================================= */}
          <div className="w-full flex flex-col gap-6">
            {!isViewer && shouldBlockThreads ? (
              <div
                className="flex flex-col items-center justify-center gap-4 py-12 px-6
              border-2 border-dashed border-gray-200 rounded-xl bg-gray-50"
              >
                <button
                  onClick={() => goTo(editRouteKey, { ticketId })}
                  className="bg-brand-yellow text-white px-4 py-2 rounded-md
              font-medium hover:opacity-90 transition-colors"
                >
                  Complete Ticket Details
                </button>
              </div>
            ) : (
              <TicketThreads
                ticketId={ticketId}
                threadsData={ThreadsList?.ThreadsList || []}
                historyData={
                  ThreadsList?.TicketHistory || ThreadsList?.ticketHistory || []
                }
                assigneesJsonString={assigneesJsonString}
                selectedWorkStream={selectedWorkStream}
                selectedHandoffId={selectedHandoffId}
                parentTicket={parentTicket}
                formContext={formContext}
                editingItem={editingItem}
                setEditingItem={setEditingItem}
                currentUser={user}
              />
            )}
          </div>

          {/* ========================================= */}
          {/* RIGHT COLUMN: Sticky Sidebar              */}
          {/* ========================================= */}
          {!isViewer && (
            <div className="w-full lg:w-1/4">
              <div className="sticky top-28 h-[calc(100vh-8rem)] flex flex-col gap-6">
                <AssigneesWidget
                  workStreams={assigneesJsonString}
                  data={parentTicket}
                  ticketId={ticketId}
                  formContext={formContext}
                  selectedWorkStream={selectedWorkStream}
                  onSelectWorkStream={setSelectedWorkStream}
                  selectedHandoffId={selectedHandoffId}
                  onSelectHandoff={setSelectedHandoffId}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* {supportModalOpen && ( */}
      {!isViewer && supportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[360px] flex flex-col gap-4 border border-gray-100">
            <div className="flex flex-col gap-1.5">
              <h3 className="text-base font-bold text-gray-900">
                How would you like to commit ?
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                You are not assigned to this ticket. You can commit as a {""}
                <strong className="text-blue-600">Support</strong> contributor,
                or proceed normally.
              </p>
            </div>
            <div className="flex flex-col gap-2 mt-1">
              <button
                onClick={() => {
                  pendingSubmit?.(true);
                  setSupportMOdalOpen(false);
                  setPendingSubmit(null);
                }}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold transition-colors"
              >
                Commit as Support
              </button>
              <button
                onClick={() => {
                  pendingSubmit?.(false);
                  setSupportMOdalOpen(false);
                  setPendingSubmit(null);
                }}
                className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-md text-sm font-semibold transition-colors"
              >
                Commit as Assignee
              </button>
              <button
                onClick={() => {
                  setSupportMOdalOpen(false);
                  setPendingSubmit(null);
                }}
                className="w-full py-2 text-sm text-red-400 hover:text-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <div id="bottomSection"></div>
      <FloatingArrowScroll targetId="bottomSection" />
    </div>
  );
};

export default TicketDetailPage;

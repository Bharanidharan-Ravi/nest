// useEnrichedTickets.jsx (The new layer!)
import { useMemo } from "react";
import { useProjectMaster } from "../../../core/master/selectors/selectors";

export const useEnrichedTickets = (tickets) => {
  const projectMasterData = useProjectMaster();

  return useMemo(() => {
    if (!tickets || !Array.isArray(tickets)) return [];

    return tickets.map((ticket) => {
      // Find the project based on the ID we saved in the base normalizer
      const projectDetails = projectMasterData?.find((p) => p.id === ticket.project) || {};

      return {
        ...ticket,
        projectName: projectDetails.name || "Unknown Project",
        repoName: projectDetails.repoName || "Unknown Repo",
      };
    });
  }, [tickets, projectMasterData]);
};

// ==========================================
  // THREAD LIST NORMALIZER
  // ==========================================
  const normalizeThreadList = useCallback((threadsData, ticketId) => {
    const threadsArray = Array.isArray(threadsData) ? threadsData : [];
    const allHandoffs = [];
const 
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
      try {
        if (thread.CoContributors_JSON) {
          parsedCoContributors = JSON.parse(thread.CoContributors_JSON);
        }
      } catch (error) {
        console.error("failed to parse CoContributors", thread.ThreadId);
      }

      let parsedReactions = [];
      try {
        if (thread.Reactions_JSON) {
          parsedReactions = JSON.parse(thread.Reactions_JSON);
        }
      } catch (error) {
        console.error("failed to parse Reactions", thread.ThreadId);
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
        Reactions: parsedReactions,
        IsSupport: thread.IsSupport,
        toClient: thread.toClient,
        team: thread.team,
        Ref_Id: thread.Ref_Id,
        ThreadType: thread.ThreadType || "Comment",
        MeetingId: thread.MeetingId,
        MeetingDetails_JSON: thread.MeetingDetails_JSON,

        // 🔥 Injected Role Flag
        isViewer: isViewer,
      };
    });
  }, [isViewer]);
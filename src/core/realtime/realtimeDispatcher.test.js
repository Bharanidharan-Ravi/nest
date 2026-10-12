import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryObserver } from "@tanstack/react-query";
import { queryClient } from "../api/queryClient";
import { handleRealtimeMessage } from "./realtimeDispatcher";

vi.mock("../auth/useCurrentUser", () => ({
  readUserFromSession: () => ({ userId: "ME" }),
}));

const tick = () => new Promise((resolve) => setTimeout(resolve, 10));

/** A meeting list on screen, as the scheduler caches it, plus how often it was loaded. */
async function watchMeetingList(employeeId, rows = []) {
  const counter = { calls: 0 };
  const observer = new QueryObserver(queryClient, {
    queryKey: ["MeetingData", { EmployeeID: employeeId, FromDate: "2026-10-01", ToDate: "2026-10-01" }],
    queryFn: async () => {
      counter.calls += 1;
      return rows;
    },
  });
  const unsubscribe = observer.subscribe(() => {});
  await tick();
  counter.calls = 0; // count only the loads after the message
  return { counter, unsubscribe };
}

const meetingMessage = (payload) => ({
  Entity: "MeetingData",
  Action: "MEETING_CREATED",
  KeyField: "Meeting_Id",
  Payload: { Meeting_Id: "m-1", Host_Id: "host-1", ...payload },
});

afterEach(() => {
  queryClient.clear();
});

describe("MeetingData realtime message", () => {
  it("reloads the list of a participant (any casing, participants as a JSON string)", async () => {
    const { counter, unsubscribe } = await watchMeetingList("u2");

    handleRealtimeMessage(
      queryClient,
      meetingMessage({ internalParticipants: JSON.stringify([{ participant_Id: "U2" }]) })
    );
    await tick();

    expect(counter.calls).toBe(1);
    unsubscribe();
  });

  it("reloads the host's list", async () => {
    const { counter, unsubscribe } = await watchMeetingList("host-1");

    handleRealtimeMessage(queryClient, meetingMessage({}));
    await tick();

    expect(counter.calls).toBe(1);
    unsubscribe();
  });

  it("leaves lists of people not in the meeting alone", async () => {
    const { counter, unsubscribe } = await watchMeetingList("someone-else");

    handleRealtimeMessage(queryClient, meetingMessage({ InternalParticipants: "[]" }));
    await tick();

    expect(counter.calls).toBe(0);
    unsubscribe();
  });

  it("reloads a list that already shows the meeting (edit that removed this person, cancel, complete)", async () => {
    const { counter, unsubscribe } = await watchMeetingList("someone-else", [{ meeting_id: "M-1" }]);

    handleRealtimeMessage(queryClient, { ...meetingMessage({}), Action: "MEETING_UPDATED" });
    await tick();

    expect(counter.calls).toBe(1);
    unsubscribe();
  });

  it("does not reload while a save in this tab is still running", async () => {
    const { counter, unsubscribe } = await watchMeetingList("host-1");
    queryClient
      .getMutationCache()
      .build(queryClient, { mutationFn: () => new Promise(() => {}) })
      .execute()
      .catch(() => {});

    handleRealtimeMessage(queryClient, meetingMessage({}));
    await tick();

    expect(counter.calls).toBe(0);
    unsubscribe();
  });

  it("no longer creates the old per-employee cache entries", async () => {
    handleRealtimeMessage(queryClient, meetingMessage({}));
    await tick();

    expect(queryClient.getQueryCache().findAll({ queryKey: ["MeetingData", "list"] })).toHaveLength(0);
  });
});

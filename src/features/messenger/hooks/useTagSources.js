/**
 * Entity search for @user / #ticket / #meeting / #project / #repo chat tags.
 * Tickets and meetings aren't in the app's boot-time master-data bundle, so
 * they're fetched lazily (only once the composer's "#" picker is opened) via
 * the same generic /sync/v2 mechanism ProjectList/RepoList already use.
 */
import { useMemo } from "react";
import { useMasterData } from "../../../core/master/masterCall/useMasterData";
import { useApiQuery } from "../../../core/query/useApiQuery";
import { buildSyncPayload } from "../../../core/sync/buildSyncPayload";
import { normalizeMeeting, normalizePerson, normalizeProject, normalizeRepo, normalizeTicket } from "../utils/tagEntities";
import { useChatPeople } from "./useChat";

function useEntityList(configKey, enabled) {
  return useApiQuery({
    queryKey: ["chat-tag-source", configKey],
    url: "/sync/v2",
    method: "POST",
    payload: buildSyncPayload({ configKey }),
    source: configKey,
    options: { enabled, staleTime: 3 * 60_000 },
  });
}

/**
 * @param {boolean} enabled  only fetch tickets/meetings once the "#" picker has actually been opened
 * @returns entries: { entityType, entityId, displayText, label, notifyUserId }[]
 */
export function useTagEntitySources(enabled) {
  const { data: master } = useMasterData();
  const { data: tickets } = useEntityList("TicketsList", enabled);
  const { data: meetings } = useEntityList("MeetingData", enabled);

  return useMemo(
    () => [
      ...(tickets ?? []).map(normalizeTicket),
      ...(master?.ProjectList ?? []).map(normalizeProject),
      ...(master?.RepoList ?? []).map(normalizeRepo),
      ...(meetings ?? []).map(normalizeMeeting),
    ],
    [tickets, meetings, master],
  );
}

/** @user entries in the same shape as useTagEntitySources, for a merged "@" picker. */
export function useTagPeopleSources() {
  const { people } = useChatPeople();
  return useMemo(() => people.map(normalizePerson), [people]);
}

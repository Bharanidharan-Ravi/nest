/**
 * Entity search for @user / #ticket / #meeting / #project / #repo chat tags.
 * Tickets and meetings aren't in the app's boot-time master-data bundle, so
 * they're fetched lazily (only once the composer's "#" picker is opened) via
 * the same generic /sync/v2 mechanism ProjectList/RepoList already use.
 */
import { useMemo } from "react";
import { useMasterData } from "../../../core/master/masterCall/useMasterData";
import { useApiQuery } from "../../../core/query/useApiQuery";
import { queryKeys } from "../../../core/query/queryKeys";
import { buildSyncPayload } from "../../../core/sync/buildSyncPayload";
import { TICKET_TAGS_KEY, ticketTagsPayload } from "../../../core/sync/ticketListV2";
import { normalizeMeeting, normalizePerson, normalizeProject, normalizeRepo, normalizeTicket } from "../utils/tagEntities";
import { useChatPeople } from "./useChat";

function useEntityList(
  configKey,
  enabled,
  payload = buildSyncPayload({ configKey }),
  queryKey = ["chat-tag-source", configKey],
) {
  return useApiQuery({
    queryKey,
    url: "/sync/v2",
    method: "POST",
    payload,
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
  // Every visible ticket: id / code / title / owner only (TicketTagsV2).
  // Same cache entry as the editor's "#" (fetchRepoTickets).
  const { data: tickets } = useEntityList(
    TICKET_TAGS_KEY,
    enabled,
    ticketTagsPayload(),
    queryKeys.ticket.tags(),
  );
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

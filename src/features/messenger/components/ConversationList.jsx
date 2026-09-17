import ChatAvatar from "./ChatAvatar";
import { conversationAvatarSeed, conversationTitle, isGroupConversation, messagePreview, sameId } from "../hooks/useChat";
import { formatListTime } from "../utils/chatTime";

export default function ConversationList({ conversations, isLoading, isError, selectedId, onSelect, userId, nameOf }) {
  if (isLoading) return <p className="p-4 text-sm text-gray-400">Loading…</p>;
  if (isError) return <p className="p-4 text-sm text-red-600">Couldn't load conversations.</p>;
  if (!conversations?.length) {
    return <p className="p-4 text-sm text-gray-400">No conversations yet. Search for someone above to start one.</p>;
  }

  return (
    <ul>
      {conversations.map((c) => {
        const title = conversationTitle(c, userId, nameOf);
        const unread = c.UnreadCount ?? 0;
        const last = c.LastMessage;
        const isGroup = isGroupConversation(c);
        const preview = last
          ? `${sameId(last.SenderUserId, userId) ? "You: " : ""}${messagePreview(last)}`
          : isGroup
            ? `${c.MemberUserIds?.length ?? 0} members`
            : "No messages yet";

        return (
          <li key={c.ConversationId}>
            <button
              onClick={() => onSelect(c.ConversationId)}
              className={[
                "w-full text-left px-3 py-2.5 flex items-center gap-3 border-b border-gray-100 hover:bg-gray-50",
                sameId(c.ConversationId, selectedId) ? "bg-brand-yellow/30" : "",
              ].join(" ")}
            >
              <ChatAvatar name={title} seed={conversationAvatarSeed(c, userId)} />
              <span className="flex-1 min-w-0">
                <span className="flex items-baseline justify-between gap-2">
                  <span className={`truncate text-sm ${unread ? "font-bold text-gray-900" : "font-medium text-gray-800"}`}>
                    {title}
                  </span>
                  <span className={`text-[11px] shrink-0 ${unread ? "text-gray-900 font-semibold" : "text-gray-400"}`}>
                    {formatListTime(c.LastMessageAt ?? c.CreatedAt)}
                  </span>
                </span>
                <span className="flex items-center justify-between gap-2">
                  <span className={`truncate text-xs ${unread ? "text-gray-800 font-medium" : "text-gray-500"}`}>
                    {preview}
                  </span>
                  {unread > 0 && <UnreadBadge count={unread} />}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function UnreadBadge({ count, className = "" }) {
  if (!count) return null;
  return (
    <span
      className={`min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 ${className}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

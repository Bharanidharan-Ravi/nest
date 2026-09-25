import ChatAvatar from "./ChatAvatar";
import {
  conversationAvatarPhoto,
  conversationAvatarSeed,
  conversationTitle,
  isGroupConversation,
  messagePreview,
  sameId,
} from "../hooks/useChat";
import { formatListTime } from "../utils/chatTime";
import { fetUserStatus } from "../hooks/useUserStatus";
import { formateDateTime, formatLastSeen } from "../../../app/shared/utils/chattime";

export default function ConversationList({ conversations, isLoading, isError, selectedId, onSelect, userId, nameOf, photoOf = () => null }) {
  if (isLoading) return <p className="p-4 text-sm text-gray-400">Loading…</p>;
  if (isError) return <p className="p-4 text-sm text-red-600">Couldn't load conversations.</p>;
  if (!conversations?.length) {
    return <p className="p-4 text-sm text-gray-400">No conversations yet. Search for someone above to start one.</p>;
  }
  const {data:statusList=[]}=fetUserStatus()
  const statusMap=Object.fromEntries(statusList.map(s=>[s.EmployeeID?.toLowerCase(),s]))
  return (
    <ul>
      {conversations.map((c) => {
        const title = conversationTitle(c, userId, nameOf);
        const unread = c.UnreadCount ?? 0;
        const last = c.LastMessage;
        const isGroup = isGroupConversation(c);
        const otherMemberId=isGroup
        ?null
        :c.MemberUserIds?.find(id=>!sameId(id,userId))
        const status=otherMemberId
        ?statusMap[otherMemberId?.toLowerCase()]
        :null
        const online=status?.LastHeartbeat && 
        (Date.now()-new Date(status.LastHeartbeat).getTime())<=30*1000
        const preview = last
          ? `${sameId(last.SenderUserId, userId) ? "You: " : ""}${messagePreview(last)}`
          : isGroup
            ? `${c.MemberUserIds?.length ?? 0} members`
            : "No messages yet";
        // console.log("otherMemberId",otherMemberId);
        console.log("status map keys",Object.keys(statusMap).slice(0.3));
        // console.log("status",status);
        return (
          <li key={c.ConversationId}>
            <button
              onClick={() => onSelect(c.ConversationId)}
              className={[
                "w-full text-left px-3 py-2.5 flex items-center gap-3 border-b border-gray-100 hover:bg-gray-50",
                sameId(c.ConversationId, selectedId) ? "bg-brand-yellow/30" : "",
              ].join(" ")}
            >
              <div className="relative shrink-0"
              title={!isGroup && status
                ?(status.LastHeartbeat && (Date.now() - new Date(status.LastHeartbeat).getTime())
                  ?"Online"
                  :status.LastHeartbeat
                  ?`Last seen ${formatLastSeen(status.LastHeartbeat)}`
                  :"Offline"
                )
                
                // ?[
                //   status.IsActive===true?"Online":"Offline",
                //   c.LastReadAt
                //   ?`\nLast Read: ${formateDateTime(c.LastReadAt)}`
                //   :"",
                //   status.LogoutAt
                //   ?`\nLast Seen: ${formateDateTime(status.LogoutAt)}`
                //   :"",
                // ].join("")
                :undefined
              }>
              <ChatAvatar 
              name={title} 
              seed={conversationAvatarSeed(c, userId)} 
              photoUrl={conversationAvatarPhoto(c, userId, photoOf)} />
             {!isGroup && status &&(
              <span className={[
                "absolute bottom-0 right-0",
                "w-3.5 h-3.5 rounded-full",
                "border-2 border-white",
                online ?"bg-green-500":"bg-red-400"
              ].join(" ")}/>
             )}
              </div>
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

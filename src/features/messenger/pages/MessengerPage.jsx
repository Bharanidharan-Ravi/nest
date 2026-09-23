import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, Lock, Users } from "lucide-react";
import ChatAvatar from "../components/ChatAvatar";
import ConversationInfoPanel from "../components/ConversationInfoPanel";
import ConversationList from "../components/ConversationList";
import ConversationView from "../components/ConversationView";
import NewChatPicker from "../components/NewChatPicker";
import NewGroupPicker from "../components/NewGroupPicker";
import { useScrollReveal } from "../hooks/useScrollReveal";
import {
  conversationAvatarPhoto,
  conversationAvatarSeed,
  conversationTitle,
  isGroupConversation,
  sameId,
  useChatPeople,
  useChatUserId,
  useConversations,
  useOpenDirect,
  useOpenGroup,
} from "../hooks/useChat";
import { readUserFromSession } from "../../../core/auth/useCurrentUser";
import { fetUserStatus } from "../hooks/useUserStatus";
import { formatLastSeen } from "../../../app/shared/utils/chattime";

export default function MessengerPage() {
 
  const userId = useChatUserId();
  const { nameOf, photoOf } = useChatPeople();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("c");
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const onListScroll = useScrollReveal();

  const { data: conversations = [], isLoading, isError } = useConversations();
  const openDirect = useOpenDirect();
  const openGroup = useOpenGroup();

  const selected = conversations.find((c) => sameId(c.ConversationId, selectedId));
  const select = (conversationId) => setSearchParams(conversationId ? { c: conversationId } : {});

  useEffect(() => setInfoOpen(false), [selectedId]);

  const startChat = async (otherUserId) => {
    const conversation = await openDirect.mutateAsync(otherUserId).catch(() => null);
    if (conversation) select(conversation.ConversationId);
  };

  const createGroup = async ({ title, memberUserIds }) => {
    const conversation = await openGroup.mutateAsync({ title, memberUserIds }).catch(() => null);
    if (conversation) {
      setShowGroupPicker(false);
      select(conversation.ConversationId);
    }
  };
const user=readUserFromSession()
const {data:statusList=[]}=fetUserStatus()
  const statusMap=Object.fromEntries(statusList.map(s=>[s.EmployeeID?.toLowerCase(),s]))

  const selectedIsGroup=isGroupConversation(selected)

  const selectedOtherMemberId=selectedIsGroup
  ?null
  :selected?.MemberUserIds?.find(id=>!sameId(id,userId))

  const selectedStatus=selectedOtherMemberId
  ?statusMap[selectedOtherMemberId?.toLowerCase()]
  :null

  const selectedOnline=selectedStatus?.IsActive===true
  return (
    <div className="absolute inset-0 p-2">
      <div className="flex h-full bg-white border border-gray-200 rounded-lg overflow-hidden">
        <aside className={`${selectedId ? "hidden md:flex" : "flex"} w-full md:w-80 flex-col border-r border-gray-200`}>
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-800">Messages</h2>
              {!showGroupPicker && user?.role==1&&(
                <button
                  onClick={() => setShowGroupPicker(true)}
                  className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900"
                >
                  <Users size={13} /> New group
                </button>
              )}
            </div>
            {showGroupPicker && user?.role===1?(
              <NewGroupPicker
                onCreate={createGroup}
                disabled={openGroup.isPending}
                error={openGroup.isError ? "Couldn't create that group. Try again." : null}
                onCancel={() => setShowGroupPicker(false)}
              />
            ) : (
              <NewChatPicker
                onPick={startChat}
                disabled={openDirect.isPending}
                error={openDirect.isError ? "Couldn't open that chat. Try again." : null}
              />
            )}
          </div>
          <div className="flex-1 overflow-y-auto wg-scrollbar" onScroll={onListScroll}>
            <ConversationList
              conversations={conversations}
              isLoading={isLoading}
              isError={isError}
              selectedId={selectedId}
              onSelect={select}
              userId={userId}
              nameOf={nameOf}
              photoOf={photoOf}
            />
          </div>
        </aside>

        <section className={`${selectedId ? "flex" : "hidden md:flex"} flex-1 min-w-0`}>
          {selected ? (
            infoOpen ? (
              <ConversationInfoPanel
                conversation={selected}
                userId={userId}
                nameOf={nameOf}
                photoOf={photoOf}
                onClose={() => setInfoOpen(false)}
              />
            ) : (
              <div className="flex-1 flex flex-col min-h-0 min-w-0">
                <header className="px-4 py-2.5 border-b border-gray-200 flex items-center gap-3 shrink-0">
                  <button onClick={() => select(null)} className="md:hidden text-gray-500" aria-label="Back">
                    <ArrowLeft size={18} />
                  </button>
                  <button
                    onClick={() => setInfoOpen(true)}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left hover:bg-gray-50 rounded-lg -mx-1.5 px-1.5 py-1"
                  >
                    <div className="relative shrink-0"
                    title={!selectedIsGroup && selectedStatus
                      ?(selectedStatus.LogoutAt
                        ?`Last seen ${formatLastSeen(selectedStatus.LogoutAt)}`
                        :"Offline"
                      )
                      :""
                    }>
                    <ChatAvatar
                      name={conversationTitle(selected, userId, nameOf)}
                      seed={conversationAvatarSeed(selected, userId)}
                      photoUrl={conversationAvatarPhoto(selected, userId, photoOf)}
                    />
                    {!selectedIsGroup && selectedStatus &&(
              <span className={[
                "absolute bottom-0 right-0",
                "w-3.5 h-3.5 rounded-full",
                "border-2 border-white",
                selectedOnline ?"bg-green-500":"bg-red-400"
              ].join(" ")}/>
             )}
                    </div>
                   
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">{conversationTitle(selected, userId, nameOf)}</h3>
                      {!selectedIsGroup && selectedStatus &&(
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <span className={[
                            "w-1,5 h-1.5 rounded-full inline-block shrink-0",
                            selectedOnline? "bg-green-500":"bg-gray-400"
                          ].join(" ")}/>

                        {
                          selectedOnline
                          ?"Online"
                          :selectedStatus.LogoutAt
                          ?`Last seen ${formatLastSeen(selectedStatus.LogoutAt)}`
                          :"Offline"
                        }
                        </p>
                      )}
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Lock size={11} />
                        {isGroupConversation(selected)
                          ? `End-to-end encrypted · ${selected.MemberUserIds?.length ?? 0} members`
                          : "End-to-end encrypted"}
                      </p>
                    </div>
                  </button>
                </header>
                <ConversationView key={selected.ConversationId} conversation={selected} nameOf={nameOf} />
              </div>
            )
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2 px-6 text-center">
              <Lock size={28} />
              <p className="text-sm">
                {selectedId && isLoading
                  ? "Loading…"
                  : selectedId
                    ? "That conversation isn't available."
                    : "Messages are end-to-end encrypted. Select a conversation or start a new one."}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, Lock, Users } from "lucide-react";
import ChatAvatar from "../components/ChatAvatar";
import ConversationList from "../components/ConversationList";
import ConversationView from "../components/ConversationView";
import NewChatPicker from "../components/NewChatPicker";
import NewGroupPicker from "../components/NewGroupPicker";
import {
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

export default function MessengerPage() {
  const userId = useChatUserId();
  const { nameOf } = useChatPeople();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("c");
  const [showGroupPicker, setShowGroupPicker] = useState(false);

  const { data: conversations = [], isLoading, isError } = useConversations();
  const openDirect = useOpenDirect();
  const openGroup = useOpenGroup();

  const selected = conversations.find((c) => sameId(c.ConversationId, selectedId));
  const select = (conversationId) => setSearchParams(conversationId ? { c: conversationId } : {});

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

  return (
    <div className="absolute inset-0 p-2">
      <div className="flex h-full bg-white border border-gray-200 rounded-lg overflow-hidden">
        <aside className={`${selectedId ? "hidden md:flex" : "flex"} w-full md:w-80 flex-col border-r border-gray-200`}>
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-800">Messages</h2>
              {!showGroupPicker && (
                <button
                  onClick={() => setShowGroupPicker(true)}
                  className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900"
                >
                  <Users size={13} /> New group
                </button>
              )}
            </div>
            {showGroupPicker ? (
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
          <div className="flex-1 overflow-y-auto">
            <ConversationList
              conversations={conversations}
              isLoading={isLoading}
              isError={isError}
              selectedId={selectedId}
              onSelect={select}
              userId={userId}
              nameOf={nameOf}
            />
          </div>
        </aside>

        <section className={`${selectedId ? "flex" : "hidden md:flex"} flex-1 flex-col min-w-0`}>
          {selected ? (
            <>
              <header className="px-4 py-2.5 border-b border-gray-200 flex items-center gap-3">
                <button onClick={() => select(null)} className="md:hidden text-gray-500" aria-label="Back">
                  <ArrowLeft size={18} />
                </button>
                <ChatAvatar name={conversationTitle(selected, userId, nameOf)} seed={conversationAvatarSeed(selected, userId)} />
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate">{conversationTitle(selected, userId, nameOf)}</h3>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Lock size={11} />
                    {isGroupConversation(selected)
                      ? `End-to-end encrypted · ${selected.MemberUserIds?.length ?? 0} members`
                      : "End-to-end encrypted"}
                  </p>
                </div>
              </header>
              <ConversationView key={selected.ConversationId} conversation={selected} nameOf={nameOf} />
            </>
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

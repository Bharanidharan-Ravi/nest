import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Lock, Send } from "lucide-react";
import { readUserFromSession } from "../../../core/auth/useCurrentUser";
import { useMasterData } from "../../../core/master/masterCall/useMasterData";
import {
  MAX_MESSAGE_LENGTH,
  sameId,
  useChatRealtime,
  useConversations,
  useMessages,
  useOpenDirect,
  useSendMessage,
} from "../hooks/useChat";

const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const today = new Date();
  return date.toDateString() === today.toDateString()
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString([], { day: "2-digit", month: "short" });
};

export default function MessengerPage() {
  const user = useMemo(() => readUserFromSession(), []);
  const userId = user?.userId;
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("c");

  const { data: master } = useMasterData();
  const employees = master?.EmployeeList ?? [];
  const nameOf = (id) => employees.find((e) => sameId(e.UserID, id))?.UserName ?? "Unknown user";

  const { data: conversations = [], isLoading } = useConversations();
  const openDirect = useOpenDirect();
  useChatRealtime(userId);

  const selected = conversations.find((c) => sameId(c.ConversationId, selectedId));
  const otherMember = (c) => c.MemberUserIds.find((id) => !sameId(id, userId));
  const select = (conversationId) => setSearchParams(conversationId ? { c: conversationId } : {});

  const startChat = async (event) => {
    const otherId = event.target.value;
    event.target.value = "";
    if (!otherId) return;
    const conversation = await openDirect.mutateAsync(otherId);
    select(conversation.ConversationId);
  };

  if (!window.isSecureContext || !window.crypto?.subtle) {
    return (
      <div className="p-8 text-center text-gray-500">
        Secure chat needs HTTPS (or localhost). Open the app over a secure connection to use messages.
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] bg-white border border-gray-200 rounded-lg overflow-hidden m-2">
      <aside className={`${selected ? "hidden md:flex" : "flex"} w-full md:w-80 flex-col border-r border-gray-200`}>
        <div className="p-3 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Messages</h2>
          <select
            defaultValue=""
            onChange={startChat}
            disabled={openDirect.isPending}
            className="w-full text-sm px-2 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:border-gray-500"
          >
            <option value="">+ New chat…</option>
            {employees
              .filter((e) => e.Status === "Active" && !sameId(e.UserID, userId))
              .sort((a, b) => a.UserName.localeCompare(b.UserName))
              .map((e) => (
                <option key={e.UserID} value={e.UserID}>
                  {e.UserName}
                </option>
              ))}
          </select>
          {openDirect.isError && (
            <p className="text-xs text-red-600 mt-1">Couldn't open that chat. Try again.</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading && <p className="p-4 text-sm text-gray-400">Loading…</p>}
          {!isLoading && conversations.length === 0 && (
            <p className="p-4 text-sm text-gray-400">No conversations yet. Start one above.</p>
          )}
          {conversations.map((c) => (
            <button
              key={c.ConversationId}
              onClick={() => select(c.ConversationId)}
              className={[
                "w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 flex justify-between gap-2",
                sameId(c.ConversationId, selectedId) ? "bg-brand-yellow/40" : "",
              ].join(" ")}
            >
              <span className="font-medium text-gray-800 truncate">{nameOf(otherMember(c))}</span>
              <span className="text-xs text-gray-400 shrink-0">{formatTime(c.LastMessageAt)}</span>
            </button>
          ))}
        </div>
      </aside>

      <section className={`${selected ? "flex" : "hidden md:flex"} flex-1 flex-col min-w-0`}>
        {selected ? (
          <Conversation
            key={selected.ConversationId}
            conversation={selected}
            userId={userId}
            title={nameOf(otherMember(selected))}
            nameOf={nameOf}
            onBack={() => select(null)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
            <Lock size={28} />
            <p className="text-sm">Messages are end-to-end encrypted. Select or start a chat.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function Conversation({ conversation, userId, title, nameOf, onBack }) {
  const { data, isLoading, isError, error, hasNextPage, fetchNextPage, isFetchingNextPage } = useMessages(
    conversation.ConversationId,
    userId,
  );
  const send = useSendMessage(conversation, userId, nameOf);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  const messages = useMemo(() => [...(data?.pages ?? [])].reverse().flat(), [data]);
  const newestId = messages[messages.length - 1]?.MessageId;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [newestId]);

  const submit = () => {
    const value = text.trim();
    if (!value || send.isPending) return;
    send.mutate(value, { onSuccess: () => setText("") });
  };

  return (
    <>
      <header className="px-4 py-3 border-b border-gray-200 flex items-center gap-3">
        <button onClick={onBack} className="md:hidden text-gray-500 text-sm">
          ← Back
        </button>
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-800 truncate">{title}</h3>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Lock size={11} /> End-to-end encrypted
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-3 bg-gray-50 flex flex-col gap-2">
        {hasNextPage && (
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="self-center text-xs text-gray-500 hover:text-gray-800 py-1"
          >
            {isFetchingNextPage ? "Loading…" : "Load older messages"}
          </button>
        )}
        {isLoading && <p className="text-sm text-gray-400 text-center">Decrypting messages…</p>}
        {isError && <p className="text-sm text-red-600 text-center">{error?.message ?? "Couldn't load messages."}</p>}
        {!isLoading && !isError && messages.length === 0 && (
          <p className="text-sm text-gray-400 text-center mt-8">No messages yet. Say hello.</p>
        )}

        {messages.map((m) => {
          const mine = sameId(m.SenderUserId, userId);
          const result = m.decrypted;
          return (
            <div
              key={m.MessageId}
              className={[
                "max-w-[75%] rounded-lg px-3 py-2 shadow-sm",
                mine ? "self-end bg-brand-yellow text-black" : "self-start bg-white text-gray-800",
              ].join(" ")}
            >
              {result?.status === "ok" ? (
                <p className="text-sm whitespace-pre-wrap break-words">{result.body.text}</p>
              ) : (
                <p className="text-sm italic text-gray-500">
                  {result?.status === "no-key"
                    ? "This message wasn't encrypted for this browser."
                    : "This message couldn't be decrypted."}
                </p>
              )}
              <p className="text-[10px] text-gray-500 text-right mt-1">{formatTime(m.CreatedAt)}</p>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <footer className="border-t border-gray-200 p-3">
        {send.isError && (
          <p className="text-xs text-red-600 mb-2">
            {send.error?.response?.data?.errorMessage ?? send.error?.message ?? "Message not sent."}
          </p>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            maxLength={MAX_MESSAGE_LENGTH}
            rows={1}
            placeholder="Type a message"
            className="flex-1 resize-none text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-500 max-h-40"
          />
          <button
            onClick={submit}
            disabled={!text.trim() || send.isPending}
            className="h-9 w-9 flex items-center justify-center rounded-md bg-brand-yellow text-black disabled:opacity-40"
            aria-label="Send"
          >
            <Send size={16} />
          </button>
        </div>
      </footer>
    </>
  );
}

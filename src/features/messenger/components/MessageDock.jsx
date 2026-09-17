import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BellRing, ChevronDown, ChevronUp, Maximize2, MessageSquare, Minus, Users, X } from "lucide-react";
import ChatAvatar from "./ChatAvatar";
import ConversationList, { UnreadBadge } from "./ConversationList";
import ConversationView from "./ConversationView";
import NewChatPicker from "./NewChatPicker";
import NewGroupPicker from "./NewGroupPicker";
import { useCurrentUser } from "../../../core/auth/useCurrentUser";
import { ROUTE_ROLES } from "../../../core/auth/permissions";
import { PATHS } from "../../../core/routing/paths";
import {
  conversationAvatarSeed,
  conversationTitle,
  sameId,
  useChatPeople,
  useChatRealtime,
  useChatUserId,
  useConversations,
  useOpenDirect,
  useOpenGroup,
  useUnreadTotal,
} from "../hooks/useChat";
import { useChatUiStore } from "../state/useChatUiStore";

const NOTIFICATION_MS = 6000;

/**
 * The message bar docked at the bottom of every screen: unread badge, conversation
 * list, mini chat windows and "new message" pop-ups. Also hosts the app-wide chat
 * realtime listener, so it must stay mounted for the whole session.
 */
export default function MessageDock() {
  const { can } = useCurrentUser();
  if (!can(ROUTE_ROLES.MESSENGER)) return null;
  return <Dock />;
}

function Dock() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const userId = useChatUserId();
  const { nameOf } = useChatPeople();
  useChatRealtime({ nameOf });

  const { data: conversations = [], isLoading, isError } = useConversations();
  const unreadTotal = useUnreadTotal();
  const openDirect = useOpenDirect();
  const openGroup = useOpenGroup();
  const [showGroupPicker, setShowGroupPicker] = useState(false);

  const dockOpen = useChatUiStore((s) => s.dockOpen);
  const windows = useChatUiStore((s) => s.windows);
  const toggleDock = useChatUiStore((s) => s.toggleDock);
  const openWindow = useChatUiStore((s) => s.openWindow);

  // Reset the dock when the session ends (MainLayout unmounts on logout)
  useEffect(() => () => useChatUiStore.getState().reset(), []);

  const onMessagesPage = pathname.replace(/\/+$/, "").endsWith(PATHS.MESSENGER);

  const openConversation = (conversationId) => {
    if (onMessagesPage) navigate(`${PATHS.MESSENGER}?c=${conversationId}`);
    else openWindow(conversationId);
  };

  const startChat = async (otherUserId) => {
    const conversation = await openDirect.mutateAsync(otherUserId).catch(() => null);
    if (conversation) openConversation(conversation.ConversationId);
  };

  const createGroup = async ({ title, memberUserIds }) => {
    const conversation = await openGroup.mutateAsync({ title, memberUserIds }).catch(() => null);
    if (conversation) {
      setShowGroupPicker(false);
      openConversation(conversation.ConversationId);
    }
  };

  const openFullView = (conversationId) => {
    useChatUiStore.getState().closeDock();
    if (conversationId) useChatUiStore.getState().closeWindow(conversationId);
    navigate(conversationId ? `${PATHS.MESSENGER}?c=${conversationId}` : PATHS.MESSENGER);
  };

  return (
    <>
      <NotificationStack nameOf={nameOf} onOpen={openConversation} raised={!onMessagesPage} />

      {/* The Messages page already shows everything the bar would */}
      {!onMessagesPage && (
        <div className="fixed bottom-0 right-2 sm:right-4 z-[1200] flex flex-row-reverse items-end gap-2 pointer-events-none">
          <section
            className={[
              "pointer-events-auto bg-white border border-gray-200 shadow-2xl flex flex-col",
              dockOpen
                ? "fixed inset-0 sm:static sm:w-80 sm:h-[480px] sm:rounded-t-lg"
                : "w-auto sm:w-72 rounded-t-lg",
            ].join(" ")}
          >
            <button
              onClick={toggleDock}
              className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 hover:bg-gray-50 sm:rounded-t-lg"
              aria-expanded={dockOpen}
            >
              <span className="relative">
                <MessageSquare size={18} className="text-gray-700" />
                {unreadTotal > 0 && <UnreadBadge count={unreadTotal} className="absolute -top-2 -right-2.5 sm:hidden" />}
              </span>
              <span className={`${dockOpen ? "" : "hidden sm:inline"} font-semibold text-sm text-gray-800`}>Messaging</span>
              <span className="flex-1" />
              <UnreadBadge count={unreadTotal} className="hidden sm:flex" />
              <span className={dockOpen ? "" : "hidden sm:inline"}>
                {dockOpen ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronUp size={16} className="text-gray-500" />}
              </span>
            </button>

            {dockOpen && (
              <>
                <div className="p-2 border-b border-gray-100">
                  {showGroupPicker ? (
                    <NewGroupPicker
                      onCreate={createGroup}
                      disabled={openGroup.isPending}
                      error={openGroup.isError ? "Couldn't create that group. Try again." : null}
                      onCancel={() => setShowGroupPicker(false)}
                    />
                  ) : (
                    <>
                      <NewChatPicker
                        onPick={startChat}
                        disabled={openDirect.isPending}
                        error={openDirect.isError ? "Couldn't open that chat. Try again." : null}
                      />
                      <button
                        onClick={() => setShowGroupPicker(true)}
                        className="mt-1.5 flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900"
                      >
                        <Users size={13} /> New group
                      </button>
                    </>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto min-h-0">
                  <ConversationList
                    conversations={conversations}
                    isLoading={isLoading}
                    isError={isError}
                    onSelect={openConversation}
                    userId={userId}
                    nameOf={nameOf}
                  />
                </div>
                <DesktopAlertsPrompt />
                <button
                  onClick={() => openFullView(null)}
                  className="px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-t border-gray-100"
                >
                  Open full Messages view
                </button>
              </>
            )}
          </section>

          {windows.map((w, index) => {
            const conversation = conversations.find((c) => sameId(c.ConversationId, w.conversationId));
            if (!conversation) return null;
            return (
              <ChatWindow
                key={w.conversationId}
                conversation={conversation}
                minimized={w.minimized}
                // Phones only have room for the newest window
                hiddenOnMobile={index !== windows.length - 1}
                userId={userId}
                nameOf={nameOf}
                onExpand={() => openFullView(conversation.ConversationId)}
              />
            );
          })}
        </div>
      )}
    </>
  );
}

function ChatWindow({ conversation, minimized, hiddenOnMobile, userId, nameOf, onExpand }) {
  const toggleMinimized = useChatUiStore((s) => s.toggleMinimized);
  const closeWindow = useChatUiStore((s) => s.closeWindow);
  const id = conversation.ConversationId;
  const title = conversationTitle(conversation, userId, nameOf);

  return (
    <section
      className={[
        "pointer-events-auto bg-white border border-gray-200 shadow-2xl flex flex-col",
        hiddenOnMobile ? "hidden sm:flex" : "",
        minimized ? "w-60 sm:w-64 rounded-t-lg" : "fixed inset-0 sm:static sm:w-80 sm:h-[480px] sm:rounded-t-lg",
      ].join(" ")}
    >
      <header className="flex items-center gap-2 px-2.5 py-2 border-b border-gray-100">
        <button onClick={() => toggleMinimized(id)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
          <ChatAvatar name={title} seed={conversationAvatarSeed(conversation, userId)} size="sm" />
          <span className="truncate text-sm font-semibold text-gray-800">{title}</span>
          {minimized && <UnreadBadge count={conversation.UnreadCount} />}
        </button>
        <button onClick={onExpand} className="p-1 text-gray-500 hover:text-gray-900" aria-label="Open in Messages" title="Open in Messages">
          <Maximize2 size={14} />
        </button>
        <button
          onClick={() => toggleMinimized(id)}
          className="p-1 text-gray-500 hover:text-gray-900"
          aria-label={minimized ? "Expand" : "Minimize"}
          title={minimized ? "Expand" : "Minimize"}
        >
          {minimized ? <ChevronUp size={15} /> : <Minus size={15} />}
        </button>
        <button onClick={() => closeWindow(id)} className="p-1 text-gray-500 hover:text-gray-900" aria-label="Close" title="Close">
          <X size={15} />
        </button>
      </header>

      {!minimized && <ConversationView conversation={conversation} nameOf={nameOf} compact />}
    </section>
  );
}

function NotificationStack({ nameOf, onOpen, raised }) {
  const notifications = useChatUiStore((s) => s.notifications);
  if (!notifications.length) return null;

  return (
    <div
      className={`fixed right-2 sm:right-4 ${raised ? "bottom-14" : "bottom-4"} z-[1210] flex flex-col gap-2 w-[min(20rem,calc(100vw-1rem))]`}
      aria-live="polite"
    >
      {notifications.map((n) => (
        <NotificationCard key={n.id} notification={n} nameOf={nameOf} onOpen={onOpen} />
      ))}
    </div>
  );
}

function NotificationCard({ notification, nameOf, onOpen }) {
  const dismiss = useChatUiStore((s) => s.dismissNotification);
  const [hovered, setHovered] = useState(false);
  const sender = nameOf(notification.senderUserId);

  useEffect(() => {
    if (hovered) return;
    const timer = setTimeout(() => dismiss(notification.id), NOTIFICATION_MS);
    return () => clearTimeout(timer);
  }, [hovered, notification.id, dismiss]);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="bg-white border border-gray-200 border-l-4 border-l-brand-yellow rounded-lg shadow-xl flex items-start gap-2 p-2.5"
    >
      <button
        onClick={() => {
          dismiss(notification.id);
          onOpen(notification.conversationId);
        }}
        className="flex items-start gap-2 flex-1 min-w-0 text-left"
      >
        <ChatAvatar name={sender} seed={notification.senderUserId} size="sm" />
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-gray-900 truncate">{sender}</span>
          <span className="block text-xs text-gray-600 line-clamp-2 break-words">{notification.text || "New message"}</span>
        </span>
      </button>
      <button onClick={() => dismiss(notification.id)} className="p-0.5 text-gray-400 hover:text-gray-700" aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
}

/** Offers browser notifications (for when WGNest is in a background tab) until the user decides. */
function DesktopAlertsPrompt() {
  const supported = typeof Notification !== "undefined";
  const [permission, setPermission] = useState(supported ? Notification.permission : "denied");
  if (permission !== "default") return null;

  const enable = async () => {
    try {
      setPermission(await Notification.requestPermission());
    } catch {
      setPermission("denied");
    }
  };

  return (
    <button
      onClick={enable}
      className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 border-t border-gray-100"
    >
      <BellRing size={13} /> Turn on desktop alerts for new messages
    </button>
  );
}

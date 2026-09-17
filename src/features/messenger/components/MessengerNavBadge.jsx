import { UnreadBadge } from "./ConversationList";
import { useUnreadTotal } from "../hooks/useChat";

/** Unread count next to "Messages" in the sidebar. */
export default function MessengerNavBadge() {
  const unread = useUnreadTotal();
  return <UnreadBadge count={unread} className="ml-auto" />;
}

import { Lock, Loader2 } from "lucide-react";
import { readUserFromSession } from "../../../core/auth/useCurrentUser";
import { CHAT_IDENTITY_STATUS, useChatIdentityStore } from "../e2ee/chatIdentityStore";

const S = CHAT_IDENTITY_STATUS;

/** Shown in place of a timeline while this browser can't read messages yet. Renders nothing when ready. */
export default function ChatLockedNotice({ compact = false }) {
  const status = useChatIdentityStore((s) => s.status);
  const error = useChatIdentityStore((s) => s.error);
  const openUnlock = useChatIdentityStore((s) => s.openUnlock);

  if (status === S.READY) return null;

  const retry = () => {
    const userId = readUserFromSession()?.userId;
    if (!userId) return;
    const store = useChatIdentityStore.getState();
    store.reset();
    store.restoreSession({ userId });
  };

  let icon = <Lock size={compact ? 22 : 28} className="text-gray-400" />;
  let text;
  let action = null;

  switch (status) {
    case S.IDLE:
    case S.INITIALIZING:
      icon = <Loader2 size={compact ? 22 : 28} className="text-gray-400 animate-spin" />;
      text = "Setting up secure chat…";
      break;
    case S.LOCKED_NEED_PASSWORD:
    case S.LOCKED_NEED_RECOVERY:
      text =
        status === S.LOCKED_NEED_RECOVERY
          ? "Your password changed. Enter your recovery code to read and send messages."
          : "Secure chat is locked in this browser. Unlock it to read and send messages.";
      action = { label: "Unlock secure chat", onClick: openUnlock };
      break;
    case S.UNSUPPORTED:
      text = "Secure chat needs HTTPS (or localhost). Open WGNest over a secure connection to use messages.";
      break;
    default:
      text = error ?? "Secure chat is unavailable right now.";
      action = { label: "Try again", onClick: retry };
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 px-6 py-8">
      {icon}
      <p className={`${compact ? "text-xs" : "text-sm"} text-gray-500 max-w-xs`}>{text}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-3 py-1.5 rounded-md bg-brand-yellow text-black text-sm font-medium hover:brightness-95"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

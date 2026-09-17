import { useEffect } from "react";
import { readUserFromSession } from "../../../core/auth/useCurrentUser";
import { CHAT_IDENTITY_STATUS, useChatIdentityStore } from "../e2ee/chatIdentityStore";

/**
 * Mounted once in App. Restores the chat key state when a session already
 * exists (page reload) and clears it when the session ends. Fresh logins are
 * handled by the login page calling initializeAfterLogin with the password.
 */
export function useChatIdentitySession(token) {
  useEffect(() => {
    const store = useChatIdentityStore.getState();
    if (!token) {
      store.reset();
      return;
    }

    const user = readUserFromSession();
    if (user?.userId) store.restoreSession({ userId: user.userId });
  }, [token]);
}

/** Current chat identity state and actions, for any component. */
export default function useChatIdentity() {
  const status = useChatIdentityStore((s) => s.status);
  const error = useChatIdentityStore((s) => s.error);
  const openUnlock = useChatIdentityStore((s) => s.openUnlock);

  return {
    status,
    error,
    isReady: status === CHAT_IDENTITY_STATUS.READY,
    isLocked:
      status === CHAT_IDENTITY_STATUS.LOCKED_NEED_PASSWORD ||
      status === CHAT_IDENTITY_STATUS.LOCKED_NEED_RECOVERY,
    openUnlock,
  };
}

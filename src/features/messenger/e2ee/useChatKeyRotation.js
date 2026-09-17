import { useEffect } from "react";
import Bowser from "bowser";
import { readUserFromSession } from "../../../core/auth/useCurrentUser";
import { chatKeysApi } from "./chatKeys.api";
import { indexedDbKeyStore } from "./keyStore";
import { ensureChatKeys, withUserKeyLock } from "./keyManager";

// Rotation is weekly; checking hourly keeps long-open tabs from missing it
const CHECK_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Creates this device's chat keys after login and rotates the signed pre-key
 * every 7 days. Runs whenever the auth token changes and hourly while open.
 */
export default function useChatKeyRotation(token) {
  useEffect(() => {
    if (!token) return;

    // WebCrypto + IndexedDB need a secure context (https or localhost)
    if (!window.isSecureContext || !window.crypto?.subtle || !window.indexedDB) {
      console.warn("[E2EE] Secure context not available — chat keys not created.");
      return;
    }

    const user = readUserFromSession();
    if (!user?.userId) return;

    const deviceInfo = JSON.stringify(Bowser.getParser(window.navigator.userAgent).parsedResult);

    const check = () =>
      withUserKeyLock(user.userId, () =>
        ensureChatKeys({
          userId: user.userId,
          api: chatKeysApi,
          store: indexedDbKeyStore,
          deviceInfo,
        }),
      ).catch((err) => console.error("[E2EE] Key check failed", err));

    check();
    const timer = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [token]);
}

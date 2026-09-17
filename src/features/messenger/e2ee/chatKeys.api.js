import { executeApi } from "../../../core/api/executor";

// Background calls: no global loader, and no global error toast — the chat
// identity store handles failures itself (a 404 on getMine is normal on first login)
const background = { _silent: true, _noErrorToast: true };

export const chatKeysApi = {
  /** The logged-in user's key bundle. Rejects with a 404 axios error if none is registered. */
  getMine: () =>
    executeApi({ url: "/ChatKeys/me", method: "GET", config: background }),

  /** First-time registration. Body: { PublicKey, WrappedByPassword, PasswordSalt, WrappedByRecovery, RecoverySalt } */
  register: (registration) =>
    executeApi({ url: "/ChatKeys/me", method: "POST", payload: registration, config: background }),

  /** Re-wrap under a new password. Body: { WrappedByPassword, PasswordSalt, KeyVersion } */
  rewrap: (rewrap) =>
    executeApi({ url: "/ChatKeys/rewrap", method: "POST", payload: rewrap, config: background }),

  // ASP.NET Core's [FromQuery] List<Guid> binds "userIds=a&userIds=b", not axios's
  // default "userIds[]=a&userIds[]=b" — build the query string ourselves to match.
  getParticipantKeys: (userIds) => {
    const query = new URLSearchParams();
    userIds.forEach((id) => query.append("userIds", id));
    return executeApi({
      url: `/ChatKeys/participants?${query.toString()}`,
      method: "GET",
      config: background,
    });
  },
};

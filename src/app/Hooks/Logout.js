import { executeApi } from "../../core/api/executor";
import { logoutUser } from "../../core/auth/authUtils";
import { readUserFromSession } from "../../core/auth/useCurrentUser";
import { useNavigate } from "react-router-dom";
import { useChatIdentityStore } from "../../features/messenger/e2ee/chatIdentityStore";

export const handleLogout = async () => {
  const user = readUserFromSession();
  try {
    // Remove this user's chat key from the browser (shared computers); the next
    // login unwraps it again with the password
    await useChatIdentityStore.getState().forgetLocalKey(user?.userId);
  } catch {
    // never block logout
  }
  try {
    if (user?.sessionId) {
      await executeApi({
        url: "/Login/logout",
        method: "POST",
        payload: {
          sessionId: user.sessionId,
        },
      })
    }
  } catch (err) {

  } finally {
    logoutUser();
  }
}
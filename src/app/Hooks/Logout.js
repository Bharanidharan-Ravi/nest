import { executeApi } from "../../core/api/executor";
import { logoutUser } from "../../core/auth/authUtils";
import { readUserFromSession } from "../../core/auth/useCurrentUser";
import { useNavigate } from "react-router-dom";

export const handleLogout = async () => {
  try {
    const user = readUserFromSession();
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
import { executeApi } from "../../core/api/executor";
import { logoutUser } from "../../core/auth/authUtils";
import { readUserFromSession } from "../../core/auth/useCurrentUser";

 const user = readUserFromSession();
export const handleLogout = async () => {
    // const user = readUserFromSession();

    await executeApi({
      url: "/Login/logout",
      method: "POST",
      payload: {
        sessionId: user.sessionId,
      },
    });
    logoutUser();
    // navigate("/");
  };
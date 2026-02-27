import { Navigate, Outlet } from "react-router-dom"
import { decryptUserInfo } from "../../app/shared/decryption/Decryption";

export default function AuthGuard() {
  const userData = sessionStorage.getItem("user");

  if (!userData) {
    return <Navigate to="/login" replace />
  }

  try {
    const parsedUser = JSON.parse(userData);
    const decryptedUser = decryptUserInfo(parsedUser);
    const jwtToken = Array.isArray(decryptedUser)
      ? decryptedUser[0]?.JwtToken
      : decryptedUser?.JwtToken;

    if (!jwtToken) {
      sessionStorage.removeItem("user");
      return <Navigate to="/login" replace />
    }
  } catch {
    sessionStorage.removeItem("user");
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

import { Navigate, Outlet } from "react-router-dom";
import { decryptUserInfo } from "../../app/shared/decryption/Decryption";
import { isTokenExpired, logoutUser } from "./authUtils";

export default function AuthGuard() {
  const userData = sessionStorage.getItem("user");

  if (!userData) {
    return <Navigate to="/login" replace />;
  }

  try {
    const parsedUser = JSON.parse(userData);
    const decryptedUser = decryptUserInfo(parsedUser);
    const jwtToken = Array.isArray(decryptedUser)
      ? decryptedUser[0]?.JwtToken
      : decryptedUser?.JwtToken;

    if (!jwtToken || isTokenExpired(jwtToken)) {
      logoutUser();
      return null; // Prevents flashing content before redirect
    }
  } catch (error) {
    console.error("Auth validation failed", error);
    logoutUser();
    return null;
  }

  return <Outlet />;
}
import { Navigate } from "react-router-dom";
import { decryptUserInfo } from "../../app/shared/decryption/Decryption";

export default function RoleGuard({ allowedRoles = [], children }) {
  // If no roles are specified, assume the route is open to any authenticated user
  if (!allowedRoles || allowedRoles.length === 0) {
    return children;
  }

  const userData = sessionStorage.getItem("user");
  let userRoles = [];

  try {
    const parsedUser = JSON.parse(userData);
    const decryptedUser = decryptUserInfo(parsedUser);
    
    // Assuming your decrypted user object holds an array of roles or a single role string
    const rolesData = Array.isArray(decryptedUser) 
        ? decryptedUser[0]?.Role 
        : decryptedUser?.Role;

    userRoles = Array.isArray(rolesData) ? rolesData : [rolesData];
    console.log("User Roles:", userRoles, "Allowed Roles:", allowedRoles, "decryptedUser[0]:", decryptedUser[0]);
    
  } catch (error) {
    console.error("Failed to parse roles for authorization", error);
    return <Navigate to="/login" replace />;
  }

  const hasAccess = allowedRoles.some((role) => userRoles.includes(role));

  if (!hasAccess) {
    // Redirect to a 403 Forbidden page, or back to dashboard
    return <Navigate to="/" replace />; 
  }

  return children;
}
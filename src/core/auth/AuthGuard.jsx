import { useAppStore } from "../state/useAppStore"
import { Navigate, Outlet } from "react-router-dom"

export default function AuthGuard() {
  // const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const userData = sessionStorage.getItem('user');
  
  if (!userData) {
    return <Navigate to="/login" />
  }

   return <Outlet />
}

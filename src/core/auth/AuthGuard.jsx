import { useAppStore } from "../state/useAppStore"
import { Navigate } from "react-router-dom"

export default function AuthGuard({ children }) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  return children
}

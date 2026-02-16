import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"

export default function MainLayout() {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ flex: 1, padding: 20 }}>
        <Outlet />
      </div>
    </div>
  )
}

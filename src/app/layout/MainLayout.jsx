import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Footer from "../shared/Footer/Footer";
import Header from "../shared/Header/Header";

export default function MainLayout() {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100vw" }}
    >
      <Header />
      <div style={{ display: "flex", flex: 1 }}>
        <Sidebar />
        <div style={{ flex: 1, padding: 20 }}>
          <Outlet />
        </div>
      </div>
      <Footer />
    </div>
  );
}

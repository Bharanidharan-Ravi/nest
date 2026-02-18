import { Outlet, useParams } from "react-router-dom";
import Sidebar from "./Sidebar";
import Footer from "../shared/Footer/Footer";
import Header from "../shared/Header/Header";
import Breadcrumbs from "../../core/navigation/Breadcrumbs";
import { useTicketMaster } from "../../features/tickets/hooks/useTicketMaster";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../core/query/queryKeys";
import { useState } from "react";

export default function MainLayout() {
  const [openSidebar, setOpenSidebar] = useState(false);

  const toggleMobileMenu = () => {
    // Implement mobile menu toggle logic here
    console.log("Toggle mobile menu");
    setOpenSidebar((prev) => !prev);
  };
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        width: "100vw",
      }}
    >
      <Header toggleMobileMenu={toggleMobileMenu} />

      <div style={{ display: "flex", flex: 1 }}>
        <Sidebar isOpen={openSidebar} onClose={() => setOpenSidebar(false)} />
        <div style={{ flex: 1, padding: 20 }}>
          <Outlet />
        </div>
      </div>
      <Footer />
    </div>
  );
}

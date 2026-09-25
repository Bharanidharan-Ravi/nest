import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import Footer from "../shared/Footer/Footer";
import Header from "../shared/Header/Header";
import { useState } from "react";
import MessageDock from "../../features/messenger/components/MessageDock";

export default function MainLayout() {
  const [openSidebar, setOpenSidebar] = useState(false);
  const {pathname} = useLocation();

  const toggleSidebar = () => {
    setOpenSidebar((prev) => !prev);
  };
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-brand-gray-light">
      {/* 1. Sidebar is a full-height column of its own, so the header/banner
             to its right never runs behind it */}
      <Sidebar
        isOpen={openSidebar}
        onClose={() => setOpenSidebar(false)}
        onToggle={toggleSidebar}
      />

      <div className="flex flex-col flex-1 h-screen overflow-hidden">
        {/* 2. Header stays fixed at the top (flex-none prevents it from shrinking) */}
        <div className="flex-none">
          <Header />
        </div>

        {/* 3. Middle section takes up remaining space */}
        <div className="flex flex-1 overflow-hidden relative">
          <div className="container mx-auto bg-white flex flex-col h-full w-full shadow-lg overflow-hidden relative">
            {/* 4. The main content area is now a flex container that passes height down */}
            <main key={pathname} id="main-scroll-container" className="flex-1 overflow-y-auto bg-brand-gray-light wg-scrollbar relative">
              <Outlet />
            </main>
          </div>
        </div>

        {/* 5. Footer stays fixed at bottom */}
        <div className="flex-none">
          <Footer />
        </div>
      </div>

      {/* Message bar docked at the bottom of every screen */}
      <MessageDock />
    </div>
  );
}

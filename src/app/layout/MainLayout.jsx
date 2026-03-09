import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import Footer from "../shared/Footer/Footer";
import Header from "../shared/Header/Header";
import { useState } from "react";

export default function MainLayout() {
  const [openSidebar, setOpenSidebar] = useState(false);

  const toggleMobileMenu = () => {
    setOpenSidebar((prev) => !prev);
  };
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-brand-gray-light">
      {/* 2. Header stays fixed at the top (flex-none prevents it from shrinking) */}
      <div className="flex-none">
        <Header toggleMobileMenu={toggleMobileMenu} />
      </div>

      {/* 3. Middle section takes up remaining space */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={openSidebar} onClose={() => setOpenSidebar(false)} />
        <div className="container mx-auto bg-white flex flex-col h-screen shadow-lg overflow-hidden relative">
          {/* 4. The main content area is now a flex container that passes height down */}
          <main className="flex-1 flex flex-col overflow-auto wg-scrollbar p-3">
            <Outlet />
          </main>
        </div>
      </div>

      {/* 5. Footer stays fixed at bottom */}
      <div className="flex-none">
        <Footer />
      </div>
    </div>
  );
}

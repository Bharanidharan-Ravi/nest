import React, { useState } from "react";
import { ListLayout } from "../../../packages/ui-List/components/ListLayout";
import { ListProvider } from "../../../packages/ui-List/components/ListProvider";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";

export default function ModuleSwitcher({ modules, hideCreateAction = false }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const handleTicketCreate = () => {
    if (location.pathname !== "/tickets/create") {
      navigate("/tickets/create");
    }
  };

  // 1. Read the active module from the URL
  const currentModule = searchParams.get("module");

  // ?? FIX 2: The Enforcer
  // If there is no module in the URL, instantly append the first module's ID
  // (which is "tickets") and replace the history state so the back button still works.
  useEffect(() => {
    if (!currentModule && modules.length > 0) {
      setSearchParams({ module: modules[0].id }, { replace: true });
    }
  }, [currentModule, modules, setSearchParams]);

  // 3. Render logic (Fallback to the first module instantly to prevent UI flickering)
  const activeModuleId = currentModule || modules[0]?.id;
  const activeModule =
    modules.find((mod) => mod.id === activeModuleId) || modules[0];

  const handleTabSwitch = (moduleId) => {
    setSearchParams({ module: moduleId }, { replace: true });
  };

  return (
    <div
      className="module-switcher-container"
      style={{ display: "flex", flexDirection: "column", height: "100%" }}
    >
      {/* Tab Navigation Area */}

      <div
        className="custom-module-tabs"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          // height:"50px",
          display: "flex",
          gap: "8px",
          padding: "10px 15px",
          backgroundColor: "#f8f9fa",
          borderBottom: "1px solid #e0e0e0",
          borderRadius: "8px 8px 0 0",
        }}
      >
        {modules.map((module) => (
          <button
            key={module.id}
            onClick={() => handleTabSwitch(module.id)}
            style={{
              padding: "6px 16px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
              // Mimic the active/inactive state of the "Open" tab in your UI
              backgroundColor:
                activeModuleId === module.id ? "#e2e3e5" : "transparent",
              color: activeModuleId === module.id ? "#000" : "#666",
              transition: "all 0.2s ease",
            }}
          >
            {module.label}
          </button>
        ))}
        {!hideCreateAction && (
          <button
            onClick={handleTicketCreate}
            style={{ marginLeft: "auto" }}
            className="bg-brand-yellow text-white px-4 py-2 rounded-md font-medium hover:bg-yellow-500 transition-colors"
          >
            Create New Ticket
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="active-list-wrapper" style={{ flex: 1, minHeight: 0 }}>
        {activeModule && (
          <ListProvider
            key={activeModule.id} // Key forces a re-render when switching tabss
            config={activeModule.config}
            data={activeModule.data}
          >
            <ListLayout />
          </ListProvider>
        )}
      </div>
    </div>
  );
}

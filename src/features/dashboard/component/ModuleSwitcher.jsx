import React, { useState } from "react";
import { ListLayout } from "../../../packages/ui-List/components/ListLayout";
import { ListProvider } from "../../../packages/ui-List/components/ListProvider";

export default function ModuleSwitcher({ modules }) {
  // Default to the first module in the array
  const [activeModuleId, setActiveModuleId] = useState(modules[0]?.id);
  
  // Find the configuration for the currently selected tab
  const activeModule = modules.find((mod) => mod.id === activeModuleId);

  return (
    <div className="module-switcher-container">
      {/* Tab Navigation Area */}
      <div
        className="custom-module-tabs"
        style={{
          display: "flex",
          gap: "8px",
          padding: "10px 15px",
          backgroundColor: "#f8f9fa", // Match your existing grey theme
          borderBottom: "1px solid #e0e0e0",
          borderRadius: "8px 8px 0 0",
        }}
      >
        {modules.map((module) => (
          <button
            key={module.id}
            onClick={() => setActiveModuleId(module.id)}
            style={{
              padding: "6px 16px",
              borderRadius: "20px",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
              // Mimic the active/inactive state of the "Open" tab in your UI
              backgroundColor: activeModuleId === module.id ? "#e2e3e5" : "transparent",
              color: activeModuleId === module.id ? "#000" : "#666",
              transition: "all 0.2s ease",
            }}
          >
            {module.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="active-list-wrapper">
        {activeModule && (
          <ListProvider
            key={activeModule.id} // Key forces a re-render when switching tabs
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
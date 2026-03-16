import React, { useState } from "react";
import { ListLayout } from "../../../packages/ui-List/components/ListLayout";
import { ListProvider } from "../../../packages/ui-List/components/ListProvider";

export default function ModuleSwitcher({ modules }) {
  // Set the default active tab to the first module in your config
  const [activeModuleId, setActiveModuleId] = useState(modules[0].id);

  // Find the config and data for the currently selected module
  const activeModule = modules.find((mod) => mod.id === activeModuleId);

  return (
    <div className="module-switcher-container">
      
      {/* 🔥 The Custom Top-Level Tabs */}
      {/* You can apply CSS here to make this look exactly like the grey toolbar in your screenshot */}
      <div 
        className="custom-module-tabs" 
        style={{ 
          display: "flex", 
          gap: "8px", 
          padding: "10px 15px", 
          backgroundColor: "#f8f9fa", // Match your existing grey
          borderBottom: "1px solid #e0e0e0",
          borderRadius: "8px 8px 0 0" 
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
              // Mimic the active/inactive state of the "Open" tab in your image
              backgroundColor: activeModuleId === module.id ? "#e2e3e5" : "transparent",
              color: activeModuleId === module.id ? "#000" : "#666",
            }}
          >
            {module.label}
          </button>
        ))}
      </div>

      {/* 🔥 Render the currently selected ListProvider */}
      <div className="active-list-wrapper">
        {/* We use 'key' here to force React to completely unmount and remount 
            the ListProvider when switching tabs. This prevents filters from 
            bleeding over from one config to another. */}
        <ListProvider 
          key={activeModule.id} 
          config={activeModule.config} 
          data={activeModule.data}
        >
          <ListLayout />
        </ListProvider>
      </div>

    </div>
  );
}
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "../features/auth/pages/login";
import AuthGuard from "../core/auth/AuthGuard";
import RouteRenderer from "../core/routing/RouteRenderer";
import { bootstrapApp } from "./bootstrap";
import { useEffect } from "react";

import Dashboard from "../features/dashboard/pages/Dashboard";
import { useRef } from "react";

function App() {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      bootstrapApp();
      initialized.current = true;
    }
  }, []);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* Protected */}
        <Route
          path="/*"
          element={
            // <AuthGuard>
            <RouteRenderer />
            // </AuthGuard>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

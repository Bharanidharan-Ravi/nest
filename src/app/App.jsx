import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AuthGuard from "../core/auth/AuthGuard";
import RouteRenderer from "../core/routing/RouteRenderer";
import "./App.css";

import LoginPage from "../features/auth/pages/loginPage";
import MainLayout from "./layout/MainLayout";
import RouteDataLoader from "../core/routing/RouteDataLoader";
import AppBootstrap from "../core/master/AppBootstrap";
import { GlobalUI } from "./shared/GlobalUI/GlobalUI";
import DND from "../features/auth/pages/login";
import useHeartbeat from "../core/auth/hooks/useHeartbeat";
import { useRealtimeSync } from "../core/realtime/useRealtimeSync";

function App() {
  useHeartbeat();

  useRealtimeSync(() => {
    return sessionStorage.getItem("user");
  });

  return (
    <BrowserRouter>
      <GlobalUI />

      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/Dnd" element={<DND />} />

        <Route element={<AuthGuard />}>
          <Route element={<AppBootstrap />}>
            <Route element={<RouteDataLoader />}>
              <Route element={<MainLayout />}>
                {RouteRenderer()}
              </Route>
            </Route>
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
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
import { useAppStore } from "../core/state/useAppStore";
import VersionUpdateDialog from "./shared/GlobalUI/VersionUpdateDialog";

function App() {
  useHeartbeat();
  const token = useAppStore((s) => s.token);

  useRealtimeSync(token);

  const isTestEnv = window.location.pathname.startsWith("/test");
  return (
    <BrowserRouter basename={isTestEnv ? "/test" : "/"}>
      <GlobalUI />
      <VersionUpdateDialog />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/Dnd" element={<DND />} />

        <Route element={<AuthGuard />}>
          <Route element={<AppBootstrap />}>
            <Route element={<RouteDataLoader />}>
              <Route element={<MainLayout />}>{RouteRenderer()}</Route>
            </Route>
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

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
import { useChatIdentitySession } from "../features/messenger/hooks/useChatIdentity";
import ChatIdentityModals from "../features/messenger/components/ChatIdentityModals";
import { getBasePath } from "../core/env/environment";

function App() {
  const token = useAppStore((s) => s.token);
  useHeartbeat(token);

  useRealtimeSync(token);
  useChatIdentitySession(token);

  return (
    // unstable_useTransitions={false}: by default react-router (v7) commits
    // every navigation inside React.startTransition, i.e. as low-priority
    // work. The URL changes at once but the screen keeps showing the old page
    // until the new one has fully rendered. Navigate at normal priority so the
    // UI follows the URL immediately.
    <BrowserRouter
      basename={getBasePath() || "/"}
      unstable_useTransitions={false}
    >
      <GlobalUI />
      <VersionUpdateDialog />
      <ChatIdentityModals />
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

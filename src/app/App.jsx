import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AuthGuard from "../core/auth/AuthGuard";
import RouteRenderer from "../core/routing/RouteRenderer";
import { useEffect } from "react";
import "./App.css";

import LoginPage from "../features/auth/pages/loginPage";
import MainLayout from "./layout/MainLayout";
import RouteDataLoader from "../core/routing/RouteDataLoader";
import AppBootstrap from "../core/master/AppBootstrap";
import { useQueryClient } from "@tanstack/react-query";
import {
  connectSignalR,
  disconnectSignalR,
} from "../core/realtime/realtimeManager";
import { handleRealtimeMessage } from "../core/realtime/realtimeDispatcher";
import { GlobalUI } from "./shared/GlobalUI/GlobalUI";
import DND from "../features/auth/pages/login";

function App() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const user = sessionStorage.getItem("user");
    if (!user) return;

    try {
      const parsedUser = JSON.parse(user);
          // const userData = decryptUserInfo(parsedUser);
          // const jwtToken = Array.isArray(userData)
          //   ? userData[0]?.JwtToken
          //   : userData?.JwtToken;

      if (!parsedUser) return;

      connectSignalR(parsedUser, (message) => {
        handleRealtimeMessage(queryClient, message);
      });

      return () => {
        disconnectSignalR();
      };
    } catch (error) {
      console.error("Realtime bootstrap failed:", error);
    }
  }, [queryClient]);

  return (
    <BrowserRouter>
      <GlobalUI />
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

// function App() {
//   const initialized = useRef(false);

//   // useEffect(() => {
//   //   if (!initialized.current) {
//   //     bootstrapApp();
//   //     initialized.current = true;
//   //   }
//   // }, []);
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="/login" element={<LoginPage />} />
//         {/* Protected */}
//         <Route
//           path="/*"
//           element={
//             // <AuthGuard>
//             <RouteRenderer />
//             // </AuthGuard>
//           }
//         />

//         {/* Fallback */}
//         <Route path="*" element={<Navigate to="/login" />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }

// export default App;

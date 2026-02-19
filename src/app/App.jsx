import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "../features/auth/pages/login";
import AuthGuard from "../core/auth/AuthGuard";
import RouteRenderer from "../core/routing/RouteRenderer";
import { bootstrapApp } from "./bootstrap";
import { useEffect } from "react";
import "./App.css";

import Dashboard from "../features/dashboard/pages/Dashboard";
import { useRef } from "react";
import LoginPage from "../features/auth/pages/loginPage";
import MainLayout from "./layout/MainLayout";
import RouteDataLoader from "../core/routing/RouteDataLoader";
import AppBootstrap from "../core/master/AppBootstrap";
import { useQueryClient } from "@tanstack/react-query";
import {
  connectSignalR,
  disconnectSignalR,
} from "../core/realtime/realtimeManager";
import { decryptUserInfo } from "./shared/decryption/Decryption";
import { handleRealtimeMessage } from "../core/realtime/realtimeDispatcher";

function App() {
  const queryClient = useQueryClient();
 useEffect(() => {
  const user = sessionStorage.getItem("user");
  if (!user) return;

  const userdata = decryptUserInfo(JSON.parse(user));

  connectSignalR(userdata[0].JwtToken, (message) => {
    console.log("api msdd :", message);
    
    handleRealtimeMessage(queryClient, message);
  });

}, []);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

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

// core/master/AppBootstrap.jsx

import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { preloadMasterData } from "./masterBootstrap";

export default function AppBootstrap() {
  useEffect(() => {
    const user = sessionStorage.getItem("user");

    if (user) {
      preloadMasterData();
    }
  }, []);

  return <Outlet />;
}

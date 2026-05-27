import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./app/App.jsx";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./core/api/queryClient.js";
import { bootstrapApp } from "./app/bootstrap.js";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import "@fontsource/inter";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";

import "@fontsource/jetbrains-mono";
// import 'bootstrap/dist/css/bootstrap.min.css';

bootstrapApp();
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false}/>
        <App />
    </QueryClientProvider>
  </StrictMode>,
);

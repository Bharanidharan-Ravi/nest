import { Routes, Route, Navigate } from "react-router-dom";
import { buildRoutes } from "./buildRoutes";
import MainLayout from "../../app/layout/MainLayout";
import LoginPage from "../../features/auth/pages/loginPage";

export default function RouteRenderer() {
  return buildRoutes()
};

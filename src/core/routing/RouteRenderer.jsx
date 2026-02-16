import { Routes, Route, Navigate } from "react-router-dom";
import { buildRoutes } from "./buildRoutes";
import MainLayout from "../../app/layout/MainLayout";
import LoginPage from "../../features/auth/pages/loginPage";

export default function RouteRenderer() {
  return buildRoutes()
}
// export default function RouteRenderer() {
//   const routes = buildRoutes();
//   console.log("routes: ", routes);

//   return routes.map((route, index) => {
//     const Component = route.Component
//     console.log("route In: ", route);
    
//     return (
//       <Route
//         key={index}
//         path={route.path}
//         element={<Component />}
//       />
//     )
//   })
// }


// export default function RouteRenderer() {
//   const routes = buildRoutes()
// console.log("routes: ", routes);

//   return (
//     <Routes>
//       <Route path="/" element={<MainLayout />}>
//         {routes.map((route, index) => {
//           const Component = route.Component
//           return (
//             <Route
//               key={index}
//               path={route.path}
//               element={<Component />}
//             />
//           )
//         })}
//       </Route>
//     </Routes>
//   )
// }

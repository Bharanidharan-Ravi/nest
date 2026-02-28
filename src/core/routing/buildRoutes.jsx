/**
 * src/core/routing/buildRoutes.jsx
 *
 * Reads from featureRegistry and builds the React Router <Route> tree.
 * Added: <Suspense> wrapper for lazy-loaded components.
 * Unchanged: RoleGuard, children nesting, redirect support.
 */

import { Route, Navigate } from "react-router-dom";
import { Suspense } from "react";
import { getAllFeatures } from "../registry/featureRegistry";
import RoleGuard from "../auth/RoleGuard";

const PageLoader = () => (
  <div className="flex items-center justify-center h-full w-full min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-yellow" />
  </div>
);

const renderRoutes = (routes, basePath = "") => {
   return routes.map((route, index) => {
    const fullPath = basePath
      ? `${basePath}/${route.path}`.replace(/\/+/g, "/")
      : route.path;

    const Component = route.element;

    if (route.redirectTo) {
      return <Route key={index} index element={<Navigate to={route.redirectTo} replace />} />;
    }

    // ← RoleGuard fires here on every render of this route
    const ProtectedComponent = Component ? (
      <RoleGuard allowedRoles={route.allowedRoles ?? []}>
        <Suspense fallback={<PageLoader />}>
          <Component />
        </Suspense>
      </RoleGuard>
    ) : undefined;

    if (route.children) {
      return (
        <Route key={index} path={fullPath} element={ProtectedComponent}>
          {renderRoutes(route.children)}
        </Route>
      );
    }

    if (Component) {
      return <Route key={index} path={fullPath} element={ProtectedComponent} />;
    }

    return null;
  });
};

export const buildRoutes = () => {
  const features = getAllFeatures();
  return features.flatMap((feature) =>
    renderRoutes(feature.routes, feature.basePath)
  );
};



// import { Route, Navigate } from "react-router-dom"
// import { getAllFeatures } from "../registry/featureRegistry"
// import RoleGuard from "../auth/RoleGuard";

// const renderRoutes = (routes, basePath = "") => {
//   return routes.map((route, index) => {
//     const fullPath = basePath 
//       ? `${basePath}/${route.path}`.replace(/\/+/g, "/") 
//       : route.path

//     const Component = route.element

//     // 🔁 Redirect Route
//     if (route.redirectTo) {
//       return (
//         <Route
//           key={index}
//           index
//           element={<Navigate to={route.redirectTo} replace />}
//         />
//       )
//     }

//     // Wrap the component in the RoleGuard
//     const ProtectedComponent = Component ? (
//       <RoleGuard allowedRoles={route.allowedRoles}>
//         <Component />
//       </RoleGuard>
//     ) : undefined;

//     // 📦 Route With Children
//     if (route.children) {
//       return (
//         <Route
//           key={index}
//           path={fullPath}
//           element={ProtectedComponent}
//         >
//           {renderRoutes(route.children)}
//         </Route>
//       )
//     }

//     // 🧱 Normal Route
//     if (Component) {
//       return (
//         <Route
//           key={index}
//           path={fullPath}
//           element={ProtectedComponent}
//         />
//       )
//     }

//     return null
//   })
// }

// export const buildRoutes = () => {
//   const features = getAllFeatures()

//   return features.flatMap(feature =>
//     renderRoutes(feature.routes, feature.basePath)
//   )
// }
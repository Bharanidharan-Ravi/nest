// src/hooks/useSmartNavigation.js

import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ROUTES, getRouteByPath} from '../routing/routeConfig';

export const useSmartNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  // Get current route info
  const getCurrentRoute = () => {
    const result = getRouteByPath(location.pathname);
    return result ? { key: result[0], ...result[1] } : null;
  };

  // Navigate BACK (to parent)
  const goBack = () => {
    const current = getCurrentRoute();
    if (current?.parent) {
      const parentRoute = ROUTES[current.parent];
      // Handle dynamic parent paths
      if (parentRoute.generatePath && params.id) {
        navigate(parentRoute.generatePath(params.id));
      } else {
        navigate(parentRoute.path);
      }
    }
  };

  // Navigate FORWARD (to first child or specified child)
  const goForward = (childKey = null) => {
    const current = getCurrentRoute();
    if (current?.children?.length > 0) {
      const targetKey = childKey || current.children[0];
      const childRoute = ROUTES[targetKey];
      if (childRoute.generatePath && params.id) {
        navigate(childRoute.generatePath(params.id));
      } else {
        navigate(childRoute.path);
      }
    }
  };

  // Navigate to CREATE page
  const goToCreate = () => {
    const current = getCurrentRoute();
    if (current?.create) {
      const createRoute = ROUTES[current.create];
      navigate(createRoute.path);
    }
  };

  // Navigate to specific route by key
  const goTo = (routeKey, params = {}) => {
    const route = ROUTES[routeKey];
    if (route) {
      if (route.generatePath && Object.keys(params).length > 0) {
        navigate(route.generatePath(params.id));
      } else {
        navigate(route.path);
      }
    }
  };

  // Get breadcrumb trail
  const getBreadcrumbs = () => {
    const breadcrumbs = [];
    let current = getCurrentRoute();
    
    while (current) {
      breadcrumbs.unshift({
        key: current.key,
        title: current.title,
        path: current.generatePath && params.id 
          ? current.generatePath(params.id) 
          : current.path,
      });
      current = current.parent ? { key: current.parent, ...ROUTES[current.parent] } : null;
    }
    
    return breadcrumbs;
  };

  // Check navigation availability
  const canGoBack = () => !!getCurrentRoute()?.parent;
  const canGoForward = () => getCurrentRoute()?.children?.length > 0;
  const canCreate = () => !!getCurrentRoute()?.create;

  return {
    goBack,
    goForward,
    goToCreate,
    goTo,
    getCurrentRoute,
    getBreadcrumbs,
    canGoBack,
    canGoForward,
    canCreate,
  };
};

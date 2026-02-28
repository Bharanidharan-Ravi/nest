// src/routes/routeConfig.js

export const ROUTES = {
  // Dashboard
  dashboard: {
    path: '/dashboard',
    title: 'Dashboard',
    icon: 'DashboardIcon',
    parent: null,
    children: ['repositories', 'projects'],
    create: null,
  },
  
  // Repositories
  repositories: {
    path: '/repository',
    title: 'Repositories',
    icon: 'RepoIcon',
    parent: 'dashboard',
    children: ['repositoryDetails'],
    create: 'repositoryCreate',
  },
  
  repositoryDetails: {
    path: '/repository/:repoId',
    title: 'Repository Details',
    icon: 'RepoIcon',
    parent: 'repositories',
    children: ['repositorySettings'],
    create: null,
    // Dynamic path generator
    generatePath: (id) => `/repository/${id}`,
  },
  
  repositoryCreate: {
    path: '/repository/create',
    title: 'Create Repository',
    icon: 'AddIcon',
    parent: 'repositories',
    children: [],
    create: null,
  },
  
  repositorySettings: {
    path: '/repository/:repoId/settings',
    title: 'Repository Settings',
    icon: 'SettingsIcon',
    parent: 'repositoryDetails',
    children: [],
    create: null,
    generatePath: (id) => `/repository/${id}/settings`,
  },
  
  // Settings
  projects: {
    path: '/projects',
    title: 'Projects',
    icon: 'ProjectIcon',
    parent: 'dashboard',
    children: [],
    create: null,
  },
};

// Helper to get route by path
export const getRouteByPath = (currentPath) => {
  return Object.entries(ROUTES).find(([key, route]) => {
    // Handle dynamic routes
    const pattern = route.path.replace(/:\w+/g, '[^/]+');
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(currentPath);
  });
};

import { ROUTE_KEYS } from "../../core/routing/paths";
import * as El           from "./elements";
import { ROUTE_ROLES } from "../../core/auth/permissions";

export const EmployeeFeature={
    name:     "employee",
    basePath: "/employee",
    routes: [
    {
      path:    "",
      element: El.EmployeePage,
      allowedRoles: ROUTE_ROLES.EMPLOYEE_LIST,
      nav: {
        key:       ROUTE_KEYS.EMPLOYEE_LIST,
        title:     "Employees",
        parent:    ROUTE_KEYS.DASHBOARD,
        create:    ROUTE_KEYS.EMPLOYEE_CREATE,
        inSidebar: true,
      },
    },

     
       {
        path:    "/create",
        element: El.EmployeeCreatePage,
        nav: {
          key:    ROUTE_KEYS.EMPLOYEE_CREATE,
          title:  "Create Employee",
          parent: ROUTE_KEYS.EMPLOYEE_LIST,
        },
      },
  
     
      {
        path:    "/:employeeId/edit",
        element: El.EmployeeCreatePage,
        nav: {
          key:    ROUTE_KEYS.EMPLOYEE_EDIT,
          title:  "Edit Employee",
          parent: ROUTE_KEYS.EMPLOYEE_LIST,
        },
      },
] 
}
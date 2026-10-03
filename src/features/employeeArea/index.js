import { NotebookTabs  } from "lucide-react";
import { ROUTE_KEYS } from "../../core/routing/paths";
import * as El from "./elements";
import { ROUTE_ROLES } from "../../core/auth/permissions";

export const EmployeeAreaFeature = {
    name: "employeeArea",
    basePath: "/employee-area",
    routes: [
        {
            path: "",
            element: El.EmployeeAreaPage,
            allowedRoles: ROUTE_ROLES.EMPLOYEE_LIST,
            nav: {
                key: ROUTE_KEYS.EMPLOYEE_AREA,
                title: "Employee Area",
                parent: ROUTE_KEYS.DASHBOARD,
                create: ROUTE_KEYS.HOLIDAY_CREATE,
                inSidebar: true,
                icon: NotebookTabs ,
            },
        },
        {
            path: "/holiday/create",
            element: El.HolidayCreatePage,
            nav: {
                key: ROUTE_KEYS.HOLIDAY_CREATE,
                title: "Add Holiday",
                parent: ROUTE_KEYS.EMPLOYEE_AREA,
            },
        },
        {
            path: "/holiday/:holidayId/edit",
            element: El.HolidayCreatePage,
            nav: {
                key: ROUTE_KEYS.HOLIDAY_EDIT,
                title: "Edit Holiday",
                parent: ROUTE_KEYS.EMPLOYEE_AREA,
            },
        },
    ],
};

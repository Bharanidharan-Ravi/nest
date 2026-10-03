import { ROUTE_KEYS } from "../../../core/routing/paths";
import { HolidayConfig } from "./CreateHoliday";

export const HolidayFormConfig = {
    key: "HolidayList",
    title: "HolidayList",
    api: "/employeearea/holiday",
    redirectTo: ROUTE_KEYS.EMPLOYEE_AREA,
    fields: HolidayConfig(),
};
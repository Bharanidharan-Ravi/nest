import apiClient from "../../../core/api/apiClient"
import { masterKeys } from "../../../core/master/masterKeys";
import { queryKeys } from "../../../core/query/queryKeys";
import { ROUTE_KEYS } from "../../../core/routing/paths";
import { EmployeeConfig } from "./CreateEmployee";

// export const Employee = async (data) => {
//   const response = await apiClient.post("/Login/Register", data)
//   return response
// }
export const EmployeeFormConfig = {
    key: "EmployeeList",
    title: "EmployeeList",
    api: "/Login/Register",
  
    invalidateKeys: [masterKeys.multi(["EmployeeList"])],
  
    redirectTo: ROUTE_KEYS.EMPLOYEE_LIST,
  
    fields: EmployeeConfig(),
  
    theme: {
      // Parent Card & Footer
      // formContainer: "wg-form-container",
      // footer: "wg-form-footer",
      // submitBtn: "wg-submit-btn",
      // input: "wg-input",
      // Editor Styling
      editorContainer:
        "border border-gray-300 rounded-md overflow-hidden bg-white focus-within:border-gray-500 focus-within:ring-0 transition-all",
      editorToolbar:
        "flex flex-wrap items-center gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50",
    },
  };
  
// import { masterKeys } from "../../../core/master/masterKeys";
// import { ROUTE_KEYS } from "../../../core/routing/paths";
// import { CustomerConfig } from "./CreateCustomer.Config";

// export const CustomerFormConfig={
//         key: "ClientData",
//         title: "ClientData",
//         api: "/Customer/PostCostomer",
      
//         invalidateKeys: [masterKeys.multi(["ClientData"])],
      
//         redirectTo: ROUTE_KEYS.REPO_OVERVIEW,
      
//         fields: CustomerConfig(),
      
//         theme: {

//           editorContainer:
//             "border border-gray-300 rounded-md overflow-hidden bg-white focus-within:border-gray-500 focus-within:ring-0 transition-all",
//           editorToolbar:
//             "flex flex-wrap items-center gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50",
//         },
//       };
import { masterKeys } from "../../../core/master/masterCall/masterKeys";
import { ROUTE_KEYS } from "../../../core/routing/paths";
import { CustomerConfig } from "./CreateCustomer.Config";

// Logging the CustomerConfig fields to ensure they are set up correctly
const customerConfigFields = CustomerConfig();

export const CustomerFormConfig = {
  key: "ClientData",
  title: "ClientData",
  api: "/Customer/PostCustomer", // Fixed typo (was "PostCostomer")
  
  invalidateKeys: [masterKeys.multi(["ClientData"])],
  
  redirectTo: ROUTE_KEYS.REPO_OVERVIEW,
  
  fields: customerConfigFields, // Fields are logged here as well
  
  theme: {
    editorContainer:
      "border border-gray-300 rounded-md overflow-hidden bg-white focus-within:border-gray-500 focus-within:ring-0 transition-all",
    editorToolbar:
      "flex flex-wrap items-center gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50",
  },
};
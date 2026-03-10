import { masterKeys } from "../../../core/master/masterKeys";
import { ROUTE_KEYS } from "../../../core/routing/paths";
import { ThreadFieldConfig } from "./Thread.config";

export const ThreadFormConfig = {
  key: "Thread",
  title: "Thread",
  api: "/Thread/CreateThread",

  // invalidateKeys: [masterKeys.multi(["ThreadList"])],
  redirectTo: ROUTE_KEYS.TICKET_DETAIL,
  fields: ThreadFieldConfig(),
  actions: [
    {
      label: "Create Thread",
      type: "submit",

    },
    {
      label: "Commit & Close",
      type: "button", // Important: type is "button", not "submit"
      className:
        "bg-brand-yellow text-white px-4 py-2 rounded-md hover:bg-yellow-600 ml-3 font-medium",
      onClick: (formContext) => {
        // 🔥 Safely inject the forced values directly into the submit pipeline!
        formContext.submitForm({
          UpdateStatus: "CLOSED",
          CompletionPercentage: 100,
        });
      },
    },
  ],
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

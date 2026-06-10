import { masterKeys } from "../../../core/master/masterCall/masterKeys";
import { queryKeys } from "../../../core/query/queryKeys";
import { ROUTE_KEYS } from "../../../core/routing/paths";
import { TicketFieldConfig } from "./Ticket.Config";

export const TicketFormConfig = {
  key: "ticket",
  title: "Tickets",
  api: "/Ticket/CreateTicket",

  invalidateKeys: [masterKeys.multi(["TicketsList"])],

  redirectTo: ROUTE_KEYS.TICKET_LIST,

  fields: TicketFieldConfig(),
  actions: ({ formData, context }) => [
    {
      label: context?.isEdit ? "Update" : "Create",
      type: "button",
      onClick: ({ submitForm }) => {
        console.log("formData :", formData);
        
        // 1. Check for Hours
        const hasHours = !!(
          formData?.Client ||
          formData?.Web ||
          formData?.Technical ||
          formData?.Functional
        );

        // 2. NEW: Check for Due Date 
        // (Make sure 'dueDate' matches the exact key in your formData)
        const hasDueDate = !!formData?.dueDate; 

        // 3. Check for Assignees or Resources (with corrected spelling)
        const hasAssignee = !!formData?.assignedTo?.value?.id; 
        const hasResources = (formData?.assignees?.length ?? 0) > 0;
        const hasLabels = (formData?.labels?.length ?? 0) > 0;
        // 4. THE MANDATORY LOGIC: 
        // Must have Hours AND Due Date AND at least one person assigned
        const isReady = hasHours && hasDueDate && hasAssignee && hasResources && hasLabels;

        // Debugging logs to verify your new fields
        console.log("hasHours:", hasHours);
        console.log("hasDueDate:", hasDueDate);
        console.log("hasAssignee:", hasAssignee);
        console.log("hasResources:", hasResources);
        console.log("isReady:", isReady, isReady ? (formData?.Status?.value?.id || 1) : 18);

        // 5. Submit with the correct Status fallback
        submitForm({
          // If ready, use existing status (default to 1). If not ready, force 18.
          Status: isReady ? (formData?.Status?.value?.id || 1) : 18,
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

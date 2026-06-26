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
   
      label: context?.isEdit ? "Update Ticket" : "Create Ticket",
      type: "button",
      onClick: ({ submitForm, context }) => {
        const isViewer = context?.isViewer;
        const openDialog = context?.openDialog;
        
        // 1. Get the requested status (Default to 1: Active)
        const requestedStatusId = formData?.Status?.value?.id || 1;
        console.log("requestedStatusId :", requestedStatusId);
        
        // 2. Identify if the requested status REQUIRES strict validation
        // 1 = Active, 10 = Need Confirmation
        // (14 = Hold, 17 = InActive, 18 = InQueue bypass this)
        const requiresStrictValidation = [1, 10].includes(requestedStatusId);
        
        // 3. Check for fields
        const hasHours = !!(
          formData?.Client ||
          formData?.Web ||
          formData?.Technical ||
          formData?.Functional
        );
        const hasDueDate = !!formData?.dueDate; 
        const hasAssignee = !!formData?.assignedTo?.value?.id; 
        const hasResources = (formData?.assignees?.length ?? 0) > 0;
        const hasLabel = (formData?.label?.length ?? 0) > 0;

        // 4. Build array of what is missing
        const missingFields = [
          !hasHours && "Hours (Client/Web/Technical/Functional)",
          !hasDueDate && "Due Date",
          !hasAssignee && "Assigned To",
          !hasResources && "Assignees/Resources",
          !hasLabel && "Label"
        ].filter(Boolean);

        // 5. If Viewer OR Status does not require all fields OR everything is filled -> Submit safely!
        if (isViewer || !requiresStrictValidation || missingFields.length === 0) {
          submitForm({
            Status: requestedStatusId,
          });
          return;
        }

        // 6. If they selected Active/Client Confirmation but missed fields -> Show Dialog
        openDialog({
          variant: "warning",
          title: "Some Data is Missing",
          description: `To set this ticket to 'Active' or 'Need Confirmation', the following fields are required:\n● ${missingFields.join("\n● ")}\n\nYou can put this ticket in 'In Queue' for now and fill in the details later, or cancel to complete them now.`,
          confirmText: "Queue It (Save)",
          cancelText: "Fill Missing Data",
          onConfirm: () =>
            submitForm({ Status: 18 }), // Force to InQueue
          onCancel: () => { },
        });

      },
    },
  ],
  theme: {
    editorContainer:
      "border border-gray-300 rounded-md overflow-hidden bg-white focus-within:border-gray-500 focus-within:ring-0 transition-all",
    editorToolbar:
      "flex flex-wrap items-center gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50",
  },
};

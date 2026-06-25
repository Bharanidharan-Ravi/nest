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

        // 2. Identify if the requested status REQUIRES all fields
        // 1 = Active, 10 = Need Confirmation
        const requiresStrictValidation = [1, 10].includes(requestedStatusId);

        // 3. Check fields
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

        // Build array of what is missing
        const missingFields = [
          !hasHours && "Hours (Client/Web/Technical/Functional)",
          !hasDueDate && "Due Date",
          !hasAssignee && "Assigned To",
          !hasResources && "Assignees/Resources",
          !hasLabel && "Label",
        ].filter(Boolean);

        // 4. Bypass logic for viewers or if everything is perfectly filled
        if (isViewer || missingFields.length === 0) {
          submitForm({ Status: requestedStatusId });
          return;
        }

        // 5. If they want Active/Confirmation but are missing data -> Intercept
        if (requiresStrictValidation && missingFields.length > 0) {
          openDialog({
            variant: "warning",
            title: "Incomplete Ticket",
            description: `To set this ticket to 'Active' or 'Client Confirmation', you need:\n● ${missingFields.join("\n● ")}\n\nDo you want to put this in the Queue for now and fill details later?`,
            confirmText: "Put in Queue",
            cancelText: "I'll fill it now",
            onConfirm: () => submitForm({ Status: 18 }), // 18 = In Queue
            onCancel: () => {}, // Let them go back to the form
          });
          return;
        }

        // 6. If they are intentionally saving as Hold (14) or InQueue (18) and missing fields, let it pass
        submitForm({ Status: requestedStatusId });
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

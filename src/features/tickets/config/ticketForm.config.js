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
      onClick: ({ submitForm,context }) => {
        const isViewer=context?.isViewer
        const openDialog=context?.openDialog
        
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
        // const label = !!formData?.label; 
        
        // 3. Check for Assignees or Resources (with corrected spelling)
        const hasAssignee = !!formData?.assignedTo?.value?.id; 
        const hasResources = (formData?.assignees?.length ?? 0) > 0;
        const hasLabel= (formData?.label?.length ?? 0) > 0;

        // 4. THE MANDATORY LOGIC: 
        // Must have Hours AND Due Date AND at least one person assigned
        const isReady = hasHours && hasDueDate && hasAssignee && hasResources && hasLabel

        if(isReady||isViewer){
          submitForm({
            Status:formData?.Status?.value?.id||1,
          })
          return
        }

        const missingFields=[
          !hasHours&&"Hours (Client/Web/Technical/Functional)",
          !hasDueDate&&"Due Date",
          !hasAssignee&&"Assigned To",
          !hasResources&&"Assignees/Resources",
          !hasLabel&&"Label"
        ].filter(Boolean);

       if(openDialog({
          variant: "warning",
          title: "Some Data is Missing",
          description: `The following fields are incomplete:\n●${missingFields.join("\n●")}\n\nyou 
          can queue this ticket now and fill in the details later, or cancel to complete them now.`,
          confirmText: "Queue It",
          cancelText: "Fill Missing Data",
          onConfirm: () =>
            submitForm({Status:18
            }),
          onCancel: () => { },
        }));


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

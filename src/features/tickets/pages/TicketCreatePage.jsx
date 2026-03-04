import { useParams } from "react-router-dom";
import EntityFormPage from "../../../packages/crud/pages/EntityFormPage";
import { TicketFormConfig } from "../config/ticketForm.config";
import { queryKeys } from "../../../core/query/queryKeys";
import { useTicketMaster } from "../hooks/useTicketMaster";
const TicketCreatePage = () => {
  const params = useParams();
  const { data: TicketWrapper } = useTicketMaster({ticketId: params.ticketId});
  
  const isEdit = !!params.ticketId;
  const entityData = isEdit && Array.isArray(TicketWrapper) && TicketWrapper.length > 0
    ? TicketWrapper[0]
    : null;

  const statusOptions = [
    { label: "Active", value: { id: 1, name: "Active" } },
    { label: "Inactive", value: { id: 2, name: "Inactive" } },
    { label: "Hold", value: { id: 3, name: "Hold" } }
  ];

  // 2. Define the Status field that only appears during editing
  const statusField = {
    name: "Status",
    label: "Ticket Status",
    type: "select", // Assuming your form engine uses 'select'
    ui: "mui",
    apiKey: "Status",
    options: statusOptions,
    required: true,
    initValueResolver: (context) => {
      
      // 1. If creating, default to Active
      if (!context.isEdit || !context.entityData) {
        return statusOptions[0]; // Returns the whole { label, value: { id, name } } object
      }

      const apiStatus = context.entityData.Status; // e.g., "Active" or 1

      // 2. Find the matching option based on either the ID or the Label
      const matchedOption = statusOptions.find(
        (opt) => opt.value.id === apiStatus || opt.label === apiStatus
      );

      // 3. Return the full object so MUI recognizes it
      return matchedOption || statusOptions[0];
    }
  };

  const dynamicConfig = {
    ...TicketFormConfig,
    api: isEdit ? `Ticket/${params.ticketId}` : TicketFormConfig.api,
    fields: isEdit
      ? [...TicketFormConfig.fields, statusField] // Add status field on edit
      : TicketFormConfig.fields
  };
  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="mb-6 pb-2 border-b border-ghBorder">
        <h2 className="text-2xl font-semibold text-ghText">Create Ticket</h2>
      </div>

      <EntityFormPage mode={isEdit ? "Update" : "create"}
        config={dynamicConfig}
        module="Ticket"
        context={{ params, isEdit, entityData }} />
    </div>
  );
};
export default TicketCreatePage;

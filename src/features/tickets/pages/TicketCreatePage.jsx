import { useParams } from "react-router-dom";
import EntityFormPage from "../../../packages/crud/pages/EntityFormPage";
import { TicketFormConfig } from "../config/ticketForm.config";
import { queryKeys } from "../../../core/query/queryKeys";
import { useTicketMaster } from "../hooks/useTicketMaster";
import { useMemo } from "react";
import { normalizeTicket } from "../../../app/shared/utils/ticketNormalizer";
import { useCurrentUser } from "../../../core/auth/useCurrentUser";
const TicketCreatePage = () => {
  const params = useParams();
  const { data: TicketWrapper } = useTicketMaster({
    ticketId: params.ticketId,
  });
  const { isViewer } = useCurrentUser();
  const isEdit = !!params.ticketId;

  // const normalizeTicket = (ticket) => ({
  //   id: ticket.Issue_Id,
  //   title: ticket.Title,
  //   Status: ticket.Status,
  //   description: ticket.HtmlDesc || ticket.Description,
  //   assginedTo: ticket.Assignee_Name,
  //   Assignee_Id: ticket.Assignee_Id,
  //   multiAssignees: ticket.All_Assignees
  //     ? JSON.parse(ticket.All_Assignees)
  //     : [],
  //   estimateHours: ticket.Hours,
  //   createdAt: ticket.CreatedAt,
  //   updatedAt: ticket.UpdatedAt,
  //   DueDate: ticket.Due_Date,
  //   priority: ticket.Priority,
  //   // repoId: ticket.Repo_Id,
  //   project: ticket.Project_Id,
  //   RepoKey: ticket.RepoKey,
  //   RepoId: ticket.RepoId,
  //   label: ticket.Labels_JSON ? JSON.parse(ticket.Labels_JSON) : [],
  // });
  const entityData = useMemo(() => {
    if (!isEdit) return null;

    if (!Array.isArray(TicketWrapper) || TicketWrapper.length === 0) {
      return null;
    }

    return normalizeTicket(TicketWrapper[0]);
  }, [TicketWrapper, isEdit]);

  const statusOptions = [
    { label: "Active", value: { id: 1, name: "Active" } },
    { label: "InActive", value: { id: 17, name: "InActive" } },
    { label: "Hold", value: { id: 14, name: "Hold" } },
    { label: "InQueue", value: { id: 18, name: "InQueue" } },
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
    initValueResolver: ({ context }) => {
      if (!context.isEdit || !context.entityData) {
        return statusOptions[0]; // Returns the whole { label, value: { id, name } } object
      }
      const apiStatus = context.entityData.statusId; // e.g., "Active" or 1
      const matchedOption = statusOptions.find(
        (opt) => opt.value.id === apiStatus
      );
      return matchedOption || statusOptions[0];
    },
    visibleWhen: (formData, context) => {
      return (!context?.isViewer);
    }
  };

  const dynamicConfig = {
    ...TicketFormConfig,
    api: isEdit ? `Ticket/${params.ticketId}` : TicketFormConfig.api,
    fields: isEdit
      ? [...TicketFormConfig.fields, statusField] // Add status field on edit
      : TicketFormConfig.fields,
  };
  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="mb-6 pb-2 border-b border-ghBorder">
        <h2 className="text-2xl font-semibold text-ghText">
          {isEdit ? "Edit" : "Create"} Ticket
        </h2>
      </div>

      <EntityFormPage
        mode={isEdit ? "Update" : "Create"}
        config={dynamicConfig}
        module="Ticket"
        context={{ params, isEdit, entityData, isViewer }}
      />
    </div>
  );
};
export default TicketCreatePage;

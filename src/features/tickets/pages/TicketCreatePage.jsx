import { useParams } from "react-router-dom";
import EntityFormPage from "../../../packages/crud/pages/EntityFormPage";
import { TicketFormConfig } from "../config/ticketForm.config";
import { queryKeys } from "../../../core/query/queryKeys";
const TicketCreatePage = () => {
  const params = useParams();
  const repoId = params?.repoId;
  const projectId = params?.projectId;

  const configWithInvalidate = {
    ...TicketFormConfig,
    invalidateKeys: [
      queryKeys.ticket.list({
        repoId: repoId ?? "global",
        projectId: projectId ?? "all",
      }),
    ],
  };
  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="mb-6 pb-2 border-b border-ghBorder">
        <h2 className="text-2xl font-semibold text-ghText">Create Ticket</h2>
      </div>

      <EntityFormPage
        mode="Create"
        config={configWithInvalidate}
        module="Ticket"
        context={{ params }}
      />
    </div>
  );
};
export default TicketCreatePage;

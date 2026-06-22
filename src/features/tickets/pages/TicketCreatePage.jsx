import { useParams } from "react-router-dom";
import EntityFormPage from "../../../packages/crud/pages/EntityFormPage";
import { TicketFormConfig } from "../config/ticketForm.config";
import { queryKeys } from "../../../core/query/queryKeys";
import { useTicketMaster } from "../hooks/useTicketMaster";
import { useMemo } from "react";
import { normalizeTicket } from "../../../app/shared/utils/normalizer";
import { useCurrentUser } from "../../../core/auth/useCurrentUser";
import ConfirmDialog from "../../../app/shared/confirmation/confirmationModel";
import { useConfirmDialog } from "../../../app/shared/confirmation/confirmationModel";
const TicketCreatePage = () => {
  const params = useParams();
  const { data: TicketWrapper } = useTicketMaster({
    ticketId: params.ticketId,
  });
  const { isViewer ,isAdmin} = useCurrentUser();
  const isEdit = !!params.ticketId;
  const { dialogProps, openDialog } = useConfirmDialog();
  const entityData = useMemo(() => {
    if (!isEdit) return null;
    if (!Array.isArray(TicketWrapper) || TicketWrapper.length === 0) {
      return null;
    }
    return normalizeTicket(TicketWrapper[0]);
  }, [TicketWrapper, isEdit]);
  const dynamicConfig = {
    ...TicketFormConfig,
    api: isEdit ? `Ticket/${params.ticketId}` : TicketFormConfig.api,
    fields: isEdit
      ? [...TicketFormConfig.fields] // Add status field on edit
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
        context={{ params, isEdit, entityData, isViewer,openDialog,isAdmin }}

      />
         <ConfirmDialog {...dialogProps} />
    </div>
  );
};
export default TicketCreatePage;

// src/features/meeting-scheduler/components/MeetingFormModal.jsx
import React, { useMemo } from "react";
import { X } from "lucide-react";
import EntityFormPage from "../../../packages/crud/pages/EntityFormPage";
import { meetingFormConfig } from "../config/Meetingform.config";
import { queryKeys } from "../../../core/query/queryKeys";


export function MeetingFormModal({ isOpen, onClose, onSuccess, context }) {
  const ticketMaster = context?.ticketMaster || [];
  const dynamicConfig = useMemo(() => {
    const ticketField = {
      label: "Ticket",
      name: "ticket",
      type: "select",
      ui: "mui",
      required: true,
      dataType: "string",
      apiKey: "Ticket_id",

      initValueResolver: ({ context: ctx }) => {
        const ticketId = ctx?.isEditMode ? ctx.entityData?.ticket_id : ctx?.fromTicketId;
        if (!ticketId) return null;

        const ticket = (ticketMaster || []).find((t) => t.Issue_Id == ticketId); // eslint-disable-line eqeqeq
        
        if (ticket) {
          return { value: { id: ticket.Issue_Id, name: ticket.Title }, label: ticket.Title };
        }
        const fallbackTitle = ctx?.fromTicketTitle;
        if (fallbackTitle) {
          return { value: { id: ticketId, name: fallbackTitle }, label: fallbackTitle };
        }
        return null;
      },

      // optionsResolver receives live formData at render time, so switching
      // the Project field re-filters the Ticket options without a full remount.
      optionsResolver: ({ formData, context: ctx }) => {
        const selectedProjectId = formData?.project?.value?.id;
        return (ctx.ticketMaster || [])
          .filter((t) => (selectedProjectId ? t.Project_Id === selectedProjectId : true))
          .map((t) => ({ value: { id: t.Issue_Id, name: t.Title }, label: t.Title }));
      },
    };

    return {
      ...meetingFormConfig,
      invalidateKeys: [queryKeys.MeetingData.list(context.currentUserId)],
      api: context?.isEditMode
        ? `MeetingSchedulerControler/${context?.meetingId}`
        : meetingFormConfig.api,
      fields: [...(meetingFormConfig.fields || []), ticketField],
    };
  }, [ticketMaster, context]);

  if (!isOpen) return null;

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-bold text-gray-900">
            {context?.isEditMode ? "Edit Meeting" : "New Meeting"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <EntityFormPage
            mode={context?.isEditMode ? "Edit" : "Create"}
            config={dynamicConfig}
            module="Meeting"
            onSuccessCallback={handleSuccess}
            onCancel={onClose}
            context={context}
          />
        </div>
      </div>
    </div>
  );
}

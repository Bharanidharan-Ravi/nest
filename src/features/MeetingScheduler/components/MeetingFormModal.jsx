// src/features/meeting-scheduler/components/MeetingFormModal.jsx
import React, { useMemo } from "react";
import { CalendarCog, CalendarPlus, CalendarX, X } from "lucide-react";
import EntityFormPage from "../../../packages/crud/pages/EntityFormPage";
import { meetingFormConfig } from "../config/Meetingcreate.config";
import { queryKeys } from "../../../core/query/queryKeys";
import { useApiMutation } from "../../../core/query/useApiMutation";
import ConfirmDialog, { useConfirmDialog } from "../../../app/shared/confirmation/confirmationModel";
import { canManageMeeting } from "../Helpers/meetingValidation";
import { useBodyScrollLock } from "../hooks";

// Section headings, in form order. FormEngine starts a new heading whenever
// a field's groupName changes, so each list must be consecutive fields.
const SECTIONS = [
  ["Meeting", ["host_Type", "host_Name", "title"]],
  [
    "Schedule",
    [
      "recurrence_type", "meeting_Date", "validate_From", "validate_To",
      "start_time", "end_time", "slot_Duration",
      "days_of_Week",
      // Times per day is disabled for now.
      // "times_Per_Day", "second_Start_Time", "second_End_Time",
    ],
  ],
  ["Meeting link", ["meet_Method", "meet_Link", "meet_Password"]],
  ["Participants", ["internalParticipants", "clientParticipants"]],
  ["Type & project", ["booking_Type", "project", "ticket"]],
];
const SECTION_BY_FIELD = Object.fromEntries(
  SECTIONS.flatMap(([section, names]) => names.map((fieldName) => [fieldName, section]))
);

// Styles EntityFormPage / FormEngine pick up from config.theme, so the form
// sits flush in this modal (no card-in-card) with a sticky footer.
const MODAL_FORM_THEME = {
  formContainer: "!border-0 !shadow-none !rounded-none !max-h-none min-h-0 flex-1",
  body: "px-4 py-4 sm:px-5",
  grid: "grid grid-cols-12 gap-x-4 gap-y-4",
  footer:
    "!rounded-none !border-slate-100 !bg-slate-50/80 !px-4 sm:!px-5 !py-2.5 !pb-[max(0.625rem,env(safe-area-inset-bottom))] flex-col-reverse sm:flex-row sm:items-center",
  submitBtn:
    "w-full sm:w-auto !rounded-lg !px-5 !py-2 !bg-amber-400 hover:!bg-amber-500 !text-gray-900 shadow-sm shadow-amber-200",
  cancelBtn: "!ml-0 w-full sm:w-auto !rounded-lg !px-5 !py-2",
  // Checked color for MuiRadioGroup (Times per day), matching the page's amber.
  radioAccent: "#f59e0b",
  // -mb-1.5 pulls the heading closer to its own fields than to the section above.
  groupHeader:
    "col-span-12 -mb-1.5 flex items-center gap-3 after:h-px after:flex-1 after:bg-slate-100 after:content-['']",
  groupTitle: "shrink-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400",
};

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
      colSpan: 4,

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
      // Every loaded meetings list (whatever dates / host) and the sidebar's upcoming list.
      invalidateKeys: [queryKeys.MeetingData.all, ["UpcomingMeeting"]],
      api: context?.isEditMode
        ? `MeetingSchedulerControler/${context?.meetingId}`
        : meetingFormConfig.api,
      fields: [...(meetingFormConfig.fields || []), ticketField].map((field) => ({
        ...field,
        groupName: SECTION_BY_FIELD[field.name],
      })),
      theme: MODAL_FORM_THEME,
    };
  }, [ticketMaster, context]);

  useBodyScrollLock(isOpen);

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  const { dialogProps, openDialog } = useConfirmDialog();
  const { mutate: cancelMeeting, isPending: isCancelling } = useApiMutation({
    url: `MeetingSchedulerControler/CancelMeeting/${context?.meetingId}`,
    method: "POST",
    invalidateKeys: [queryKeys.MeetingData.all, ["UpcomingMeeting"]],
    onSuccess: handleSuccess,
  });

  if (!isOpen) return null;

  const isEdit = !!context?.isEditMode;
  const HeaderIcon = isEdit ? CalendarCog : CalendarPlus;
  const meeting = context?.entityData;
  const canCancel = isEdit && canManageMeeting(meeting, context?.currentUserId);

  const confirmCancel = () =>
    openDialog({
      variant: "danger",
      title: "Cancel this meeting?",
      description: `"${meeting?.title || "Untitled Meeting"}" will be marked as cancelled for all participants. This can't be undone.`,
      confirmText: "Cancel meeting",
      cancelText: "Keep meeting",
      onConfirm: () => cancelMeeting({}),
    });

  return (
    <div className="wg-fade-in fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="meeting-form-title"
        className="wg-rise-in relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:max-w-3xl sm:rounded-2xl"
      >
        {/* Drag-handle look for the phone bottom sheet */}
        <div aria-hidden="true" className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-slate-200 sm:hidden" />

        <header className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-4 py-2.5 sm:px-5 sm:py-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
            <HeaderIcon size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="meeting-form-title" className="truncate text-base font-bold text-slate-900">
              {isEdit ? "Edit Meeting" : "New Meeting"}
            </h2>
            <p className="truncate text-xs text-slate-500">
              {isEdit ? "Update the schedule, time or participants" : "Set the schedule and invite participants"}
            </p>
          </div>
          {canCancel && (
            <button
              type="button"
              onClick={confirmCancel}
              disabled={isCancelling}
              title="Cancel meeting"
              aria-label="Cancel meeting"
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-red-600 ring-1 ring-inset ring-red-200 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CalendarX size={16} aria-hidden="true" />
              <span className="hidden sm:inline">{isCancelling ? "Cancelling..." : "Cancel meeting"}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">
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

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}

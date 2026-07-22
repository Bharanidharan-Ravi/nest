
import { FaTimes } from "react-icons/fa";
import EntityFormPage from "../../../../packages/crud/pages/EntityFormPage";
import { formatDate } from "../../Helpers/dateTime";
import { CalendarDays, CheckCircle2, Clock3, X } from "lucide-react";
import { safeParseList } from "../../hooks/participants";
import { useMemo } from "react";
function BuildAttendeeOptions(meeting) {
    const internal = safeParseList(meeting.InternalParticipants);
    const client = safeParseList(meeting.ClientParticipants);
    return [...internal, ...client].map(participant => ({
        label: participant.Participant_Name,
        value: {
            id: participant.Participant_Id,
            name: participant.Participant_Name
        }
    }));
}
export default function MeetingCompleteModal({
    meeting,
    onClose,
    handleSuccess
}) {
  const attendeOptions = useMemo(()=>
    BuildAttendeeOptions(meeting),[meeting.meeting_id])

    const completeField = (meeting) => [
        {
            label: "Start Time",
            name: "start_time",
            type: "flexHours",
            ui: "mui",
            required: true,
            dataType: "dateTime",
            apiKey: "ActualStartTime",
            initValueResolver: ({ context, formData }) => {
                return context?.start_time?.slice(0, 5) ?? "";
            }
        },
        {
            label: "End Time",
            name: "end_time",
            type: "flexHours",
            ui: "mui",
            required: true,
            dataType: "dateTime",
            apiKey: "ActualEndTime",
            initValueResolver: ({ context }) => {
                return new Date().toTimeString().slice(0, 5);
            },
        },
        {
            key: "meetingId",
            apiKey: "MeetingId",
            hidden: true,
            defaultValue: meeting.meeting_id,
            dataType: "string",
        },
        {
            label: "Meeting Summary",
            name: "meeting_summary",
            type: "adEditor",
            ui: "editor",
            required: true,
            dataType: "string",
            apiKey: "MeetingSummary"
        },
        {
            name: "Attendee",
            label: "Attendees",
            type: "ListCheckBox", // Or "switch", depending on your inputRegistry
            ui: "mui", // Or "html"
            colSpan: 3,
            groupName: "Meeting Attendees",
            options :attendeOptions,
            initValueResolver: ({ context }) => {
                return attendeOptions.map(o =>o.value);
              },
        }
    ]
    const config = {
        api: "MeetingSchedulerControler/CompleteMeeting",
        invalidateKeys: [],
        fields: completeField(meeting),
        actions: ({ formData, context }) => [
            {
                label: "Complete Meeting",
                subtext: "Close Meeting",
                colorClass: "bg-green-600",
                onClick: ({ submitForm }) => {
                    submitForm({
                        Attendance: (formData.Attendee || []).map(participant => ({
                            ParticipantId: participant.id,
                            AttendanceStatus: "Present",
                            InviteStatus: "Accepted",
                            Remark: ""
                        }))
                    });
                },
            },
        ]
    };
    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center  bg-gray-900/50 backdrop-blur-sm p-4 
        animate-in fade-in duration-150"
            onClick={onClose}>
            <div role="dialog"
                aria-modal="true"
                aria-labelledby="completed-meeting"
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden
            animate-in zoom-in-95 slide-in-form-bottom-2 duration-200"
            >
                <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100 px-6 py-5 shrink-0">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-50 text-emerald-600 shrink-0 mt-0.5">
                                <CheckCircle2 size={18} />
                            </span>
                            <div className="min-w-0">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                    Complete Meeting
                                </p>
                                <h2 id="complete-meeting-title"
                                    className="text-lg font-semibold text-gray-900 truncate"
                                    title={meeting?.title}
                                >
                                    {meeting?.title || "Untitled Meeting"}
                                </h2>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close"
                            className="shrink-0 p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100
focus-visible:outline-none focus-visble:ring-2 focus-visbile:ring-amber-300 transition"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                            <CalendarDays size={12} />
                            {meeting?.meeting_date ? formatDate(meeting.meeting_date) : "-"}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full bg-emerald-50 text-emerald-700">
                            <Clock3 size={12} />
                            {meeting?.start_time?.slice(0, 5)} - {meeting?.end_time?.slice(0, 5)}
                        </span>
                    </div>
                </div>


                <div className="flex-1 overflow-y-auto">
                    {/* FORM */}
                    <EntityFormPage
                        mode="Complete"
                        module="Meeting"
                        config={config}
                        context={meeting}
                        onSuccessCallback={handleSuccess}
                        onCancel={onClose}
                    />
                </div>
            </div>


        </div>
    );
}
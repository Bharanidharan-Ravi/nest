



import { buildOptionsResolver, calcHHMM } from "../../../app/shared/utilities/utilities";
import { useUIStore } from "../../../core/state/useUIStore";
import { MEETING_METHODS, idKey, isOnlineMethod, safeParseList, validateMeetingLink } from "../Helpers/common";
import { datePart, nowTime, todayKey } from "../Helpers/dateTime";
import {
  describeConflict,
  findConflict,
  validateDateNotPast,
  validateDaysOfWeek,
  validateEndTime,
  validateNotHost,
  // validateSecondStartTime, // Times per day is disabled for now
  validateStartTime,
  validateTitle,
  validateValidTo,
} from "../Helpers/meetingValidation";
export const recurrenceOptions =
  [
    { label: "One Time", value: { id: "ONETIME", name: "onetime" } },
    { label: "Daily", value: { id: "DAILY", name: "daily" } },
    { label: "Weekly", value: { id: "WEEKLY", name: "weekly" } },
  ]

// Times per day (weekly meetings, 1 or 2 slots a day) is disabled for now.
// const timesPerDayOptions = [
//   { label: "1 Time", description: "One time slot each selected day", value: { id: 1, name: "1" } },
//   { label: "2 Times", description: "Two time slots each selected day", value: { id: 2, name: "2" } },
// ];

// const isWeekly = (formData) => formData?.recurrence_type?.value?.id === "WEEKLY";
// const hasSecondSlot = (formData) =>
//   isWeekly(formData) && formData?.times_Per_Day?.value?.id === 2;

const meetingMethodOptions = MEETING_METHODS.map((m) => ({ label: m.label, value: { id: m.id, name: m.label } }));
const meetingMethodId = (formData) => formData?.meet_Method?.value?.id;
const isInPerson = (formData) => meetingMethodId(formData) === "IN_PERSON";

export const bookingTypeOptions = [
  { label: "Meeting", value: { id: "meeting", name: "meeting" } },
  { label: "Interview", value: { id: "interview", name: "interview" } },
  { label: "Demo", value: { id: "demo", name: "demo" } },
  { label: "Discussion", value: { id: "discussion", name: "discussion" } },
  { label: "SupportCall", value: { id: "supportCall", name: "supportCall" } },
];

const hostTypeOptions = [
  { label: "Employee", value: { id: "Employee", name: "Employee" } },
  { label: "Client", value: { id: "Client", name: "Client" } },
];

/** A meeting's saved participants (JSON from the API) -> selected options for the edit form. */
const toParticipantOptions = (participants) =>
  safeParseList(participants).map((p) => ({
    label: p.Participant_Name,
    value: { id: p.Participant_Id, name: p.Participant_Name },
  }));
export const MeetinglFieldConfig = () => [
  {
    name: "host_Type",
    colSpan: 4,
    label: "Host Type",
    type: "select",
    ui: "mui",
    apiKey: "host_type",
    dataType: "string",
    initValueResolver: ({ context }) => {
      const value = context.entityData?.host_type;
      if (context.isEditMode) {
        return (
          hostTypeOptions.find(
            option => option.value?.id === value
          ) || hostTypeOptions.find(o => o.value?.id === "Employee")
        );
      }
      return hostTypeOptions.find(o => o.value?.id === "Employee");
    },
    required: true,
    options: hostTypeOptions
  },
  {
    label: "Host Name",
    name: "host_Name",
    type: "select",
    ui: "mui",
    required: true,
    colSpan: 8,
    dataType: "string",
    apiKey: "host_id",
    optionsResolver: ({ masterData, context, formData }) => {
      const employeeOptions =
        (masterData?.EmployeeList || [])
          .filter((user) => user.Status === "Active")
          .map((user) => ({
            label: user.UserName,
            value: {
              id: user.UserID,
              name: user.UserName,
            },
          })) || [];
      const repoOptions = (masterData?.RepoList || []).flatMap((repo) =>
        (repo.repoUsers || [])
          .filter((user) => user.Status === "Active")
          .map((user) => ({
            label: user.UserName,
            value: {
              id: user.UserId,
              name: user.UserName,
            },
          }))
      );
      const selectedType = formData?.host_Type?.value?.id;
      if (selectedType === "Employee") return employeeOptions;
      if (selectedType === "Client") return repoOptions;
      return [];
    },
    initValueResolver: ({ context, masterData, formData }) => {
      const currentUserId = context.isEditMode ? context.entityData.host_id : context?.currentUserId;
      if (!currentUserId) return null;
      const currentUser = (masterData?.EmployeeList || []).find(
        (user) => user.UserID === currentUserId
      );
      if (!currentUser) return null;
      return {
        label: currentUser.UserName,
        value: {
          id: currentUser.UserID,
          name: currentUser.UserName,
        },
      };
    },
  },


  {
    label: "Meeting title",
    name: "title",
    type: "text",
    ui: "mui",
    required: true,
    dataType: "string",
    colSpan: 12,
    apiKey: "title",
    customValidator: validateTitle,
    initValueResolver: ({ context }) => {
      return context.isEditMode ? context.entityData.title : ""
    }
  },
  {
    name: "recurrence_type",
    colSpan: 4,
    label: "Recurrence type",
    type: "select",
    ui: "mui",
    apiKey: "recurrence_type",
    dataType: "string",
    required: true,
    options: recurrenceOptions,

    initValueResolver: ({ context }) => {
      if (context.isEditMode) {
        const currentType = context.entityData.recurrence_type;
        const matched = recurrenceOptions.find((opt) => opt.value.id === currentType)
        return matched || recurrenceOptions[0]
      }
      return recurrenceOptions[0];
    },
  },
  {
    label: "Meeting Date",
    name: "meeting_Date",
    colSpan: 4,
    type: "date",
    ui: "mui",
    required: true,
    dataType: "string",
    apiKey: "meeting_Date",
    visibleWhen: (formData) => {
      return formData?.recurrence_type?.value?.id === "ONETIME";
    },
    customValidator: validateDateNotPast("Meeting Date"),
    initValueResolver: ({ context,formData }) => {
      const isEditMode = context?.isEditMode;
      if (isEditMode) {
        return datePart(context?.entityData?.meeting_date);
      }
      // context.prefill: the day / time slot clicked on the calendar.
      return context?.prefill?.date ?? todayKey();
    },
  },

  {
    label: "Validate From",
    name: "validate_From",
    colSpan: 4,
    type: "date",
    ui: "mui",
    // Only visible (and so only checked) for daily / weekly meetings.
    required: true,
    dataType: "string",
    visibleWhen: (formData, context) => {
      return formData?.recurrence_type?.value?.id !== "ONETIME";
    },
    apiKey: "valid_from_date",
    customValidator: validateDateNotPast("Validate From"),
    initValueResolver: ({ context, formData }) => {
      if (context.isEditMode) {
        return datePart(context.entityData?.valid_from_date);
      }
      return context?.prefill?.date ?? todayKey();
    }
  },
  {
    label: "Validate To",
    name: "validate_To",
    colSpan: 4,
    type: "date",
    ui: "mui",
    required: true,
    dataType: "string",
    visibleWhen: (formData, context) => {
      return formData?.recurrence_type?.value?.id !== "ONETIME";
    },
    apiKey: "valid_to_date",
    customValidator: validateValidTo,
    initValueResolver: ({ context, formData }) => {
      if (context.isEditMode) {
        return datePart(context.entityData?.valid_to_date);
      }
      return context?.prefill?.date ?? todayKey();
    }
  },
  {
    label: "Start Time",
    name: "start_time",
    colSpan: 4,
    type: "flexHours",
    ui: "mui",
    required: true,
    dataType: "string",
    apiKey: "start_time",
    // Time format, office hours, not earlier than now (today's one-time
    // meetings), and double-booking of the host / participants.
    customValidator: validateStartTime,
    initValueResolver: ({ context }) => {
      if (context.isEditMode) {
        return context.entityData?.start_time?.slice(0, 5) ?? "";
      }
      return context?.prefill?.start_time ?? nowTime();
    }
  },
  {
    label: "End Time",
    name: "end_time",
    colSpan: 4,
    type: "flexHours",
    ui: "mui",
    required: true,
    dataType: "string",
    apiKey: "end_time",
    initValueResolver: ({ context }) =>
      context.isEditMode
        ? context.entityData?.end_time?.slice(0, 5) : context?.prefill?.end_time ?? "",
    customValidator: validateEndTime("start_time", "End Time must be after Start Time"),
  },
  {
    label: "Slot Duration",
    name: "slot_Duration",
    colSpan: 4,
    type: "flexHours",
    ui: "mui",
    required: true,
    dataType: "string",
    apiKey: "slot_duration",
    effectDependencies: ["start_time", "end_time"],
    effectResolver: (formData) => {
      if (formData.start_time && formData.end_time) {
        return calcHHMM(formData.start_time, formData.end_time);
      }
      return formData.slot_Duration || "";
    },
    initValueResolver: ({ context, masterData, formData }) => {
      const start = formData?.start_time?.slice(0, 5) ?? "";
      const end = formData?.end_time?.slice(0, 5) ?? "";
      if (start && end) {
        return calcHHMM(start, end);
      }
      if (!context.isEditMode && context?.prefill?.start_time && context?.prefill?.end_time) {
        return calcHHMM(context.prefill.start_time, context.prefill.end_time);
      }
      return context.isEditMode
        ? context.entityData?.slot_duration ?? ""
        : "";
    },
  },

  {
    name: "days_of_Week",
    label: "Days of Week",
    type: "weeks",
    ui: "mui",
    apiKey: "days_of_week",
    dataType: "string",
    colSpan: 12,
    required: true,
    options: [
      { label: "Sun", value: { id: 0, name: "Sunday" } },
      { label: "Mon", value: { id: 1, name: "Monday" } },
      { label: "Tue", value: { id: 2, name: "Tuesday" } },
      { label: "Wed", value: { id: 3, name: "Wednesday" } },
      { label: "Thu", value: { id: 4, name: "Thursday" } },
      { label: "Fri", value: { id: 5, name: "Friday" } },
      { label: "Sat", value: { id: 6, name: "Saturday" } },
    ],
    visibleWhen: (formData, context) => {
      const type = formData?.recurrence_type?.value?.id;
      return type && type !== "ONETIME" && type !== "DAILY";
    },
    customValidator: validateDaysOfWeek,
    initValueResolver: ({ context }) => {
      return context.isEditMode ? (context.entityData?.days_of_week ?? "") : "";
    },

  },
  // Times per day is disabled for now. Restore these three fields together with
  // timesPerDayOptions / isWeekly / hasSecondSlot above.
  // {
  //   name: "times_Per_Day",
  //   label: "Times per day",
  //   type: "radio",
  //   ui: "mui",
  //   apiKey: "times_per_day",
  //   dataType: "number",
  //   colSpan: 4,
  //   required: true,
  //   options: timesPerDayOptions,
  //   visibleWhen: (formData) => isWeekly(formData),
  //   // Only weekly meetings can run twice a day; everything else is once.
  //   transform: (value, formData) => (isWeekly(formData) ? value : 1),
  //   initValueResolver: ({ context }) => {
  //     const current = Number(context.isEditMode ? context.entityData?.times_per_day : 1);
  //     return timesPerDayOptions.find((opt) => opt.value.id === current) || timesPerDayOptions[0];
  //   },
  // },
  // {
  //   label: "Second Start Time",
  //   name: "second_Start_Time",
  //   type: "flexHours",
  //   colSpan: 6,
  //   ui: "mui",
  //   required: true,
  //   dataType: "string",
  //   apiKey: "second_start_time",
  //   visibleWhen: (formData) => hasSecondSlot(formData),
  //   transform: (value, formData) => (hasSecondSlot(formData) ? value : null),
  //   customValidator: validateSecondStartTime,
  //   initValueResolver: ({ context }) =>
  //     context.isEditMode ? context.entityData?.second_start_time?.slice(0, 5) ?? "" : "",
  // },
  // {
  //   label: "Second End Time",
  //   name: "second_End_Time",
  //   type: "flexHours",
  //   colSpan: 6,
  //   ui: "mui",
  //   required: true,
  //   dataType: "string",
  //   apiKey: "second_end_time",
  //   visibleWhen: (formData) => hasSecondSlot(formData),
  //   transform: (value, formData) => (hasSecondSlot(formData) ? value : null),
  //   customValidator: validateEndTime("second_Start_Time", "Second End Time must be after Second Start Time"),
  //   initValueResolver: ({ context }) =>
  //     context.isEditMode ? context.entityData?.second_end_time?.slice(0, 5) ?? "" : "",
  // },
  {
    label: "Meeting Method",
    name: "meet_Method",
    type: "select",
    ui: "mui",
    colSpan: 3,
    apiKey: "meet_method",
    dataType: "string",
    options: meetingMethodOptions,
    initValueResolver: ({ context }) =>
      context.isEditMode
        ? meetingMethodOptions.find((opt) => opt.value.id === context.entityData?.meet_method) ?? null
        : null,
  },
  {
    label: "Meeting Link",
    name: "meet_Link",
    type: "text",
    ui: "mui",
    colSpan: 6,
    apiKey: "meet_link",
    dataType: "string",
    visibleWhen: (formData) => !isInPerson(formData),
    // Online methods need a link; with no method picked it stays optional.
    requiredWhen: (context, data) => isOnlineMethod(meetingMethodId(data)),
    transform: (value, formData) => (isInPerson(formData) ? null : value?.trim() || null),
    customValidator: (value, data) => validateMeetingLink(value, meetingMethodId(data)),
    initValueResolver: ({ context }) => (context.isEditMode ? context.entityData?.meet_link ?? "" : ""),
  },
  {
    label: "Password (optional)",
    name: "meet_Password",
    type: "text",
    ui: "mui",
    colSpan: 3,
    apiKey: "meet_password",
    dataType: "string",
    visibleWhen: (formData) => !isInPerson(formData),
    transform: (value, formData) => (isInPerson(formData) ? null : value?.trim() || null),
    initValueResolver: ({ context }) => (context.isEditMode ? context.entityData?.meet_password ?? "" : ""),
  },
  {
    label: "Internal Participants",
    name: "internalParticipants",
    type: "select",
    multiple: true,
    apiKey: "internalParticipants",
    ui: "mui",
    customValidator: validateNotHost,
    optionsResolver: buildOptionsResolver(
      "EmployeeList",
      "UserID",
      "UserName",
      (user) => user.Status === "Active", // 👈 Simple 1-condition filter
    ),
    initValueResolver: ({ context }) =>
      context.isEditMode ? toParticipantOptions(context.entityData?.InternalParticipants) : [],
  },
  {
    label: "Client Participants",
    name: "clientParticipants",
    type: "select",
    multiple: true,
    apiKey: "clientParticipants",
    ui: "mui",
    customValidator: validateNotHost,
    optionsResolver: ({ masterData }) => {
      const options = (masterData?.RepoList || []).flatMap((repo) => {
        return safeParseList(repo.RepoUserList)
          .filter((user) => user.Status === "Active")
          .map((user) => ({
            label: user.UserName,
            value: {
              id: user.UserId,
              name: user.UserName,
            },
          }));
      });

      // A client on several repos would otherwise be listed once per repo.
      const seen = new Set();
      return options.filter(({ value }) => {
        const key = idKey(value.id);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },
    initValueResolver: ({ context }) =>
      context.isEditMode ? toParticipantOptions(context.entityData?.ClientParticipants) : [],
  },
  {
    name: "booking_Type",
    colSpan: 4,
    label: "Meeting Type",
    type: "select",
    ui: "mui",
    apiKey: "booking_type",
    dataType: "string",
    required: true,
    options: bookingTypeOptions,
    initValueResolver: ({ context }) =>
      context.isEditMode
        ? bookingTypeOptions.find(
          option => option.value.id === context.entityData?.booking_type
        ) || null
        : null,
  },
  {
    label: "Project",
    name: "project",
    colSpan: 4,
    type: "select",
    ui: "mui",
    required: true,
    dataType: "string",
    apiKey: "project_id",
    optionsResolver: buildOptionsResolver(
      "ProjectList", // 1. listKey
      "Id", // 2. idKey
      "Project_Name", // 3. labelKey
    ),
    initValueResolver: ({ context, masterData, formData }) => {
      if (context?.isEditMode) {
        const projectId = context?.entityData?.project_id;
        const project = masterData?.ProjectList?.find(
          (p) => p.Id === projectId
        );
        return project
          ? {
            label: project.Project_Name,
            value: {
              id: project.Id,
              name: project.Project_Name,
            },
          }
          : null;
      }
      const ticketId = formData?.ticket?.value?.id || context?.fromTicketId;
      const projectId = context?.fromProjectId || context?.ticketMaster
        ?.find(t => t.Issue_Id === ticketId)
        ?.Project_Id;
      const project = masterData?.ProjectList
        ?.find(p => p.Id === projectId)
      return project && {
        label: project.Project_Name,
        value: { id: project.Id, name: project.Project_Name },
      };
    },
  },
]

export const meetingFormConfig = {
  key: "MeetingData",
  title: "MeetingData",
  api: "/MeetingSchedulerControler/CreateMeeting",

  fields: MeetinglFieldConfig(),

  actions: ({ formData, context }) => [
    {
      label: "Create Meeting",

      onClick: ({ submitForm }) => {
        // Double-booking is a Start Time validation rule (so it also runs on
        // edit); the pop-up just makes it visible when the field is scrolled away.
        const conflict = findConflict(formData, context);
        if (conflict) {
          useUIStore.getState().setError(describeConflict(conflict));
        }
        submitForm();
      },
    },
  ],
};

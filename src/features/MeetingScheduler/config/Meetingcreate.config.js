



import { buildOptionsResolver, calcHHMM } from "../../../app/shared/utilities/utilities";
const recurrenceOptions =
  [
    { label: "One Time", value: { id: "ONETIME", name: "onetime" } },
    { label: "Daily", value: { id: "DAILY", name: "daily" } },
    { label: "Weekly", value: { id: "WEEKLY", name: "weekly" } },
  ]

const bookingTypeOptions = [
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
export const MeetinglFieldConfig = () => [
  {
    name: "host_Type",
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
    colSpan: 6,
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
      const selectedType =
        formData?.host_Type?.value?.id || formData?.host_Type?.id;
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
    initValueResolver: ({ context }) => {
      return context.isEditMode ? context.entityData.title : ""
    }
  },
  {
    name: "recurrence_type",
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
      // return {
      //   label: "One Time",
      //   value: { id: "ONETIME", name: "onetime" }
      // };
    },
  },
  {
    label: "Meeting Date",
    name: "meeting_Date",
    type: "date",
    ui: "mui",
    required: true,
    dataType: "string",
    apiKey: "meeting_Date",
    visibleWhen: (formData) => {
      return formData?.recurrence_type?.value?.id === "ONETIME";
    },
    initValueResolver: ({ context,formData }) => {
      const isEditMode = context?.isEditMode;
      if (isEditMode) {
        return context?.entityData?.meeting_date
          ? context.entityData.meeting_date.split("T")[0]
          : "";
      }
      return  new Date().toISOString().split("T")[0]
    },
  },

  {
    label: "Validate From",
    name: "validate_From",
    type: "date",
    ui: "mui",
    required: false,
    dataType: "string",
    visibleWhen: (formData, context) => {
      return formData?.recurrence_type?.value?.id !== "ONETIME";
    },
    apiKey: "valid_from_date",
    initValueResolver: ({ context, formData }) => {
      if (context.isEditMode) {
        return context.entityData?.valid_from_date?.split("T")[0] || "";
      }
      return  new Date().toISOString().split("T")[0] ;
    }
  },
  {
    label: "Validate To",
    name: "validate_To",
    type: "date",
    ui: "mui",
    required: false,
    dataType: "string",
    visibleWhen: (formData, context) => {
      return formData?.recurrence_type?.value?.id !== "ONETIME";
    },
    apiKey: "valid_to_date",
    initValueResolver: ({ context, formData }) => {
      if (context.isEditMode) {
        return context.entityData?.valid_to_date?.split("T")[0] || "";
      }
      const isVisible = formData?.recurrence_type?.value?.id !== "ONETIME";
      return new Date().toISOString().split("T")[0];
    }
  },
  {
    label: "Start Time",
    name: "start_time",
    type: "flexHours",
    ui: "mui",
    required: true,
    dataType: "string",
    apiKey: "start_time",
    customValidator: (value, data, context) => {
      
      if (!value) return true;
      const [hours, minutes] = value.split(":").map(Number);
      const selectedTime = hours * 60 + minutes;
      // Office starts at 10:00 AM
      if (selectedTime < 600) {
        return "Start Time cannot be before 10:00 AM";
      }
      if (context.isEditMode) return true;
      const currentDate = new Date().toISOString().split("T")[0];
      if (data.meeting_Date === currentDate) {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
    
        return selectedTime >= currentTime
          ? true
          : "Start Time cannot be before the current time";
      }
      return true;
      // const now = new Date();
      // const currentTime = now.getHours() * 60 + now.getMinutes();
      // return selectedTime >= currentTime
      //   ? true
      //   : "Start Time cannot be before the current time";
    },
    initValueResolver: ({ context }) => {
      if (context.isEditMode) {
        return context.entityData?.start_time?.slice(0, 5) ?? "";
      }
      return new Date().toTimeString().slice(0, 5);
    }
  },
  {
    label: "End Time",
    name: "end_time",
    type: "flexHours",
    ui: "mui",
    required: true,
    dataType: "string",
    apiKey: "end_time",
    initValueResolver: ({ context }) =>
      context.isEditMode
        ? context.entityData?.end_time?.slice(0, 5) :"",
        // : (() => {
        //   const date = new Date();
        //   date.setMinutes(date.getMinutes() + 10);
        //   return date.toTimeString().slice(0, 5);
        // })(),
    customValidator: (value, data) => {
      if (!value || !data.start_time) return true;

      const [endHour, endMinute] = value.split(":").map(Number);
      const [startHour, startMinute] = data.start_time.split(":").map(Number);

      return endHour * 60 + endMinute >= startHour * 60 + startMinute
        ? true
        : "End Time cannot be earlier than Start Time";
    },
  },
  {
    label: "Slot Duration",
    name: "slot_Duration",
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
    fullWidth: true,
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
    initValueResolver: ({ context }) => {
      return context.isEditMode ? (context.entityData?.days_of_week ?? "") : "";
    },

  },
  {
    label: "Internal Participants",
    name: "internalParticipants",
    type: "select",
    multiple: true,
    apiKey: "internalParticipants",
    ui: "mui",
    optionsResolver: buildOptionsResolver(
      "EmployeeList",
      "UserID",
      "UserName",
      (user) => user.Status === "Active", // 👈 Simple 1-condition filter
    ),
    initValueResolver: ({ context }) => {
      if (!context.isEditMode) return [];
      const raw = context.entityData?.InternalParticipants;
      const parsed = typeof raw === "string" ? JSON.parse(raw || "[]") : (raw || []);
      return parsed.map((p) => ({
        label: p.Participant_Name,
        value: {
          id: p.Participant_Id,
          name: p.Participant_Name,
        },
      }));
    },
  },
  {
    label: "Client Participants",
    name: "clientParticipants",
    type: "select",
    multiple: true,
    apiKey: "clientParticipants",
    ui: "mui",
    optionsResolver: ({ masterData, context }) => {

      const options = masterData?.RepoList.flatMap((repo) => {
        const users = JSON.parse(repo.RepoUserList || "[]");
        return users
          .filter((user) => user.Status === "Active")
          .map((user) => ({
            label: user.UserName,
            value: {
              id: user.UserId,
              name: user.UserName,
            },
          }));
      });

      return options;
    },
    initValueResolver: ({ context }) => {
      if (!context.isEditMode) return [];
      const raw = context.entityData?.ClientParticipants;
      const parsed =
        typeof raw === "string" ? JSON.parse(raw || "[]") : (raw || []);
      return parsed.map((p) => ({
        label: p.Participant_Name,
        value: {
          id: p.Participant_Id,
          name: p.Participant_Name,
        },
      }));
    },
  },
  {
    name: "booking_Type",
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
  // {
  //   label: "Meeting Summary",
  //   name: "meeting_Summary",
  //   type: "text",
  //   ui: "mui",
  //   required: false,
  //   dataType: "string",
  //   // customComponent:FileAttachmentInput,
  //   apiKey: "meeting_summary",
  //   // fullWidth: true,
  //   initValueResolver: ({ context }) =>
  //     context.isEditMode ? context.entityData?.meeting_summary ?? "" : "",
  // },

  {
    label: "Project",
    name: "project",
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
    // customFilter: (item, selectedValue) => {
    //   if (!selectedValue) return true;
    //   const safeSelected = String(selectedValue).toLowerCase();
    //   if (
    //     item.assignedTo &&
    //     String(item.assignedTo).toLowerCase() === safeSelected
    //   ) {
    //     return true;
    //   }
    //   if (selectedValue === "__no_owner__") {
    //     return !item.assignedTo || item.assignedTo === "" || item.assignedTo === null
    //   }
    //   return false;
    // },
  },




]
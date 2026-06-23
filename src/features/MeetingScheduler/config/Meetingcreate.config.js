



import { buildOptionsResolver, calcHHMM } from "../../../app/shared/utilities/utilities";

export const MeetinglFieldConfig = () => [
  {
    name: "host_Type",
    label: "Host Type",
    type: "select",
    ui: "mui",
    apiKey: "host_type",
    dataType: "string",
    initValueResolver: ({ context }) => {
      return {
        label: "Employee",
        value: { id: "Employee", name: "Employee" }
      };
    },
    required: true,
    options: [
      { label: "Employee", value: { id: "Employee", name: "Employee" } },
      { label: "Client", value: { id: "Client", name: "Client" } },
    ],
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
    optionsResolver: ({ masterData, formData }) => {
      // 1. Employee options
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

      // 2. Repo (client) options
      const repoOptions =
        (masterData?.RepoList || []).flatMap((repo) => {
          let users = [];
          try {
            users = JSON.parse(repo.RepoUserList || "[]");
          } catch (e) {
            users = [];
          }
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

      // 3. Return based on selected host type
      const selectedType = formData?.host_Type?.value?.id;

      if (selectedType === "Employee") return employeeOptions;
      if (selectedType === "Client") return repoOptions;

      // Default empty if no type selected
      return [];
    },
    // initValueResolver: ({ context, masterData, formData }) => {
    //   const currentUserId = context?.currentUserId;

    //   if (!currentUserId) return null;

    //   const selectedType =
    //     formData?.host_Type?.value?.id || formData?.host_Type?.id;
    //     // const optionsMaster =[...masterData.EmployeeList,...masterData.RepoList]
    //   // ONLY for Employee
    //   if (selectedType != "Employee") return null;

    //   const currentUser = (masterData?.EmployeeList || []).find(
    //     (user) => user.UserID === currentUserId
    //   );

    //   if (!currentUser) return null;

    //   return {
    //     label: currentUser.UserName,
    //     value: {
    //       id: currentUser.UserID,
    //       name: currentUser.UserName,
    //     },
    //   };
    // },

    // visibleWhen: (formData) => !!formData?.host_Type,
  },
  {
    name: "recurrence_type",
    label: "Recurrence type",
    type: "select",
    ui: "mui",
    apiKey: "recurrence_type",
    dataType: "string",
    required: true,
    options: [
      { label: "One Time", value: { id: "ONETIME", name: "onetime" } },
      { label: "Daily", value: { id: "DAILY", name: "daily" } },
      { label: "Weekly", value: { id: "WEEKLY", name: "weekly" } },
    ],
    initValueResolver: ({ context }) => {
      return {
        label: "One Time",
        value: { id: "ONETIME", name: "onetime" }
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
    apiKey: "title",


  },
  {
    label: "Meeting Date",
    name: "meeting_Date",
    type: "date",
    ui: "mui",
    required: true,
    dataType: "string",
    apiKey: "meeting_Date",
    visibleWhen: (formData, context) => {
      return formData?.recurrence_type?.value?.id === "ONETIME";
    },
    initValueResolver: ({ context, formData }) => {
      const recurrenceId =
      formData?.recurrence_type?.value?.id ||
      formData?.recurrence_type?.id ||
      formData?.recurrence_type;
    const isOneTime = recurrenceId === "ONETIME";
      if (isOneTime) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      }
      return "";
    }
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
    // fullWidth: true,

    initValueResolver: ({ context }) =>
      context.isEdit ? context.entityData?.valid_from_date ?? "" : "",
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
    // fullWidth: true,

    initValueResolver: ({ context }) =>
      context.isEdit ? context.entityData?.valid_to_date ?? "" : "",
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
      const start = new Date(value);
      const now = new Date();
      // Rule 1: cannot be in the past
      if (start < now) {
        return "Start time cannot be in the past";
      }
      const hour = start.getHours();
      if (hour < 10) {
        return "Start time cannot be before 10:00 AM";
      }
      return true; // valid
    },
    initValueResolver: ({ context }) =>
      context.isEdit ? context.entityData?.start_time ?? "" : "",
  },
  {
    label: "End Time",
    name: "end_time",
    type: "flexHours",
    ui: "mui",
    required: true,
    dataType: "string",
    // customComponent:FileAttachmentInput,
    apiKey: "end_time",
    // fullWidth: true,

    initValueResolver: ({ context }) =>
      context.isEdit ? context.entityData?.end_time ?? "" : "",
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
      return formData?.recurrence_type?.value?.id === "WEEKLY";
    },
    initValueResolver: ({ context }) => {
      return context.isEdit ? (context.entityData?.recurrence_type ?? "") : "";
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
  },
  {
    label: "Client Participants",
    name: "clientParticipants",
    type: "select",
    multiple: true,
    apiKey: "clientParticipants",
    ui: "mui",
    // visibleWhen: (formData, context) => {
    //   return formData?.host_Type?.label === "Client";
    // },
    optionsResolver: ({ masterData, context }) => {
      // const repoList =
      //   masterData?.RepoList || context?.data?.RepoList || [];
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

  },

  {
    name: "booking_Type",
    label: "Meeting Type",
    type: "select",
    ui: "mui",
    apiKey: "booking_type",
    dataType: "string",
    required: true,
    options: [
      { label: "Meeting", value: { id: "meeting", name: "meeting" } },
      { label: "Interview", value: { id: "interview", name: "interview" } },
      { label: "Demo", value: { id: "demo", name: "demo" } },
      { label: "Discussion", value: { id: "discussion", name: "discussion" } },
      { label: "SupportCall", value: { id: "supportCall", name: "supportCall" } },
    ],

  },
  {
    label: "Meeting Summary",
    name: "meeting_Summary",
    type: "text",
    ui: "mui",
    required: false,
    dataType: "string",
    // customComponent:FileAttachmentInput,
    apiKey: "meeting_summary",
    // fullWidth: true,
    initValueResolver: ({ context }) =>
      context.isEdit ? context.entityData?.meeting_summary ?? "" : "",
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
      const start = formData.start_time;
      const end = formData.end_time;

      // If both times are present → calculate duration
      if (start && end) {
        return calcHHMM(start, end);
      }
      // If only one is present → invalid/incomplete state
      if ((start && !end) || (!start && end)) {
        return null;
      }

      // fallback (optional manual value support)
      return formData.slot_duration || null;
    },
  },
  {
    label: "Project",
    name: "project",
    type: "select",
    ui: "mui",
    required: false,
    dataType: "string",
    // customComponent:FileAttachmentInput,
    apiKey: "project_id",
    // fullWidth: true, 
    optionsResolver: buildOptionsResolver(
      "ProjectList", // 1. listKey
      "Id", // 2. idKey
      "Project_Name", // 3. labelKey
    ),
    initValueResolver: ({ context, masterData, formData }) => {
      const ticketId = formData?.ticket?.value?.id;
      const projectId = context?.ticketMaster
        ?.find(t => t.Issue_Id === ticketId || context.fromTicketId
        )
        ?.Project_Id;
      const project = masterData?.ProjectList
        ?.find(p => p.Id === projectId)

      return project && {
        label: project.Project_Name,
        value: { id: project.Id, name: project.Project_Name },
      };
    },
    customFilter: (item, selectedValue) => {
      if (!selectedValue) return true;

      const safeSelected = String(selectedValue).toLowerCase();
      if (
        item.assignedTo &&
        String(item.assignedTo).toLowerCase() === safeSelected
      ) {
        return true;
      }
      if (selectedValue === "__no_owner__") {
        return !item.assignedTo || item.assignedTo === "" || item.assignedTo === null
      }
      return false;
    },
  },




]
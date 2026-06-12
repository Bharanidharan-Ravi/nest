// import { buildOptionsResolver } from "../../../app/shared/utilities/utilities";

// export const MeetinglFieldConfig = () => [
//   {
//     name: "host_Type",
//     label: "Host Type",
//     type: "select",
//     ui: "mui",
//     apiKey: "host_type",
//     dataType: "string",
//     // options: statusOptions,
//     required: true,
//     options: [
//       { label: "Employee", value: { id: "Employee", name: "Employee" } },
//       { label: "Client", value: { id: "Client", name: "Client" } },
//     ],
//   },
//   {
//     label: "Host Name",
//     name: "host_Name",
//     type: "select",
//     ui: "mui",
//     required: true,
//     colSpan: 6,
//     dataType: "string",
//     apiKey: "host_id",
//     optionsResolver: buildOptionsResolver(
//       "EmployeeList",
//       "UserID",
//       "UserName",
//       (user) => user.Status === "Active",
//     ),
//   },
//   {
//     label: "Meeting title",
//     name: "title",
//     type: "text",
//     ui: "mui",
//     required: true,
//     dataType: "string",
//     // customComponent:FileAttachmentInput,
//     apiKey: "title",
//     // fullWidth: true,
//     initValueResolver: ({ context }) =>
//       context.isEdit ? context.entityData?.title ?? "" : "",
//   },
//   {
//     label: "Start Time",
//     name: "start_time",
//     type: "flexHours",
//     ui: "mui",
//     required: true,
//     dataType: "string",
//     // customComponent:FileAttachmentInput,
//     apiKey: "start_time",
//     // fullWidth: true,

//     initValueResolver: ({ context }) =>
//       context.isEdit ? context.entityData?.start_time ?? "" : "",
//   },
//   {
//     label: "End Time",
//     name: "end_time",
//     type: "flexHours",
//     ui: "mui",
//     required: true,
//     dataType: "string",
//     // customComponent:FileAttachmentInput,
//     apiKey: "end_time",
//     // fullWidth: true,

//     initValueResolver: ({ context }) =>
//       context.isEdit ? context.entityData?.end_time ?? "" : "",
//   },
//   {
//     label: "Validate From",
//     name: "validate_From",
//     type: "date",
//     ui: "mui",
//     required: false,
//     dataType: "string",
//     // customComponent:FileAttachmentInput,
//     apiKey: "valid_from_date",
//     // fullWidth: true,

//     initValueResolver: ({ context }) =>
//       context.isEdit ? context.entityData?.valid_from_date ?? "" : "",
//   },
//   {
//     label: "Validate To",
//     name: "validate_To",
//     type: "date",
//     ui: "mui",
//     required: false,
//     dataType: "string",
//     // customComponent:FileAttachmentInput,
//     apiKey: "valid_to_date",
//     // fullWidth: true,

//     initValueResolver: ({ context }) =>
//       context.isEdit ? context.entityData?.valid_to_date ?? "" : "",
//   },
//   {
//     label: "Internal Participants",
//     name: "internalParticipants",
//     type: "select",
//     multiple: true,
//     ui: "mui",
//     optionsResolver: buildOptionsResolver(
//       "EmployeeList",
//       "UserID",
//       "UserName",
//       (user) => user.Status === "Active", // 👈 Simple 1-condition filter
//     ),
//   },
//   {
//     label: "Client Participants",
//     name: "clientParticipants",
//     type: "select",
//     multiple: true,
//     ui: "mui",
// visibleWhen: (formData, context) => {
//   return formData?.host_Type?.label === "Client";
// },
//     optionsResolver: ({ masterData, context }) => {
//       const repoList =
//         masterData?.RepoList || context?.data?.RepoList || [];
//       const options = repoList.flatMap((repo) => {
//         const users = JSON.parse(repo.RepoUserList || "[]");
//         return users
//           .filter((user) => user.Status === "Active")
//           .map((user) => ({
//             label: user.UserName,
//             value: {
//               id: user.UserId,
//               name: user.UserName,
//             },
//           }));
//       });

//       return options;
//     },

//   },

//   // {
//   //   name: "meet_Method",
//   //   label: "Meet Method",
//   //   type: "select",
//   //   ui: "mui",
//   //   apiKey: "meet_method",
//   //   dataType: "string",
//   //   // options: statusOptions,
//   //   required: true,
//   //   options: [
//   //     { label: "Online", value: { id: "Online", name: "Online" } },
//   //     { label: "Offline", value: { id: "Offline", name: "Offline" } },
//   //   ],

//   //   initValueResolver: ({ context }) => {
//   //     return context.isEdit ? (context.entityData?.meet_method ?? "") : "";
//   //   },
//   // },
//   {
//     name: "recurrence_type",
//     label: "Recurrence type",
//     type: "select",
//     ui: "mui",
//     apiKey: "recurrence_type",
//     dataType: "string",
//     required: true,
//     options: [
//       { label: "One Time", value: { id: "onetime", name: "online" } },
//       { label: "Daily", value: { id: "daily", name: "daily" } },
//       { label: "Weekly", value: { id: "weekly", name: "weekly" } },
//     ],

//     initValueResolver: ({ context }) => {
//       return context.isEdit ? (context.entityData?.recurrence_type ?? "") : "";
//     },

//   },
//   {
//     name: "booking_Type",
//     label: "Booking Type",
//     type: "select",
//     ui: "mui",
//     apiKey: "booking_type",
//     dataType: "string",
//     required: true,
//     options: [
//       { label: "Meeting", value: { id: "meeting", name: "meeting" } },
//       { label: "Interview", value: { id: "interview", name: "interview" } },
//       { label: "Demo", value: { id: "demo", name: "demo" } },
//       { label: "Discussion", value: { id: "discussion", name: "discussion" } },
//       { label: "SupportCall", value: { id: "supportCall", name: "supportCall" } },
//     ],

//     initValueResolver: ({ context }) => {
//       return context.isEdit ? (context.entityData?.booking_type ?? "") : "";
//     },

//   },
//   // {
//   //   label: "Meet Link",
//   //   name: "meet_Link",
//   //   type: "text",
//   //   ui: "mui",
//   //   required: false,
//   //   dataType: "string",
//   //   apiKey: "meet_link",


//   //   initValueResolver: ({ context }) =>
//   //     context.isEdit ? context.entityData?.meet_link ?? "" : "",
//   // },
//   // {
//   //   label: "Meeting Password",
//   //   name: "meeting_Password",
//   //   type: "text",
//   //   ui: "mui",
//   //   required: false,
//   //   dataType: "string",
//   //   // customComponent:FileAttachmentInput,
//   //   apiKey: "meet_password",
//   //   // fullWidth: true,

//   //   initValueResolver: ({ context }) =>
//   //     context.isEdit ? context.entityData?.meet_password ?? "" : "",
//   // },
//   {
//     label: "Meeting Summary",
//     name: "meeting_Summary",
//     type: "text",
//     ui: "mui",
//     required: true,
//     dataType: "string",
//     // customComponent:FileAttachmentInput,
//     apiKey: "meeting_summary",
//     // fullWidth: true,
//     initValueResolver: ({ context }) =>
//       context.isEdit ? context.entityData?.meeting_summary ?? "" : "",
//   },
//   {
//     label: "Slot Duration",
//     name: "slot_Duration",
//     type: "flexHours",
//     ui: "mui",
//     required: true,
//     dataType: "string",
//     // customComponent:FileAttachmentInput,
//     apiKey: "slot_duration",
//     // fullWidth: true,

//     initValueResolver: ({ context }) =>
//       context.isEdit ? context.entityData?.slot_duration ?? "" : "",
//   },
//   {
//     label: "Project",
//     name: "project",
//     type: "select",
//     ui: "mui",
//     required: true,
//     dataType: "string",
//     // customComponent:FileAttachmentInput,
//     apiKey: "project_id",
//     // fullWidth: true, 
//     optionsResolver: buildOptionsResolver(
//       "ProjectList", // 1. listKey
//       "Id", // 2. idKey
//       "Project_Name", // 3. labelKey
//     ),
//     initValueResolver: ({ context }) =>
//       context.isEdit ? context.entityData?.project_id ?? "" : "",

//     customFilter: (item, selectedValue) => {
//       if (!selectedValue) return true;

//       const safeSelected = String(selectedValue).toLowerCase();
//       if (
//         item.assignedTo &&
//         String(item.assignedTo).toLowerCase() === safeSelected
//       ) {
//         return true;
//       }
//       if (selectedValue === "__no_owner__") {
//         return !item.assignedTo || item.assignedTo === "" || item.assignedTo === null
//       }

//       return false;
//     },
//   },




// ]





import { buildOptionsResolver } from "../../../app/shared/utilities/utilities";

export const MeetinglFieldConfig = () => [
  {
    name: "host_Type",
    label: "Host Type",
    type: "select",
    ui: "mui",
    apiKey: "host_type",
    dataType: "string",
    // options: statusOptions,
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
    // fullWidth: true,
    visibleWhen: (formData, context) => {
      return formData?.recurrence_type?.value?.id === "ONETIME";
    },
    initValueResolver: ({ context, formData }) => {
      const type = formData?.recurrence_type?.value?.id;
    
      if (type === "ONETIME") {
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
    // customComponent:FileAttachmentInput,
    apiKey: "start_time",
    // fullWidth: true,

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
      console.log("formData", formData);

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
    label: "Booking Type",
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
    required: true,
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
    // customComponent:FileAttachmentInput,
    apiKey: "slot_duration",
    // fullWidth: true,

    // initValueResolver: ({ context }) =>
    //   context.isEdit ? context.entityData?.slot_duration ?? "" : "",
  },
  {
    label: "Project",
    name: "project",
    type: "select",
    ui: "mui",
    required: true,
    dataType: "string",
    // customComponent:FileAttachmentInput,
    apiKey: "project_id",
    // fullWidth: true, 
    optionsResolver: buildOptionsResolver(
      "ProjectList", // 1. listKey
      "Id", // 2. idKey
      "Project_Name", // 3. labelKey
    ),
    initValueResolver: ({ context, masterData, formData }) =>{
      const ticketId = formData?.ticket?.value?.id;

      const projectId = context?.TicketMaster
        ?.find(t => t.Issue_Id === ticketId)
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
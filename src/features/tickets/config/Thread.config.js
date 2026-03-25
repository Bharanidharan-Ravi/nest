import {
  calcHHMM,
  formatTimeHHMM,
} from "../../../app/shared/utilities/utilities";

export const ThreadFieldConfig = (ticketId) => [
  {
    label: "Description",
    name: "description",
    type: "adEditor",
    ui: "editor",
    // required: true,
    dataType: "string",
    apiKey: "Comment",
    initValueResolver: ({ context }) => context?.editingItem?.description || "",
    // 🔥 1. DYNAMIC REQUIRED FLAG
    // This tells the UI when to show the red '*' asterisk
    requiredWhen: (context, formData) => {
      // Devs and Testers ALWAYS must enter a description
      if (context?.userRole !== "Owner") return true;

      // For Owners: Check if they filled out any other action fields
      const hasHours = !!formData?.hours || !!formData?.fromTime;
      const hasAssignee = formData?.assignees?.length > 0;
      const hasStatus = !!formData?.UpdateStatus;

      // If they picked an assignee, status, or hours -> Description is OPTIONAL (false)
      // If they haven't picked anything at all -> Description is MANDATORY (true)
      return !hasHours && !hasAssignee && !hasStatus;
    },

    // 🔥 2. CUSTOM ERROR MESSAGE
    // This overrides the default "Description is required" with your friendly text
    customValidator: (value, formData, context) => {
      if (context?.userRole === "Owner") {
        const hasHours = !!formData?.hours || !!formData?.fromTime;
        const hasAssignee = formData?.AssignedTo?.length > 0;
        const hasStatus = !!formData?.UpdateStatus;

        // If absolutely everything is empty, trigger the friendly native error!
        if (!value && !hasHours && !hasAssignee && !hasStatus) {
          return "Please provide a comment, log hours, or select a user to assign.";
        }
      }
      return true; // Form is valid!
    },
  },

  {
    name: "issueId",
    apiKey: "IssueId",
    hidden: true,
    defaultValue: ticketId,
    dataType: "string",
    initValueResolver: ({ context }) =>
      context?.editingItem?.Issue_Id || ticketId,
  },
   {
    name: "workStreamId",
    apiKey: "WorkStreamId", // 👈 The exact name your API expects
    hidden: true,           // 👈 Keeps it invisible in the UI
    dataType: "string",
    initValueResolver: ({ context }) => {
      // console.log("context :", context.activeWorkStream.StreamId);
      
      // Pulls the StreamId directly from the sidebar card they clicked!
      return context?.activeWorkStream?.StreamId || null;
    },
  },
  {
    label: "From-time (24h Format)",
    name: "fromTime",
    type: "time",
    ui: "mui",
    required: false,
    colSpan: 3,
    dataType: "dateTime",
    apiKey: "From_Time",
    initValueResolver: ({ context }) =>
      formatTimeHHMM(context?.editingItem?.fromTime),
    disableWhen: (context) => Boolean(context?.formData?.hours),
    // errorMessage: "Only alphanumeric allowed",
  },
  {
    label: "To-time (24h Format)",
    name: "toTime",
    type: "time",
    ui: "mui",
    required: false,
    colSpan: 3,
    dataType: "dateTime",
    apiKey: "To_Time",
    errorMessage: "To-time cannot be earlier than From-time",
    initValueResolver: ({ context }) =>
      formatTimeHHMM(context?.editingItem?.toTime),
    disableWhen: (context) => Boolean(context?.formData?.hours),
  },

  {
    name: "hours",
    apiKey: "Hours",
    type: "time",
    ui: "mui",
    label: "Total Hours",
    dataType: "string",
    required: false,
    defaultValue: null,
    effectResolver: (formData) => {
      const hours = calcHHMM(formData.fromTime, formData.toTime);
      return hours;
    },
    colSpan: 3,
    effectDependencies: ["fromTime", "toTime"],
    initValueResolver: ({ context }) => context?.editingItem?.Hours,
    effectResolver: (formData) => {
      if (formData.fromTime && formData.toTime) {
        const hours = calcHHMM(formData.fromTime, formData.toTime);
        return hours;
      }

      if (formData.hours) {
        formData.fromTime = null;
        formData.toTime = null;
      }

      return formData.hours || null;
    },
    effectDependencies: ["formTime", "toTime", "hours"],
    requiredWhen: (context) => context?.userRole !== "Owner",
  },

 {
    name: "UpdateStatus",
    label: "Update Status",
    type: "select",
    ui: "mui",
    className: "col-span-12 md:col-span-4",

    // 🔥 VALIDATION FIX: Only required for the Owner if they picked an assignee
    requiredWhen: (context, formData) => {
      if (context?.userRole !== "Owner") return false;
      return !!(formData?.assignees && formData.assignees.length > 0);
    },

    optionsResolver: ({ masterData, context }) => {
      let Status = masterData?.StatusMaster || [];
      const uniqueOptions = [];
      const seenIds = new Set();

      Status.forEach((sta) => {
        const id = sta.Status_Id || sta.status_id;
        const name = sta.Status_Name || sta.status_name;

        if (id && !seenIds.has(id)) {
          seenIds.add(id);
          uniqueOptions.push({
            label: name,
            value: { id, name },
          });
        }
      });
      return uniqueOptions;
    },

    initValueResolver: ({ context }) => {
      if (context?.userRole === "Tester")
        return { label: "Testing In Progress", value: { id: 8 } };
      return null;
    },

    // Status is ONLY visible to the Owner
    visibleWhen: (formData, context) => 
      context?.userRole === "Owner",
  },
  {
    label: "Assignees",
    name: "assignees",
    type: "select",
    ui: "mui",
    multiple: true,
    required: false,
    dataType: "string",
    apiKey: "NextAssignees", 

    // 🔥 VALIDATION FIX: Only required for the Owner if they picked a status
    requiredWhen: (context, formData) => {
      if (context?.userRole !== "Owner") return false;
      return !!formData?.UpdateStatus;
    },

    transform: (mappedArray, formData) => {
      const streamId = formData?.UpdateStatus?.value?.id || 0;
      return mappedArray.map((item) => ({
        Id: item.id,
        StreamId: streamId,
      }));
    },

   optionsResolver: ({ masterData, context }) => {
      let Employee = masterData?.EmployeeList || [];
      
      // Get the currently logged-in user's ID
      const myUserId = context?.currentUser?.userId?.toLowerCase();

      // 🔥 Automatically filter out the logged-in user so they can't pick themselves!
      if (myUserId) {
        Employee = Employee.filter((p) => p.UserID?.toLowerCase() !== myUserId);
      }

      return Employee.map((emp) => ({
        label: emp.UserName,
        value: { id: emp.UserID, name: emp.UserName },
      }));
    },
    
    initValueResolver: ({ context, formData }) => {
      if (context.isEdit && context.entityData && Array.isArray(context.entityData.multiAssignees)) {
        return context.entityData.multiAssignees
          .filter((assignee) => assignee.Assignee_Type !== "Main Assignee")
          .map((assignee) => ({
            label: assignee.Assignee_Name,
            value: { id: assignee.Assignee_Id, name: assignee.Assignee_Name },
          }));
      }
      return [];
    },

    // 🔥 VISIBILITY FIX: Now only visible to Devs and Owners (hidden for Testers)
    visibleWhen: (formData, context) => 
      context?.userRole === "Dev" || context?.userRole === "Owner",
  },
  // {
  //   name: "AssignedTo",
  //   label: "Assign To",
  //   type: "select",
  //   apiKey: "NextAssigneeId",
  //   ui: "mui",
  //   className: "col-span-12 md:col-span-4",
  //   // Pass your Master Data employee list here
  //   optionsResolver: ({ masterData }) =>
  //     masterData?.EmployeeList?.map((emp) => ({
  //       label: emp.UserName,
  //       value: {
  //         id: emp.UserID,
  //         name: emp.UserName,
  //       },
  //     })) || [],
  //   disableWhen: (context, formData) => {
  //     const currentStatus = formData?.UpdateStatus?.value;

  //     // Return true if it should be disabled, false if it should be enabled
  //     return (
  //       currentStatus === "AWAITING_CLIENT" ||
  //       currentStatus === "HOLD" ||
  //       currentStatus === "IN_PROGRESS"
  //     );
  //   },
  //   visibleWhen: (formData, context) => 
  //     context?.userRole === "Dev" || context?.userRole === "Owner",
  // },
  {
    name: "CompletionPercentage",
    label: "% Completed",
    type: "text",
    ui: "mui",
    apiKey: "CompletionPct",
    colSpan: 3,
    // Optional: Only show percentage if it's In Progress or Testing
    disableWhen: (context, formData) => {
      const currentStatus = formData?.UpdateStatus?.value;

      // Return true if it should be disabled, false if it should be enabled
      return currentStatus === "AWAITING_CLIENT" || currentStatus === "HOLD";
    },
  },
  // {
  //   name: "UseLastComment",
  //   label: "Use my previous thread comment",
  //   type: "toggle", // Matches the key in inputRegistry
  //   ui: "mui",
  //   colSpan: 12,
  //   apiKey: "UseLastThread",
  //   initValueResolver: () => false, // Ensure it starts 'off'
  // },

  //   {
  //   label: "Calculated Hours",
  //   name: "calculatedHours",
  //   type: "text",
  //   ui: "mui",
  //   required: false,
  //   dataType: "string",
  //   apiKey: "Hours",
  //   defaultValue: null,
  //   readOnly: true,
  //   effectResolver: (formData) => {
  //     const hours = calcHHMM(formData.fromTime, formData.toTime);
  //     return hours;
  //   },
  //   effectDependencies: ["fromTime", "toTime"],
  // },
];

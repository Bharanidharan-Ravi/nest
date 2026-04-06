import {
  calcHHMM,
  formatTimeHHMM,
} from "../../../app/shared/utilities/utilities";

const isTimeLocked = (context) => {
  if (!context?.isEdit ) return false;
  if (!context?.editingItem?.createdAt) return false;
  
  const createdDate = new Date(context.editingItem.createdAt);
  const today = new Date();
  
  // Normalize to midnight to calculate strict day differences (ignoring hours/minutes)
  const createdDay = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());
  const currentDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  const diffDays = (currentDay - createdDay) / (1000 * 60 * 60 * 24);
  
  return diffDays > 1; // Returns true if it is older than Yesterday
};

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
    hidden: true, // 👈 Keeps it invisible in the UI
    dataType: "string",
    initValueResolver: ({ context }) => {
      // Pulls the StreamId directly from the sidebar card they clicked!
      return context?.activeWorkStream?.StreamId || null;
    },
  },
  {
    name: "handsoffId",
    apiKey: "handsoffId", // 👈 The exact name your API expects
    hidden: true, // 👈 Keeps it invisible in the UI
    dataType: "string",
    initValueResolver: ({ context }) => {
      // Pulls the StreamId directly from the sidebar card they clicked!
      return context?.selectedHandoffId || null;
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
    // 🔥 FIX: Check 1-day lock first, then check if hours are populated
    disableWhen: (context, formData) => {
      if (isTimeLocked(context)) return true;
      // return Boolean(formData?.hours);
    },
    customValidator: (value, formData) => {
      if (formData.toTime && !value) return "Required if To-time is entered";
      return true;
    },
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
    initValueResolver: ({ context }) =>
      formatTimeHHMM(context?.editingItem?.toTime),
    disableWhen: (context, formData) => {
      if (isTimeLocked(context)) return true;
      // return Boolean(formData?.hours);
    },
    // 🔥 FIX 3: Enforce pair validation & logic check
    customValidator: (value, formData) => {
      if (formData.fromTime && !value) return "Required if From-time is entered";
      if (formData.fromTime && value && value < formData.fromTime) return "Cannot be earlier than From-time";
      return true;
    }
  },
  {
    name: "hours",
    apiKey: "Hours",
    type: "time",
    ui: "mui",
    label: "Total Hours",
    dataType: "string",
    required: false,
    colSpan: 3,
    initValueResolver: ({ context }) => context?.editingItem?.Hours,

    // 🔥 FIX 1: Removed duplicate properties & fixed "formTime" typo to "fromTime"
    effectDependencies: ["fromTime", "toTime"],
    effectResolver: (formData) => {      
      // 1. If both times exist, instantly calculate and return
      if (formData.fromTime && formData.toTime) {
        return calcHHMM(formData.fromTime, formData.toTime);
      }

      // 🔥 FIX 2: Stop aggressively wiping out fromTime/toTime!
      // 2. If the user clears one of the time boxes, clear the calculated hours so it doesn't get stuck
      if (
        (formData.fromTime && !formData.toTime) ||
        (!formData.fromTime && formData.toTime)
      ) {
        return null;
      }

      // 3. Otherwise, return the manually typed hours
      return formData.hours || null;
    },

   disableWhen: (context, formData) => {      
      if (isTimeLocked(context)) return true;
      return Boolean(formData?.fromTime && formData?.toTime);
    },

    forceSubmit: (context) => context.isEdit !== true, // 🔥 FIX 4: Allow hours to be submitted even if disabled, but ONLY on edit (not create)
    // 🔥 FIX: Dynamic Validation based on Role, Description, and Lock Status
    customValidator: (value, formData, context) => {
      // 1. If locked due to the 1-day rule, we cannot force them to enter data.
      if (isTimeLocked(context)) return true;

      const hasBothTimes = !!formData.fromTime && !!formData.toTime;
      const hasManualHours = !!value;

      // 2. OWNER LOGIC
      if (context?.userRole === "Owner") {
        // Strip HTML tags to see if they actually typed something
        const cleanDesc = formData.description?.replace(/<[^>]*>?/gm, "").trim();
        const hasDescription = !!cleanDesc;

        // If Assign-Only (no description), time is optional
        if (!hasDescription) return true;

        // If they typed a description, time becomes mandatory
        if (!hasManualHours && !hasBothTimes) {
          return "Time logging is required when adding a comment.";
        }
        return true; 
      }

      // 3. DEV / TESTER LOGIC (Always mandatory)
      if (!hasManualHours && !hasBothTimes) {
        return "Please enter Total Hours, OR both From and To times.";
      }

      return true;
    },
  },

  //  {
  //     name: "UpdateStatus",
  //     label: "Update Status",
  //     type: "select",
  //     ui: "mui",
  //     className: "col-span-12 md:col-span-4",

  //     // 🔥 VALIDATION FIX: Only required for the Owner if they picked an assignee
  //     // requiredWhen: (context, formData) => {
  //     //   if (context?.userRole !== "Owner") return false;
  //     //   return !!(formData?.assignees && formData.assignees.length > 0);
  //     // },

  //     optionsResolver: ({ masterData, context }) => {
  //       let Status = masterData?.StatusMaster || [];
  //       const uniqueOptions = [];
  //       const seenIds = new Set();

  //       Status.forEach((sta) => {
  //         const id = sta.Status_Id || sta.status_id;
  //         const name = sta.Status_Name || sta.status_name;

  //         if (id && !seenIds.has(id)) {
  //           seenIds.add(id);
  //           uniqueOptions.push({
  //             label: name,
  //             value: { id, name },
  //           });
  //         }
  //       });
  //       return uniqueOptions;
  //     },

  //     initValueResolver: ({ context }) => {
  //       if (context?.userRole === "Tester")
  //         return { label: "Testing In Progress", value: { id: 8 } };
  //       return null;
  //     },

  //     // Status is ONLY visible to the Owner
  //     visibleWhen: (formData, context) =>
  //       context?.userRole === "Owner",
  //   },
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
    // requiredWhen: (context, formData) => {
    //   if (context?.userRole !== "Owner") return false;
    //   return !!formData?.UpdateStatus;
    // },

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
      
      if (
        context.isEdit &&
        context.entityData &&
        Array.isArray(context.entityData.multiAssignees)
      ) {
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
    // visibleWhen: (formData, context) =>
    //   context?.userRole === "Dev" || context?.userRole === "Owner",
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

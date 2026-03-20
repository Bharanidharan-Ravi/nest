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
    requiredWhen: (context) => context?.userRole !== "Owner",
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
    apiKey: "NextAssigneeStreamId",
    // required: true,
    // Add standard widths so they sit in a neat row
    className: "col-span-12 md:col-span-4",
    optionsResolver: ({ masterData, context, formData }) => {
      let Status = masterData?.StatusMaster || [];

      // ── 1. DEVELOPER ROLE ───────────────────────────────────────
      if (context?.userRole === "Dev") {
        const devAllowedIds = [5, 6, 8];
        const devLabels = {
          5: "In Development",
          6: "Development Completed",
          8: "Move to Testing", // Custom UX label
        };

        return Status.filter((sta) =>
          devAllowedIds.includes(sta.Status_Id),
        ).map((sta) => ({
          // Use the custom label if it exists, otherwise fallback to DB name
          label: devLabels[sta.Status_Id] || sta.Status_Name,
          value: {
            id: sta.Status_Id,
            name: sta.Status_Name, // Keep the actual DB name in the payload
          },
        }));
      }

      // ── 2. TESTER ROLE ──────────────────────────────────────────
      if (context?.userRole === "Tester") {
        // Testers stay in their assigned testing phase
        const testerAllowedIds = [7, 8, 9]; // Unit, Functional, UAT

        return Status.filter((sta) =>
          testerAllowedIds.includes(sta.status_id),
        ).map((sta) => ({
          label: sta.status_name, // e.g., "Functional Testing"
          value: { id: sta.status_id, name: sta.status_name },
        }));
      }
      console.log("context :", context, Status);

      return Status.map((sta) => ({
        label: sta.Status_Name,
        value: {
          id: sta.Status_Id,
          name: sta.Status_Name,
        },
      }));
    },
    initValueResolver: ({ context }) => {
      if (context?.userRole === "Dev")
        return { label: "In Development", value: { id: 5 } };
      if (context?.userRole === "Tester")
        return { label: "Testing In Progress", value: { id: 8 } };
      return null;
    },
    visibleWhen: (formData, context) => context?.userRole === "Owner",
  },
  {
    name: "AssignedTo",
    label: "Assign To",
    type: "select",
    apiKey: "NextAssigneeId",
    ui: "mui",
    className: "col-span-12 md:col-span-4",
    // Pass your Master Data employee list here
    optionsResolver: ({ masterData }) =>
      masterData?.EmployeeList?.map((emp) => ({
        label: emp.UserName,
        value: {
          id: emp.UserID,
          name: emp.UserName,
        },
      })) || [],
    disableWhen: (context, formData) => {
      const currentStatus = formData?.UpdateStatus?.value;

      // Return true if it should be disabled, false if it should be enabled
      return (
        currentStatus === "AWAITING_CLIENT" ||
        currentStatus === "HOLD" ||
        currentStatus === "IN_PROGRESS"
      );
    },
    visibleWhen: (formData, context) => 
      context?.userRole === "Dev" || context?.userRole === "Owner",
  },
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

import { calcHHMM, formatTimeHHMM } from "../../../app/shared/utilities/utilities";

export const ThreadFieldConfig = (ticketId) => [
  {
    label: "Description",
    name: "description",
    type: "adEditor",
    ui: "editor",
    required: true,
    dataType: "string",
    apiKey: "CommentText",
    initValueResolver: ({context}) => context?.editingItem?.description || "",
  },

  {
    name: "issueId",
    apiKey: "Issue_Id",
    hidden: true,
    defaultValue: ticketId,
    dataType: "string",
    initValueResolver: ({context}) => context?.editingItem?.Issue_Id || ticketId,
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
    initValueResolver: ({context}) => formatTimeHHMM(context?.editingItem?.fromTime),
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
    initValueResolver: ({context}) => formatTimeHHMM(context?.editingItem?.toTime),
    disableWhen: (context) => Boolean(context?.formData?.hours)
  },

  {
    name: "hours",
    apiKey: "Hours",
    type: "time",
    ui: "mui",
    label: "Total Hours",
    dataType: "string",
    defaultValue: null,
    effectResolver: (formData) => {
      const hours = calcHHMM(formData.fromTime, formData.toTime);
      return hours;
    },
    colSpan: 3,
    effectDependencies: ["fromTime", "toTime"],
    initValueResolver: ({context}) => context?.editingItem?.Hours,
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
  },
  // {
  //   name: "UpdateStatus",
  //   label: "Update Status",
  //   type: "select",
  //   ui: "mui",
  //   apiKey: "StreamName",
  //   required: true,
  //   // Add standard widths so they sit in a neat row
  //   className: "col-span-12 md:col-span-4",
  //   options: [
  //     {
  //       label: "In Progress",
  //       value: {
  //         id: "IN_PROGRESS",
  //         value: "IN_PROGRESS",
  //       },
  //     },
  //     {
  //       label: "Moved to Testing",
  //       value: {
  //         id: "TESTING",
  //         value: "TESTING",
  //       },
  //     },
  //     {
  //       label: "Awaiting Client Response",
  //       value: { id: "AWAITING_CLIENT", value: "AWAITING_CLIENT" },
  //     },
  //     { label: "On Hold", value: { id: "HOLD", value: "HOLD" } },
  //   ],
  //   initValueResolver: () => {
  //     return {
  //       label: "In Progress",
  //       value: { id: "IN_PROGRESS", value: "IN_PROGRESS" },
  //     };
  //   },
  // },
  // {
  //   name: "AssignedTo",
  //   label: "Assign To",
  //   type: "select",
  //   apiKey: "ResourceId",
  //   ui: "mui",
  //   className: "col-span-12 md:col-span-4",
  //   // Pass your Master Data employee list here
  //   optionsResolver: (masterData) =>
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

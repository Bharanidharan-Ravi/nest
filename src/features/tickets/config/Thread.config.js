import {
  calcHHMM,
  formatTimeHHMM,
} from "../../../app/shared/utilities/utilities";
import TicketProgressHistory from "../pages/TicketProgressHistory";

const isTimeLocked = (context) => {
  if (!context?.isEdit) return false;
  if (!context?.editingItem?.createdAt) return false;

  const createdDate = new Date(context.editingItem.createdAt);
  const today = new Date();

  // Normalize to midnight to calculate strict day differences (ignoring hours/minutes)
  const createdDay = new Date(
    createdDate.getFullYear(),
    createdDate.getMonth(),
    createdDate.getDate(),
  );
  const currentDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const diffDays = (currentDay - createdDay) / (1000 * 60 * 60 * 24);

  return diffDays > 1; // Returns true if it is older than Yesterday
};

export const ThreadFieldConfig = (ticketId) => [
  {
    label: "Description",
    name: "description",
    type: "adEditor",
    ui: "editor",
    dataType: "string",
    apiKey: "CommentText",
    initValueResolver: ({ context }) => context?.editingItem?.description || "",

    // 🔥 Show the red asterisk if they entered time
    requiredWhen: (context, formData) => {
      return !!formData?.hours || !!formData?.fromTime;
    },

    // 🔥 Throw an error if they entered time but no description
    customValidator: (value, formData) => {
      const hasTime = !!formData?.hours || !!formData?.fromTime;
      const cleanDesc = value?.replace(/<[^>]*>?/gm, "").trim();

      if (hasTime && !cleanDesc) {
        return "Description is mandatory when logging hours.";
      }
      return true;
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
    apiKey: "WorkStreamId",
    hidden: true,
    dataType: "string",
    initValueResolver: ({ context }) => {
      // 1. Edit Mode: Take the workStreamId attached to the thread being edited
      if (context?.isEdit) {
        return context?.editingItem?.workStreamId || null;
      }

      // 2. Create Mode: Try the active work stream first, fallback to the last valid stream if empty
      return (
        context?.activeWorkStream?.StreamId ||
        context?.lastValidStreamId ||
        null
      );
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
    name: "resourceId",
    apiKey: "ResourceId", // 👈 The exact name your API expects
    hidden: true, // 👈 Keeps it invisible in the UI
    dataType: "string",
    initValueResolver: ({ context }) => {
      // Pulls the StreamId directly from the sidebar card they clicked!
      return context?.editingItem?.CreatedId || null;
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
      if (formData.fromTime && !value)
        return "Required if From-time is entered";
      if (formData.fromTime && value && value < formData.fromTime)
        return "Cannot be earlier than From-time";
      return true;
    },
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

    effectDependencies: ["fromTime", "toTime"],
    effectResolver: (formData) => {
      if (formData.fromTime && formData.toTime) {
        return calcHHMM(formData.fromTime, formData.toTime);
      }
      if (
        (formData.fromTime && !formData.toTime) ||
        (!formData.fromTime && formData.toTime)
      ) {
        return null;
      }
      return formData.hours || null;
    },

    disableWhen: (context, formData) => {
      if (isTimeLocked(context)) return true;
      return Boolean(formData?.fromTime && formData?.toTime);
    },

    forceSubmit: (context) => context.isEdit !== true,

    // 🔥 Throw an error if they entered a description but no time
    customValidator: (value, formData, context) => {
      if (isTimeLocked(context)) return true;

      const hasTime = !!value || (!!formData.fromTime && !!formData.toTime);
      const cleanDesc = formData.description?.replace(/<[^>]*>?/gm, "").trim();
      const hasDescription = !!cleanDesc;

      if (hasDescription && !hasTime) {
        return "Time logging is mandatory when entering a description.";
      }

      return true;
    },
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
    initValueResolver: ({ context, formData }) => {
      return (
        context?.editingItem?.CompletionPct ||
        formData?.CompletionPercentage ||
        null
      );
    },
  },
  {
    label: "Assignees",
    name: "assignees",
    type: "select",
    ui: "mui",
    multiple: true,
    colSpan: 6,
    required: false,
    dataType: "string",
    apiKey: "NextAssignees",

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
        context.editingItem &&
        Array.isArray(context.editingItem?.assignees)
      ) {
        return context.editingItem?.assignees.filter(
          (assignee) => assignee.Assignee_Type !== "Main Assignee",
        );
      }
      return [];
    },

    // 🔥 VISIBILITY FIX: Now only visible to Devs and Owners (hidden for Testers)
    visibleWhen: (formData, context) => {
      return !context?.isEdit;
    },
  },
  {
    label: "Contributor",
    name: "Contributor",
    type: "select",
    ui: "mui",
    colSpan: 6,
    multiple: true,
    required: false,
    dataType: "string",
    apiKey: "CoContributors",
    optionsResolver: ({ masterData, context }) => {
      let Employee = masterData?.EmployeeList || [];

      // Get the currently logged-in user's ID
      const myUserId = context?.currentUser?.userId?.toLowerCase();

      // Automatically filter out the logged-in user so they can't pick themselves!
      if (myUserId) {
        Employee = Employee.filter((p) => p.UserID?.toLowerCase() !== myUserId);
      }

      return Employee.map((emp) => ({
        label: emp.UserName,
        value: { id: emp.UserID, name: emp.UserName },
      }));
    },

    // 🔥 1. FIX: Load the saved Co-Contributors when the edit form opens!
    initValueResolver: ({ context }) => {
      if (context?.isEdit && Array.isArray(context?.editingItem?.CoContributors)) {
        // Map the saved API data back into the format the MUI Dropdown expects
        return context.editingItem.CoContributors.map((c) => ({
          label: c.name,
          value: { id: c.id, name: c.name },
        }));
      }
      return [];
    },

    // 🔥 2. FIX: Allow the field to be visible during Edit mode!
    visibleWhen: () => {
      return true; 
    },

    // 🔥 3. FIX: Lock the field so it cannot be edited if older than 1 day
    disableWhen: (context) => {
      return isTimeLocked(context);
    },
  },
  {
    name: "requestClose",
    apiKey: "IsCloseRequested", // 🔥 Automatically maps to your C# DTO!
    label: "Request Ticket Closure (Notify Owner)",
    type: "switch",
    ui: "mui",
    colSpan: 4, 
    initValueResolver: () => false,
    // 1. Only show this toggle to Developers and Testers (Owners can just close it)
    visibleWhen: (formData, context) => {
      return context?.userRole !== "Owner";
    },

    // 2. Force them to write a comment if they flip this switch ON
    customValidator: (value, formData) => {
      if (value === true) {
        const cleanDesc = formData?.description?.replace(/<[^>]*>?/gm, "").trim();
        if (!cleanDesc) {
          return "Please provide a description explaining why this ticket is ready to be closed.";
        }
      }
      return true;
    }
  },
  {
    name: "TicketProgressHistoryWidget",
    type: "custom", // You can name this whatever you want now
    customComponent: TicketProgressHistory, // 👈 PASS THE REACT COMPONENT HERE
    colSpan: 12,
    visibleWhen: (formData, context) => !context?.isEdit,
    groupName: "Ticket Status Update",
    options: {
      ticketId: ticketId // 👈 Pass the ticketId here so FormEngine forwards it
    },
  },
  {
    name: "copyDescription",
    label: "Use Description as Status Summary",
    type: "checkbox", // Or "switch", depending on your inputRegistry
    ui: "mui", // Or "html"
    colSpan: 3, // Spans the full width just under the header
    groupName: "Ticket Status Update",

    // Only show this checkbox if there is actual text in the description
   visibleWhen: (formData, context) => {
      // 🔥 2. Hide in Edit Mode
      if (context?.isEdit) return false;

      const cleanDesc = formData?.description?.replace(/<[^>]*>?/gm, "").trim();
      return !!cleanDesc;
    },
  },

  // 🔥 2. The Status Summary (Updated to listen to the checkbox)
  {
    name: "TicketStatusSummary",
    label: "Current Status Summary",
    type: "text",
    ui: "mui",
    apiKey: "TicketStatusSummary",
    colSpan: 6,
    groupName: "Ticket Status Update",
visibleWhen: (formData, context) => !context?.isEdit,
    // Listen for changes to the checkbox OR the description
    effectDependencies: ["copyDescription", "description"],
    effectResolver: (formData) => {
      // If the checkbox is checked, grab the description and strip the HTML tags
      if (formData.copyDescription) {
        const cleanDesc = formData.description
          ?.replace(/<[^>]*>?/gm, "")
          .trim();
        return cleanDesc || "";
      }

      // If checkbox is unchecked, just keep whatever they manually typed in this box
      return formData.TicketStatusSummary || "";
    },
  },
  {
    name: "TicketOverallPercentage",
    label: "Overall Ticket Progress (%)",
    type: "battery", // Or "number" depending on your registry
    ui: "mui",
    visibleWhen: (formData, context) => !context?.isEdit,
    apiKey: "TicketOverallPercentage", // Matches your updated PostWorkStreamDto
    colSpan: 3,
    options: {
      step: 10,
      max: 100,
      height: "25px",
      width: "12px",
      fontSize: "14px",
    },
    groupName: "Ticket Status Update", // 👈 This triggers the Header
  },
];

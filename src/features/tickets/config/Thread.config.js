import {
  buildOptionsResolver,
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
    customValidator: (value, formData, context) => {
      const hasTime = !!formData?.hours || !!formData?.fromTime;
      const cleanDesc = value?.replace(/<[^>]*>?/gm, "").trim();
      if (context.isViewer
        && !cleanDesc) {
        return "Description is mandatory";
      }
      if ((!
        context.isViewer
      ) && hasTime && !cleanDesc) {
        return "Description is mandatory when logging hours.";
      }
      return true; // valid
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
    visibleWhen: (formData, context) => {
      return (!context?.isViewer);
    },
    customValidator: (value, formData, context) => {
      if (context.isViewer) return true
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
    visibleWhen: (formData, context) => {
      return (!context?.isViewer);
    },
    // 🔥 FIX 3: Enforce pair validation & logic check
    customValidator: (value, formData, context) => {
      if (context.isViewer) return true
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
    visibleWhen: (formData, context) => {
      return (!context?.isViewer);
    },
    disableWhen: (context, formData) => {
      if (isTimeLocked(context)) return true;
      return Boolean(formData?.fromTime && formData?.toTime);
    },
    forceSubmit: (context) => context.isEdit !== true,
    customValidator: (value, formData, context) => {
      if (context.isViewer) return true;
      if (isTimeLocked(context)) return true;
    
      const skipTimeValidation =
        formData?.requestClose ||
        formData?.Priority ||
        formData?.["Functional Response"] ||
        formData?.["Technical Response"] ||
        formData?.["Web Response"] ||
        formData?.["Admin Response"];
    
      if (skipTimeValidation) return true;
    
      const cleanDesc = formData?.description
        ?.replace(/<[^>]*>?/gm, "")
        .trim();
    
      const hasDescription = !!cleanDesc;
    
      const hasTime =
        !!value || (!!formData.fromTime && !!formData.toTime);
    
      // ✅ NEW RULE
      if (hasDescription && !hasTime) {
        return "Hours are mandatory when description is entered.";
      }
    
      return true;
    }
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
    visibleWhen: (formData, context) => {
      return (!context?.isViewer);
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
    visibleWhen: (formData, context) => {
      return !context?.isViewer && !context?.isEdit;
    },
    transform: (mappedArray, formData) => {
      const streamId = formData?.UpdateStatus?.value?.id || 0;
      return mappedArray.map((item) => ({
        Id: item.id,
        StreamId: streamId,
      }));
    },

    optionsResolver: buildOptionsResolver(
      "EmployeeList",
      "UserID",
      "UserName",
      (user) => user.Status === "Active", // 👈 Simple 1-condition filter
    ),

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
    optionsResolver: buildOptionsResolver(
      "EmployeeList",
      "UserID",
      "UserName",
      (user) => user.Status === "Active", // 👈 Simple 1-condition filter
    ),
    visibleWhen: (formData, context) => {
      return !context?.isViewer;
    },

    // 🔥 1. FIX: Load the saved Co-Contributors when the edit form opens!
    initValueResolver: ({ context }) => {
      if (
        context?.isEdit &&
        Array.isArray(context?.editingItem?.CoContributors)
      ) {
        // Map the saved API data back into the format the MUI Dropdown expects
        return context.editingItem.CoContributors.map((c) => ({
          label: c.name,
          value: { id: c.id, name: c.name },
        }));
      }
      return [];
    },
    // 🔥 3. FIX: Lock the field so it cannot be edited if older than 1 day
    disableWhen: (context) => {
      return isTimeLocked(context);
    },
  },
  {
    name: "Priority",
    apiKey: "PriorityRequest",
    label: "Notify Priority",
    type: "switch",
    ui: "mui",
    colSpan: 4,
    initValueResolver: ({ context }) => {
      const isActive =
        context?.parentTicket?.PriorityRequest ||
        context?.parentTicket?.priorityRequest
      return isActive ? true : null;
    },
    visibleWhen: (formData, context) => {
      return context?.currentUser?.role === 1;
    },
    transform:(value) => value === true ? true : false
  },

  {
    name: "requestClose",
    apiKey: "IsCloseRequested", 
    label: "Request Ticket Closure",
    type: "switch",
    ui: "mui",
    colSpan: 4,
    initValueResolver: ({ context }) => {
      const isRequested =
        context?.parentTicket?.IsCloseRequested ||
        context?.parentTicket?.isCloseRequested;
        return isRequested ? true : null;
    },

    visibleWhen: (formData, context) => {
      const isViewer = context?.isViewer;
      const isEdit = context?.isEdit;
      if (isViewer || isEdit) return false;
      return true;
    },

    transform:(value) => value === true ? true : false
  },

  {
    name: "Functional Response",
    apiKey: "FuncResponse",
    label: "Notify Functional",
    type: "switch",
    ui: "mui",
    colSpan: 4,
    // initValueResolver: () => false,
    initValueResolver: ({ context }) => {
     const isActive = 
        context?.parentTicket?.FuncResponse ||
        context?.parentTicket?.funcResponse
      return isActive ? true : null;
    },
    visibleWhen: (formData, context) => {
      return !context?.isViewer && !context?.isEdit;
    },
    transform:(value) => value === true ? true : false
  },

  {
    name: "Technical Response",
    apiKey: "TechnicalResponse",
    label: "Notify Technical",
    type: "switch",
    ui: "mui",
    colSpan: 4,
    // initValueResolver: () => false,
    initValueResolver: ({ context }) => {
     const isActive = 
        context?.parentTicket?.TechnicalResponse ||
        context?.parentTicket?.technicalResponse
      return isActive ? true : null;
    },
    visibleWhen: (formData, context) => {
      return !context?.isViewer && !context?.isEdit;
    },
    transform:(value) => value === true ? true : false
  },

  {
    name: "Web Response",
    apiKey: "WebResponse",
    label: "Notify Web",
    type: "switch",
    ui: "mui",
    colSpan: 4,
    // initValueResolver: () => false,
    initValueResolver: ({ context }) => {
     const isActive = 
        context?.parentTicket?.WebResponse ||
        context?.parentTicket?.webResponse
      return isActive ? true : null;
    },
    visibleWhen: (formData, context) => {
      return !context?.isViewer && !context?.isEdit;
    },
    transform:(value) => value === true ? true : false
  },

  {
    name: "Admin Response",
    apiKey: "AdminResponse",
    label: "Notify Admin",
    type: "switch",
    ui: "mui",
    colSpan: 4,
    // initValueResolver: () => false,
    initValueResolver: ({ context }) => {
     const isActive = 
        context?.parentTicket?.AdminResponse ||
        context?.parentTicket?.adminResponse
      return isActive ? true : null;
    },
    visibleWhen: (formData, context) => {
      return !context?.isViewer && !context?.isEdit;
    },
    transform:(value) => value === true ? true : false
  },

  {
    name: "TicketProgressHistoryWidget",
    type: "custom", // You can name this whatever you want now
    customComponent: TicketProgressHistory, // 👈 PASS THE REACT COMPONENT HERE
    colSpan: 12,
    visibleWhen: (formData, context) => {
      return !context?.isEdit && !context?.isViewer;
    },

    groupName: "Ticket Status Update",
    options: {
      ticketId: ticketId, // 👈 Pass the ticketId here so FormEngine forwards it
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
     if (context?.isEdit || context?.isViewer) return false;
      const cleanDesc = formData?.description?.replace(/<[^>]*>?/gm, "").trim();
      return !!cleanDesc ;
    },
  },

  {
    name: "TicketStatusSummary",
    label: "Current Status Summary",
    type: "text",
    ui: "mui",
    apiKey: "TicketStatusSummary",
    colSpan: 6,
    groupName: "Ticket Status Update",
    visibleWhen: (formData, context) => {
      return !context?.isEdit && !context?.isViewer;
    },
    effectDependencies: ["copyDescription", "description"],
    effectResolver: (formData) => {
      if (formData.copyDescription) {
        const cleanDesc = formData.description?.replace(/<[^>]*>?/gm, "").trim();
        return cleanDesc || "";
      }
      return formData.TicketStatusSummary || "";
    },
    customValidator: (value, formData, context) => {
      const cleanSummary = value?.replace(/<[^>]*>?/gm, "").trim();
    
      const batteryHasValue = !!formData.TicketOverallPercentage;
    
      if (batteryHasValue && !cleanSummary) {
        return "Status Summary is mandatory when Overall Ticket Progress is set.";
      }
    
      // -----------------------------
      // ORIGINAL STATES (from backend)
      // -----------------------------
      const originalRequestClose = !!(
        context?.parentTicket?.IsCloseRequested ||
        context?.parentTicket?.isCloseRequested
      );
    
      const originalPriority = !!(
        context?.parentTicket?.PriorityRequest ||
        context?.parentTicket?.priorityRequest
      );
    
      const originalFuncResponse = !!(
        context?.parentTicket?.FuncResponse ||
        context?.parentTicket?.funcResponse
      );

      const originalWebResponse = !!(
        context?.parentTicket?.WebResponse ||
        context?.parentTicket?.webResponse
      );

      const originalTechnicalResponse = !!(
        context?.parentTicket?.TechnicalResponse ||
        context?.parentTicket?.technicalResponse
      );

      const originalAdminResponse = !!(
        context?.parentTicket?.AdminResponse ||
        context?.parentTicket?.adminResponse
      );
    
      // -----------------------------
      // CURRENT FORM STATES
      // (normalize to boolean)
      // -----------------------------
      const currentRequestClose = formData?.requestClose === true;
      const currentPriority = formData?.Priority === true;
      const currentFuncResponse = formData?.["Functional Response"] === true;

      const currentWebResponse = formData?.["Technical Response"] === true;
      const currentTechnicalResponse = formData?.["Web Response"] === true;
      const currentAdminResponse = formData?.["Admin Response"] === true;
    
      // -----------------------------
      // DETECT CHANGES (ON or OFF)
      // -----------------------------
      const requestCloseChanged =
        currentRequestClose !== originalRequestClose;
    
      const priorityChanged =
        currentPriority !== originalPriority;
    
      const funcResponseChanged =
        currentFuncResponse !== originalFuncResponse;

        const webResponseChanged =
        currentWebResponse !== originalWebResponse;

        const technicalResponseChanged =
        currentTechnicalResponse !== originalTechnicalResponse;

        const adminResponseChanged =
        currentAdminResponse !== originalAdminResponse;
    
      const toggleInteracted =
        requestCloseChanged || priorityChanged || funcResponseChanged || webResponseChanged || technicalResponseChanged || adminResponseChanged ;
    
      // -----------------------------
      // VALIDATION RULE
      // -----------------------------
      if (toggleInteracted && !cleanSummary) {
        return "Status Summary is mandatory when a toggle is changed";
      }
    
      return true;
    },
  },
  {
    name: "TicketOverallPercentage",
    label: "Overall Ticket Progress (%)",
    type: "battery", // Or "number" depending on your registry
    ui: "mui",
    visibleWhen: (formData, context) => {
      return !context?.isEdit && !context?.isViewer;
    },
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

    // customValidator: (value, formData, context) => {
    //   if (context.isViewer) return true;

    //   const hasSummary = formData.TicketStatusSummary?.trim();
    //   if (hasSummary && (value === null || value === undefined || value === "")) {
    //     return "Overall Ticket Progress is mandatory when Status Summary has value.";
    //   }

    //   return true;
    // },

  },
];


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
    requiredWhen: (context, formData) => {
      // Red asterisk shows if they entered time
      return !!formData?.hours || !!formData?.fromTime;
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
    name: "Ref_Id",
    apiKey: "Ref_Id", // 👈 The exact name your API expects
    hidden: true, // 👈 Keeps it invisible in the UI
    dataType: "string",
    // defaultValue: "DABB7622-0BF8-4CC9-80C3-08DE5A6D4989",
    initValueResolver: ({ context }) => {
      // Pulls the StreamId directly from the sidebar card they clicked!
      const val=context?.replyingToId??null
      return val
      
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
    
    // 🔥 UPDATED: Rejects 0.00 / 00:00 and enforces a minimum threshold of 5 minutes (00:05)
    customValidator: (value, formData, context) => {
      if (context.isViewer || isTimeLocked(context)) return true;

      const description = formData?.description?.replace(/<[^>]*>?/gm, "").trim();
      const hasDescription = !!description;

      // Safe internal utility to parse HH:MM or decimal formatting into absolute minutes
      const getMinutes = (timeVal) => {
        if (!timeVal) return 0;
        const str = String(timeVal).trim();
        
        if (str.includes(":")) {
          const [h, m] = str.split(":").map(Number);
          return (Number.isNaN(h) ? 0 : h * 60) + (Number.isNaN(m) ? 0 : m);
        }
        
        const parsedFloat = parseFloat(str);
        return Number.isNaN(parsedFloat) ? 0 : Math.round(parsedFloat * 60);
      };

      const manualMinutes = getMinutes(value);

      // Auto-calculate range duration if From/To times are present
      let autoMinutes = 0;
      if (formData.fromTime && formData.toTime) {
        autoMinutes = getMinutes(formData.toTime) - getMinutes(formData.fromTime);
      }

      // Determine actual logged time
      const totalMinutes = Math.max(manualMinutes, autoMinutes);
      const hasValidTime = totalMinutes >= 5;

      // 1. Mandatory description enforcement with sub-5 minute check (blocks 0.00, 00:00, 00:03, etc.)
      if (hasDescription && !hasValidTime) {
        return "Minimum 00:05 (5 minutes) total hours is mandatory.";
      }

      // 2. Prevent entering a non-zero value below 5 minutes even without a description (e.g. 00:02)
      if (!hasDescription && value && manualMinutes > 0 && manualMinutes < 5) {
        return "Logged time must be at least 00:05 (5 minutes).";
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
    colSpan: 2,
    // customValidator: createToggleValidator("Notify Priority"),
    switchColor: "bg-orange-100 text-orange-800 toggle-orange-500",
    initValueResolver: ({ context }) => {
      const isActive =
        context?.parentTicket?.priorityRequest;
      return isActive ? true : null;
    },
    visibleWhen: (formData, context) => {
      return context?.currentUser?.role === 1;
    },
    transform: (value) => value === true ? true : false
  },

  {
    name: "requestClose",
    apiKey: "IsCloseRequested",
    label: "Ticket Closure",
    type: "switch",
    ui: "mui",
    colSpan: 2,
    switchColor: "bg-red-100 text-red-800 toggle-red-500",
    initValueResolver: ({ context }) => {
      const isRequested =
        context?.parentTicket?.isCloseRequested;
      return isRequested ? true : null;
    },
    // customValidator: createToggleValidator("Request Ticket Closure"),
    visibleWhen: (formData, context) => {
      const isViewer = context?.isViewer;
      const isEdit = context?.isEdit;
      if (isViewer || isEdit) return false;
      return true;
    },

    transform: (value) => value === true ? true : false
  },

  {
    name: "Functional Response",
    apiKey: "FuncResponse",
    label: "Notify Functional",
    switchColor: "bg-purple-100 text-purple-800 toggle-purple-500",
    type: "switch",
    ui: "mui",
    colSpan: 2,
    // customValidator: createToggleValidator("Notify Functional"),
    initValueResolver: ({ context }) => {
      const isActive =
        context?.parentTicket?.funcResponse
      return isActive ? true : null;
    },
    visibleWhen: (formData, context) => {
      return !context?.isViewer && !context?.isEdit;
    },
    transform: (value) => value === true ? true : false
  },

  {
    name: "Technical Response",
    apiKey: "TechnicalResponse",
    label: "Notify Technical",
    type: "switch",
    switchColor: "bg-green-100 text-green-800 toggle-green-500",
    ui: "mui",
    colSpan: 2,
    // customValidator: createToggleValidator("Notify Technical"),
    initValueResolver: ({ context }) => {
      const isActive = context?.parentTicket?.technicalResponse
      return isActive ? true : null;
    },
    visibleWhen: (formData, context) => {
      return !context?.isViewer && !context?.isEdit;
    },
    transform: (value) => value === true ? true : false
  },

  {
    name: "Web Response",
    apiKey: "WebResponse",
    label: "Notify Web",
    type: "switch",
    switchColor: "bg-blue-100 text-blue-800 toggle-blue-500",
    ui: "mui",
    colSpan: 2,
    // customValidator: createToggleValidator("Notify Web"),
    initValueResolver: ({ context }) => {
      const isActive = context?.parentTicket?.webResponse
      return isActive ? true : null;
    },
    visibleWhen: (formData, context) => {
      return !context?.isViewer && !context?.isEdit;
    },
    transform: (value) => value === true ? true : false
  },

  {
    name: "Admin Response",
    apiKey: "AdminResponse",
    label: "Notify Admin",
    type: "switch",
    ui: "mui",
    switchColor: "bg-yellow-100 text-yellow-800 toggle-yellow-500",
    colSpan: 2,
    // customValidator: createToggleValidator("Notify Admin"),
    initValueResolver: ({ context }) => {
      const isActive = context?.parentTicket?.adminResponse
      return isActive ? true : null;
    },
    visibleWhen: (formData, context) => {
      return !context?.isViewer && !context?.isEdit;
    },
    transform: (value) => value === true ? true : false
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
      return !!cleanDesc;
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
        const parser = new DOMParser();
        const doc = parser.parseFromString(formData.description || "", "text/html");
        
        // Remove elements including video and audio
        doc.querySelectorAll('a[href],.zip,img,.attachment,[data-type="attachment"],figure,video,audio').forEach(el => el.remove());
        
        // Get the cleaned text content
        let cleanDesc = doc.body.textContent || doc.body.innerText || "";
        
        // Remove any remaining HTML tags and attachment-related text
        cleanDesc = cleanDesc
          .replace(/<[^>]*>/g, "")
          .replace(/\[.*?\]/g, "")
          .replace(/\(.*?\)/g, "")
          .replace(/attachment/gi, "")
          .replace(/file/gi, "")
          .replace(/image/gi, "")
          .replace(/download/gi, "")
          .replace(/video/gi, "")
          .replace(/audio/gi, "")
          .replace(/\s+/g, " ")
          .trim();
        
        return cleanDesc || "";
      }
    }
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
  },
];
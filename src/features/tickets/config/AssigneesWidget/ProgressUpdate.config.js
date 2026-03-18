export const ProgressUpdateConfig = (ticketId) => [
  {
    name: "StreamStatus",
    label: "Current Status",
    type: "select",
    ui: "mui",
    colSpan: 12,
    // required: true,
    // Fetch options from your master data
    optionsResolver: ({ masterData }) =>
      masterData?.StatusMaster?.filter(
        (label) => label.Status_Id !== 1 && label.Status_Id !== 2,
      ) // 👈 Added filter here
        .map((label) => ({
          label: label.Status_Name,
          value: {
            id: label.Status_Id,
            name: label.Status_Name,
          },
        })) || [],
    apiKey: "StreamStatus",
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
    label: "Assigned-to",
    name: "assginedTo",
    type: "select",
    ui: "mui",
    apiKey: "ResourceId",
    optionsResolver: ({ masterData }) =>
      masterData?.EmployeeList?.map((emp) => ({
        label: emp.UserName,
        value: {
          id: emp.UserID,
          name: emp.UserName,
        },
      })) || [],
  },
  {
    name: "CompletionPct",
    label: "Completion Percentage",
    type: "battery", // Uses the custom battery component we registered
    ui: "mui",
    colSpan: 12,
    // required: true,
    apiKey: "CompletionPct",
    initValueResolver: () => 0, // Default to 0 if starting fresh
  },
  {
    name: "Comment",
    label: "What did you work on?",
    type: "adEditor", // Your Advanced Editor for threads
    ui: "editor",
    colSpan: 12,
    apiKey: "Comment",
    // required: true, // Force them to leave a comment/thread
  },
  {
    name: "UseLastComment",
    label: "Use my previous thread comment",
    type: "toggle", // Matches the key in inputRegistry
    ui: "mui",
    colSpan: 12,
    apiKey: "UseLastThread",
    initValueResolver: () => false, // Ensure it starts 'off'
  },
];

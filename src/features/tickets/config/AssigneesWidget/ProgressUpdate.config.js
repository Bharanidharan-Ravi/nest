export const ProgressUpdateConfig = (ticketId) => [
  {
    name: "StreamStatus",
    label: "Current Status",
    type: "select",
    ui: "mui",
    colSpan: 12,
    required: true,
    // Fetch options from your master data
    optionsResolver: (masterData) =>
      masterData?.StatusMaster?.map((label) => ({
        label: label.Status_Name,
        value: label.Status_Id, // Or whatever ID your DB expects
      })) || [],
  },
  {
    name: "CompletionPct",
    label: "Completion Percentage",
    type: "battery", // Uses the custom battery component we registered
    ui: "mui",
    colSpan: 12,
    required: true,
    initValueResolver: () => 0, // Default to 0 if starting fresh
  },
  {
    name: "Comment",
    label: "What did you work on?",
    type: "adEditor", // Your Advanced Editor for threads
    ui: "editor",
    colSpan: 12,
    required: true, // Force them to leave a comment/thread
  },
  {
    name: "UseLastComment",
    label: "Use my previous thread comment",
    type: "toggle", // Matches the key in inputRegistry
    ui: "mui",
    colSpan: 12,
    initValueResolver: () => false, // Ensure it starts 'off'
  }
];
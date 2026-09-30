// Status and retest result are one field: the user picks any of these by
// hand, with no lifecycle restriction and nothing set automatically.
export const ISSUE_LOGGER_STATUS_OPTIONS = [
  { label: "Open", value: { id: "Open", name: "Open" } },
  { label: "Retest", value: { id: "Retest", name: "Retest" } },
  { label: "Passed", value: { id: "Passed", name: "Passed" } },
  { label: "Failed", value: { id: "Failed", name: "Failed" } },
  { label: "Not Required", value: { id: "Not Required", name: "Not Required" } },
  { label: "Closed", value: { id: "Closed", name: "Closed" } },
    { label: "ReOpen", value: { id: "ReOpen", name: "ReOpen" } },
];

export const ISSUE_LOGGER_PRIORITY_OPTIONS = [
  { label: "Low", value: { id: "Low", name: "Low" } },
  { label: "Medium", value: { id: "Medium", name: "Medium" } },
  { label: "High", value: { id: "High", name: "High" } },
  { label: "Critical", value: { id: "Critical", name: "Critical" } },
];


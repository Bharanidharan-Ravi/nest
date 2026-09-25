/**
 * src/features/leaveRequest/config/leaveTypes.js
 *
 * Static leave type options (id -> label). Backend LEAVE_TYPE_ID is a plain int
 * column with no lookup table yet, so these ids just need to stay stable.
 * Swap for the `leaveType` master registry entry (SAP-backed) per
 * docs/leaveRequestPrompt.md once that API exists.
 */
export const LEAVE_TYPES = [
  { id: 1, label: "Sick Leave" },
  { id: 2, label: "Casual Leave" },
  { id: 3, label: "Earned Leave" },
];

export const getLeaveTypeLabel = (id) =>
  LEAVE_TYPES.find((t) => t.id === Number(id))?.label || "—";

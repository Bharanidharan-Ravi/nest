// ─────────────────────────────────────────────────────────────────────────────
// LeaveRequestFormPage.jsx
// From Date / To Date / Leave Type, auto-computed No. of Days, Submit.
// Posts to POST /LeaveRequest/Create, which inserts into LEAVE_REQUEST and
// raises a real notification for admins server-side.
// ─────────────────────────────────────────────────────────────────────────────
import { useMemo, useState } from "react"
import { useSmartNavigation } from "../../../core/navigation/useSmartNavigation"
import { ROUTE_KEYS } from "../../../core/routing/paths"
import { useApiMutation } from "../../../core/query/useApiMutation"
import { queryKeys } from "../../../core/query/queryKeys"
import { LEAVE_TYPES } from "../config/leaveTypes"
import { useLeaveRequestMaster } from "../../../core/master/selectors/selectors"
import { readUserFromSession } from "../../../core/auth/useCurrentUser"
import LeaveDateRangePicker from "../components/LeaveDateRangePicker"
import dayjs from "dayjs"

const calcLeaveDays = (fromDate, toDate) => {
  if (!fromDate || !toDate) return ""
  const from = new Date(fromDate)
  const to = new Date(toDate)
  const diff = Math.round((to - from) / (1000 * 60 * 60 * 24)) + 1
  return diff > 0 ? diff : ""
}

const LeaveRequestFormPage = () => {
  const { goTo } = useSmartNavigation()
  const leaveRequests = useLeaveRequestMaster()
  const currentUser = readUserFromSession()

  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [leaveTypeId, setLeaveTypeId] = useState(LEAVE_TYPES[0].id)
  const [comments, setComments] = useState("")
  const [error, setError] = useState("")
  const [warning, setWarning] = useState("")

  const noOfDays = useMemo(() => calcLeaveDays(fromDate, toDate), [fromDate, toDate])

  // Days already covered by this user's own REQUESTED/APPROVED leave — a
  // rejected request frees the dates back up. Used to block the calendar and
  // to truncate a drag-selection that crosses one of these dates.
  const blockedDates = useMemo(() => {
    const set = new Set()
    leaveRequests
      .filter(
        (r) =>
          String(r.employeeId) === String(currentUser?.userId) &&
          (r.status?.toUpperCase() === "REQUESTED" || r.status?.toUpperCase() === "APPROVED"),
      )
      .forEach((r) => {
        let d = dayjs(r.fromDate)
        const to = dayjs(r.toDate)
        while (!d.isAfter(to, "day")) {
          set.add(d.format("YYYY-MM-DD"))
          d = d.add(1, "day")
        }
      })
    return set
  }, [leaveRequests, currentUser?.userId])

  const handleRangeChange = (from, to, rangeWarning) => {
    setFromDate(from)
    setToDate(to)
    setWarning(rangeWarning || "")
    if (error) setError("")
  }

  const { mutate, isPending } = useApiMutation({
    url: "/LeaveRequest/Create",
    method: "POST",
    invalidateKeys: [queryKeys.leaveRequest.list(), queryKeys.notification.unreadCount()],
    onSuccess: () => goTo(ROUTE_KEYS.LEAVE_LIST),
    onError: (err) => setError(err?.message || "Failed to submit leave request."),
  })

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!fromDate || !toDate) {
      setError("Please select both From Date and To Date.")
      return
    }
    if (new Date(toDate) < new Date(fromDate)) {
      setError("To Date cannot be before From Date.")
      return
    }
    setError("")

    mutate({
      leaveFrom: fromDate,
      leaveTo: toDate,
      leaveTypeId: Number(leaveTypeId),
      comments,
    })
  }

  return (
    <div className="flex-1 min-h-0 max-w-3xl mx-auto w-full">
      <h2 className="mb-4">Create Leave Request</h2>

      <form onSubmit={handleSubmit} className="wg-form-container">
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <LeaveDateRangePicker
              fromDate={fromDate}
              toDate={toDate}
              onChange={handleRangeChange}
              blockedDates={blockedDates}
            />

            {warning && (
              <div className="md:col-span-2 -mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                {warning}
              </div>
            )}

            <div>
              <label className="block mb-1.5 text-sm font-semibold text-gray-700" htmlFor="leaveType">
                Leave Type
              </label>
              <select
                id="leaveType"
                value={leaveTypeId}
                onChange={(e) => setLeaveTypeId(e.target.value)}
                className="wg-input"
              >
                {LEAVE_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1.5 text-sm font-semibold text-gray-700" htmlFor="noOfDays">
                No. of Days
              </label>
              <input
                id="noOfDays"
                type="text"
                value={noOfDays}
                disabled
                placeholder="—"
                className="wg-input bg-gray-100 text-gray-600 font-medium disabled:opacity-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block mb-1.5 text-sm font-semibold text-gray-700" htmlFor="comments">
                Comments
              </label>
              <textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="wg-input resize-none"
                rows={4}
                placeholder="Add any additional notes for your approver..."
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <div className="wg-form-footer">
          <button
            type="button"
            onClick={() => goTo(ROUTE_KEYS.LEAVE_LIST)}
            className="wg-btn-secondary"
          >
            Cancel
          </button>
          <button type="submit" disabled={isPending} className="wg-btn-primary">
            {isPending ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  )
}

export default LeaveRequestFormPage

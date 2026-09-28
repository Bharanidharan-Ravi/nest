// ─────────────────────────────────────────────────────────────────────────────
// LeaveRequestActionDialog.jsx
// Admin-only modal for a single leave request, in any status. The admin can
// re-adjust the dates / half days and approve, re-approve (e.g. after "Not
// Taken"), reject or mark as not taken (PATCH /LeaveRequest/{id}/status).
// Rejecting requires a reason.
// ─────────────────────────────────────────────────────────────────────────────
import { useMemo, useState } from "react"
import dayjs from "dayjs"
import { executeApi } from "../../../core/api/executor"
import { useLeaveRequestMaster, useLeaveTypeLabel } from "../../../core/master/selectors/selectors"
import { SESSION, buildTakenSessions, getDayAvailability, sessionDays } from "../leaveSessions"
import LeaveDateRangePicker from "./LeaveDateRangePicker"
import LeaveDaySessionPicker from "./LeaveDaySessionPicker"

const fmt = (value) => dayjs(value).format("YYYY-MM-DD")

const LeaveRequestActionDialog = ({ request, onClose, onDone }) => {
  const [mode, setMode] = useState("view") // "view" | "reject"
  const [rejectReason, setRejectReason] = useState(request.rejectReason || "")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [warning, setWarning] = useState("")

  const isApproved = request.status === "APPROVED"
  const leaveTypeLabel = useLeaveTypeLabel(request.leaveTypeId)
  const leaveRequests = useLeaveRequestMaster()

  // Original sessions keyed by date — dates missing from `days` are FULL.
  const originalSessions = useMemo(
    () => Object.fromEntries((request.days || []).map((d) => [fmt(d.date), d.session])),
    [request.days],
  )

  const [fromDate, setFromDate] = useState(fmt(request.fromDate))
  const [toDate, setToDate] = useState(fmt(request.toDate))
  const [sessionOverrides, setSessionOverrides] = useState(originalSessions)
  const [halfDayEnabled, setHalfDayEnabled] = useState(
    () => (request.days || []).some((d) => d.session && d.session !== SESSION.FULL),
  )

  // The employee's other REQUESTED/APPROVED leave — this request never blocks itself.
  const takenSessions = useMemo(
    () => buildTakenSessions(leaveRequests.filter((r) => r.id !== request.id), request.employeeId),
    [leaveRequests, request.id, request.employeeId],
  )

  const blockedDates = useMemo(() => {
    const set = new Set()
    takenSessions.forEach((_, date) => {
      if (getDayAvailability(date, takenSessions, null).allowed.length === 0) set.add(date)
    })
    return set
  }, [takenSessions])

  const leaveDays = useMemo(() => {
    if (!fromDate || !toDate) return []
    const rows = []
    for (let d = dayjs(fromDate); !d.isAfter(dayjs(toDate), "day"); d = d.add(1, "day")) {
      const date = d.format("YYYY-MM-DD")
      const { allowed, note } = getDayAvailability(date, takenSessions, null)
      const picked = halfDayEnabled ? sessionOverrides[date] : undefined
      rows.push({ date, allowed, note, session: allowed.includes(picked) ? picked : allowed[0] })
    }
    return rows
  }, [fromDate, toDate, takenSessions, sessionOverrides, halfDayEnabled])

  const noOfDays = leaveDays.reduce((sum, d) => sum + (d.session ? sessionDays(d.session) : 0), 0)

  const datesChanged =
    fromDate !== fmt(request.fromDate) ||
    toDate !== fmt(request.toDate) ||
    leaveDays.some((d) => d.session !== (originalSessions[d.date] || SESSION.FULL))

  const handleRangeChange = (from, to, rangeWarning) => {
    setFromDate(from)
    setToDate(to)
    setWarning(rangeWarning || "")
    if (error) setError("")
  }

  const handleSessionChange = (date, session) => {
    setSessionOverrides((prev) => ({ ...prev, [date]: session }))
    if (error) setError("")
  }

  const resetDates = () => {
    setFromDate(fmt(request.fromDate))
    setToDate(fmt(request.toDate))
    setSessionOverrides(originalSessions)
    setHalfDayEnabled((request.days || []).some((d) => d.session && d.session !== SESSION.FULL))
    setWarning("")
  }

  const send = async (url, payload, fallbackError) => {
    setSubmitting(true)
    setError("")
    try {
      const result = await executeApi({ url, method: "PATCH", payload })
      if (result?.Ok === false) {
        throw new Error(result?.Err?.M || fallbackError)
      }
      onDone()
      onClose()
    } catch (err) {
      setError(err?.message || fallbackError)
    } finally {
      setSubmitting(false)
    }
  }

  const submitStatus = (status, reason) => {
    if (datesChanged) {
      const unavailable = leaveDays.find((d) => !d.session)
      if (unavailable) {
        setError(`${dayjs(unavailable.date).format("DD MMM")} is not available — please change the dates.`)
        return
      }
    }
    send(
      `/LeaveRequest/${request.id}/status`,
      {
        Status: status,
        RejectReason: reason,
        // Only re-adjust the dates when the admin actually changed them.
        ...(datesChanged && {
          LeaveFrom: fromDate,
          LeaveTo: toDate,
          Days: leaveDays.map(({ date, session }) => ({ Date: date, Session: session })),
        }),
      },
      "Failed to update leave request.",
    )
  }

  const submitNotTaken = () =>
    send(`/LeaveRequest/${request.id}/not-taken`, undefined, "Failed to mark leave as not taken.")

  const approveLabel =
    request.status === "REQUESTED" ? "Approve" : isApproved && !request.notTaken ? "Save Changes" : "Re-approve"
  // Re-approving an already approved (and taken) leave only makes sense with new dates.
  const approveDisabled = submitting || (isApproved && !request.notTaken && !datesChanged)
  // "Not taken" is only known once the leave is over; before that the admin rejects it.
  const leaveOver = dayjs(request.toDate).isBefore(dayjs(), "day")
  const canMarkNotTaken = isApproved && !request.notTaken && !datesChanged && leaveOver

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 bg-white rounded-2xl border border-gray-200 shadow-lg w-full max-w-[560px] mx-4 max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="h-1 w-full bg-amber-400 flex-none" />

        <div className="px-6 pt-6 pb-5 overflow-y-auto">
          <h3 className="text-[15px] font-semibold text-gray-800 mb-4">Leave Request</h3>

          <div className="grid grid-cols-2 gap-y-2 text-[13px] mb-4">
            <span className="text-gray-400">Requested By</span>
            <span className="text-gray-700 font-medium">{request.requestedBy}</span>

            <span className="text-gray-400">Leave Type</span>
            <span className="text-gray-700">{leaveTypeLabel}</span>

            {request.comments && (
              <>
                <span className="text-gray-400">Comments</span>
                <span className="text-gray-700">{request.comments}</span>
              </>
            )}

            <span className="text-gray-400">Status</span>
            <span className="text-gray-700 font-medium">
              {request.status}
              {request.notTaken && " (Not Taken)"}
            </span>

            {request.status === "REJECTED" && request.rejectReason && (
              <>
                <span className="text-gray-400">Reject Reason</span>
                <span className="text-gray-700">{request.rejectReason}</span>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 gap-y-4 mb-4">
            <LeaveDateRangePicker
              fromDate={fromDate}
              toDate={toDate}
              onChange={handleRangeChange}
              blockedDates={blockedDates}
              allowPast
            />

            {warning && (
              <div className="-mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                {warning}
              </div>
            )}

            <LeaveDaySessionPicker
              days={leaveDays}
              onChange={handleSessionChange}
              enabled={halfDayEnabled}
              onToggle={setHalfDayEnabled}
            />

            <div className="flex items-center justify-between text-[13px]">
              <span>
                <span className="text-gray-400 mr-2">No. of Days</span>
                <span className="text-gray-700 font-medium">{noOfDays}</span>
              </span>
              {datesChanged && (
                <button type="button" onClick={resetDates} className="text-xs text-gray-500 hover:text-gray-800 underline">
                  Reset dates
                </button>
              )}
            </div>
          </div>

          {mode === "reject" && (
            <div className="mb-4">
              <label className="block mb-1.5 text-sm font-semibold text-gray-700" htmlFor="rejectReason">
                Reason for rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="wg-input resize-none"
                rows={3}
                placeholder="Let the employee know why this was rejected..."
                autoFocus
              />
            </div>
          )}

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          {mode === "view" ? (
            <div className="flex flex-wrap gap-2.5">
              <button onClick={onClose} className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-gray-500 text-[13px] font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors">
                Close
              </button>
              {canMarkNotTaken && (
                <button
                  onClick={submitNotTaken}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 rounded-xl text-[13px] bg-gray-700 hover:bg-gray-800 text-white font-semibold transition-colors disabled:opacity-60 whitespace-nowrap"
                >
                  Mark as Not Taken
                </button>
              )}
              <button
                onClick={() => setMode("reject")}
                disabled={submitting}
                className="flex-1 px-4 py-2 rounded-xl text-[13px] bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors disabled:opacity-60"
              >
                Reject
              </button>
              <button
                onClick={() => submitStatus("APPROVED")}
                disabled={approveDisabled}
                className="flex-1 px-4 py-2 rounded-xl text-[13px] bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold transition-colors disabled:opacity-60 whitespace-nowrap"
              >
                {submitting ? "Saving..." : approveLabel}
              </button>
            </div>
          ) : (
            <div className="flex gap-2.5">
              <button onClick={() => setMode("view")} className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-gray-500 text-[13px] font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors">
                Back
              </button>
              <button
                onClick={() => submitStatus("REJECTED", rejectReason)}
                disabled={submitting || !rejectReason.trim()}
                className="flex-1 px-4 py-2 rounded-xl text-[13px] bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors disabled:opacity-60"
              >
                {submitting ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LeaveRequestActionDialog

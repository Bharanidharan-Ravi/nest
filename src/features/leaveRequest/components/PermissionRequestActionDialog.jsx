// ─────────────────────────────────────────────────────────────────────────────
// PermissionRequestActionDialog.jsx
// Admin-only Approve / Reject modal for a single REQUESTED permission request.
// Rejecting requires a reason (PATCH /PermissionRequest/{id}/status).
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react"
import { executeApi } from "../../../core/api/executor"

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : "")

const formatDuration = (minutes) => {
  if (!minutes) return ""
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h${m ? ` ${m}m` : ""}` : `${m}m`
}

const PermissionRequestActionDialog = ({ request, onClose, onDone }) => {
  const [mode, setMode] = useState("view") // "view" | "reject"
  const [rejectReason, setRejectReason] = useState("")
  const [actualMinutes, setActualMinutes] = useState(
    request.actualDurationMinutes ?? request.durationMinutes ?? ""
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const isDecided = request.status !== "REQUESTED"
  const isApproved = request.status === "APPROVED"

  const actualDurationOptions = (() => {
    const MAX_MINUTES = 180 // 3 hrs
    const requested = request.durationMinutes || 0
    const max = Math.max(MAX_MINUTES, requested)
    const options = []
    for (let m = 30; m <= max; m += 30) options.push(m)
    if (requested > 0 && !options.includes(requested)) options.push(requested)
    return options.sort((a, b) => a - b)
  })()

  const submitStatus = async (status, reason) => {
    setSubmitting(true)
    setError("")
    try {
      const result = await executeApi({
        url: `/PermissionRequest/${request.id}/status`,
        method: "PATCH",
        payload: { Status: status, RejectReason: reason },
      })
      if (result?.Ok === false) {
        throw new Error(result?.Err?.M || "Failed to update permission request.")
      }
      onDone()
      onClose()
    } catch (err) {
      setError(err?.message || "Failed to update permission request.")
    } finally {
      setSubmitting(false)
    }
  }

  const submitActualDuration = async () => {
    const minutes = Number(actualMinutes)
    if (!minutes || minutes <= 0) {
      setError("Enter the actual minutes taken.")
      return
    }
    setSubmitting(true)
    setError("")
    try {
      const result = await executeApi({
        url: `/PermissionRequest/${request.id}/actual-duration`,
        method: "PATCH",
        payload: { ActualDurationMinutes: minutes },
      })
      if (result?.Ok === false) {
        throw new Error(result?.Err?.M || "Failed to save actual duration.")
      }
      onDone()
      onClose()
    } catch (err) {
      setError(err?.message || "Failed to save actual duration.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 bg-white rounded-2xl border border-gray-200 shadow-lg w-full max-w-[420px] mx-4 overflow-hidden"
      >
        <div className="h-1 w-full bg-amber-400" />

        <div className="px-6 pt-6 pb-5">
          <h3 className="text-[15px] font-semibold text-gray-800 mb-4">Permission Request</h3>

          <div className="grid grid-cols-2 gap-y-2 text-[13px] mb-4">
            <span className="text-gray-400">Requested By</span>
            <span className="text-gray-700 font-medium">{request.requestedBy}</span>

            <span className="text-gray-400">Date</span>
            <span className="text-gray-700">{formatDate(request.permissionDate)}</span>

            <span className="text-gray-400">Duration</span>
            <span className="text-gray-700">{formatDuration(request.durationMinutes)}</span>

            {request.actualDurationMinutes != null && (
              <>
                <span className="text-gray-400">Actual Taken</span>
                <span className="text-gray-700">{formatDuration(request.actualDurationMinutes)}</span>
              </>
            )}

            {request.remarks && (
              <>
                <span className="text-gray-400">Remarks</span>
                <span className="text-gray-700">{request.remarks}</span>
              </>
            )}

            <span className="text-gray-400">Status</span>
            <span className="text-gray-700 font-medium">{request.status}</span>

            {request.status === "REJECTED" && request.rejectReason && (
              <>
                <span className="text-gray-400">Reject Reason</span>
                <span className="text-gray-700">{request.rejectReason}</span>
              </>
            )}
          </div>

          {isDecided && !isApproved && (
            <p className="text-[12px] text-gray-400 mb-2">This request has already been decided.</p>
          )}

          {isApproved && (
            <div className="mb-4">
              <label className="block mb-1.5 text-sm font-semibold text-gray-700" htmlFor="actualMinutes">
                Actual minutes taken
              </label>
              <select
                id="actualMinutes"
                value={actualMinutes}
                onChange={(e) => setActualMinutes(e.target.value)}
                className="wg-input"
              >
                <option value="" disabled>
                  Select duration
                </option>
                {actualDurationOptions.map((mins) => (
                  <option key={mins} value={mins}>
                    {formatDuration(mins)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!isDecided && mode === "reject" && (
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

          {isApproved ? (
            <div className="flex gap-2.5">
              <button onClick={onClose} className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-gray-500 text-[13px] font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors">
                Close
              </button>
              <button
                onClick={submitActualDuration}
                disabled={submitting}
                className="flex-1 px-4 py-2 rounded-xl text-[13px] bg-gray-700 hover:bg-gray-800 text-white font-semibold transition-colors disabled:opacity-60"
              >
                {submitting ? "Saving..." : "Save Actual Duration"}
              </button>
            </div>
          ) : isDecided ? (
            <div className="flex justify-end">
              <button onClick={onClose} className="wg-btn-secondary">Close</button>
            </div>
          ) : mode === "view" ? (
            <div className="flex gap-2.5">
              <button onClick={onClose} className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-gray-500 text-[13px] font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => setMode("reject")}
                className="flex-1 px-4 py-2 rounded-xl text-[13px] bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => submitStatus("APPROVED")}
                disabled={submitting}
                className="flex-1 px-4 py-2 rounded-xl text-[13px] bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold transition-colors disabled:opacity-60"
              >
                {submitting ? "Approving..." : "Approve"}
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

export default PermissionRequestActionDialog

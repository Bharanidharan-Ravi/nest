// ─────────────────────────────────────────────────────────────────────────────
// LeaveRequestFormPage.jsx
// From Date / To Date / Leave Type, auto-computed No. of Days, Submit.
// Posts to POST /LeaveRequest/Create, which inserts into LEAVE_REQUEST and
// raises a real notification for admins server-side.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { useSmartNavigation } from "../../../core/navigation/useSmartNavigation"
import { ROUTE_KEYS } from "../../../core/routing/paths"
import { useApiMutation } from "../../../core/query/useApiMutation"
import { queryKeys } from "../../../core/query/queryKeys"
import { useLeaveRequestMaster, useLeaveTypeOptions } from "../../../core/master/selectors/selectors"
import { readUserFromSession } from "../../../core/auth/useCurrentUser"
import LeaveDateRangePicker from "../components/LeaveDateRangePicker"
import LeaveSingleDatePicker from "../components/LeaveSingleDatePicker"
import LeaveDaySessionPicker from "../components/LeaveDaySessionPicker"
import { buildTakenSessions, getDayAvailability, sessionDays } from "../leaveSessions"
import { PERMISSION_MAX_HOURS, getMaxPermissionHours } from "../permissionLimits"
import MuiSelectInput from "../../../packages/react-input-engine/adapters/mui/MuiSelectInput"
import dayjs from "dayjs"

// Master data returns leave type names in ALL CAPS (e.g. "CASUAL LEAVE") —
// title-case them for display without touching the underlying value/id.
const toTitleCase = (str = "") => str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())

const TABS = [
  { key: "leave", label: "Leave Request" },
  { key: "permission", label: "Permission" },
]

const PERMISSION_HOUR_OPTIONS = [
  { key: "1", label: "1 Hour" },
  { key: "2", label: "2 Hours" },
  { key: "3", label: "3 Hours" },
]

const LeaveRequestFormPage = () => {
  const { goTo } = useSmartNavigation()
  const [searchParams, setSearchParams] = useSearchParams()
  const leaveRequests = useLeaveRequestMaster()
  const rawLeaveTypeOptions = useLeaveTypeOptions()
  const currentUser = readUserFromSession()

  const leaveTypeOptions = useMemo(
    () => rawLeaveTypeOptions.map((opt) => ({ ...opt, label: toTitleCase(opt.label) })),
    [rawLeaveTypeOptions],
  )

  // "+ Leave Request" / "+ Permission" on the list page jump straight to the
  // matching tab via ?tab=, and switching tabs here keeps the URL in sync so
  // it stays bookmarkable/shareable and survives a refresh.
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") === "permission" ? "permission" : "leave")

  const switchTab = (key) => {
    setActiveTab(key)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set("tab", key)
      return next
    }, { replace: true })
  }

  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [sessionOverrides, setSessionOverrides] = useState({})
  const [halfDayEnabled, setHalfDayEnabled] = useState(false)
  const [leaveType, setLeaveType] = useState(null)
  const [comments, setComments] = useState("")
  const [error, setError] = useState("")
  const [warning, setWarning] = useState("")

  // Permission defaults to today while there's still time left before 6:30 PM.
  const today = dayjs().format("YYYY-MM-DD")
  const [permissionDate, setPermissionDate] = useState(() => (getMaxPermissionHours(today) > 0 ? today : ""))
  const [permissionHours, setPermissionHours] = useState("")
  const [permissionRemarks, setPermissionRemarks] = useState("")
  const [permissionError, setPermissionError] = useState("")

  // Leave types load async from the SAP-backed master — default to the
  // first option once it arrives instead of assuming it's there on mount.
  useEffect(() => {
    if (!leaveType && leaveTypeOptions.length > 0) {
      setLeaveType(leaveTypeOptions[0])
    }
  }, [leaveType, leaveTypeOptions])

  const takenSessions = useMemo(
    () => buildTakenSessions(leaveRequests, currentUser?.userId),
    [leaveRequests, currentUser?.userId],
  )

  // Dates with no session left to pick (fully requested, or today with no
  // time left) — blocked in the calendar and used to truncate drag-selections.
  // A date with only one half requested stays pickable for the other half.
  const blockedDates = useMemo(() => {
    const set = new Set()
    const today = dayjs().format("YYYY-MM-DD")
    ;[...takenSessions.keys(), today].forEach((date) => {
      if (getDayAvailability(date, takenSessions).allowed.length === 0) set.add(date)
    })
    return set
  }, [takenSessions])

  // One row per selected date. Defaults to the first allowed session (Full Day,
  // or the only half left); the user's picks apply only while Half Day is on.
  const leaveDays = useMemo(() => {
    if (!fromDate || !toDate) return []
    const rows = []
    for (let d = dayjs(fromDate); !d.isAfter(dayjs(toDate), "day"); d = d.add(1, "day")) {
      const date = d.format("YYYY-MM-DD")
      const { allowed, note } = getDayAvailability(date, takenSessions)
      const picked = halfDayEnabled ? sessionOverrides[date] : undefined
      rows.push({ date, allowed, note, session: allowed.includes(picked) ? picked : allowed[0] })
    }
    return rows
  }, [fromDate, toDate, takenSessions, sessionOverrides, halfDayEnabled])

  const noOfDays = useMemo(
    () => (leaveDays.length ? leaveDays.reduce((sum, d) => sum + (d.session ? sessionDays(d.session) : 0), 0) : ""),
    [leaveDays],
  )

  const handleSessionChange = (date, session) => {
    setSessionOverrides((prev) => ({ ...prev, [date]: session }))
    if (error) setError("")
  }

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
    const unavailable = leaveDays.find((d) => !d.session)
    if (unavailable) {
      setError(`${dayjs(unavailable.date).format("DD MMM")} is not available — please change the dates.`)
      return
    }
    if (!leaveType?.value?.id) {
      setError("Please select a Leave Type.")
      return
    }
    setError("")

    mutate({
      leaveFrom: fromDate,
      leaveTo: toDate,
      leaveTypeId: leaveType.value.id,
      comments,
      days: leaveDays.map(({ date, session }) => ({ date, session })),
    })
  }

  const { mutate: mutatePermission, isPending: isPermissionPending } = useApiMutation({
    url: "/PermissionRequest/Create",
    method: "POST",
    invalidateKeys: [queryKeys.permissionRequest.list(), queryKeys.notification.unreadCount()],
    onSuccess: () => goTo(ROUTE_KEYS.LEAVE_LIST, {}, {}, { tab: "permission" }),
    onError: (err) => setPermissionError(err?.message || "Failed to submit permission request."),
  })

  // Today only allows what still fits before 6:30 PM.
  const maxPermissionHours = getMaxPermissionHours(permissionDate)
  const permissionBlockedDates = getMaxPermissionHours(today) === 0 ? new Set([today]) : undefined

  const handlePermissionDateChange = (value) => {
    setPermissionDate(value)
    if (permissionError) setPermissionError("")
    if (Number(permissionHours) > getMaxPermissionHours(value)) setPermissionHours("")
  }

  const handlePermissionSubmit = (e) => {
    e.preventDefault()

    if (!permissionDate) {
      setPermissionError("Please select a Permission Date.")
      return
    }
    if (!permissionHours) {
      setPermissionError("Please select permission hours.")
      return
    }
    if (Number(permissionHours) > maxPermissionHours) {
      setPermissionError(
        maxPermissionHours === 0
          ? "No time left for a permission today (office ends at 6:30 PM)."
          : `Only ${maxPermissionHours} hour${maxPermissionHours > 1 ? "s" : ""} can be taken today.`,
      )
      return
    }
    setPermissionError("")

    const durationMinutes = Number(permissionHours) * 60

    mutatePermission({
      permissionDate,
      durationMinutes,
      remarks: permissionRemarks,
    })
  }

  return (
    <div className="flex-1 min-h-0 max-w-3xl mx-auto w-full pt-4 sm:pt-6">
      <div className="flex items-center gap-6 border-b border-gray-200 mb-0">
        <button
          type="button"
          onClick={() => goTo(ROUTE_KEYS.LEAVE_LIST)}
          className="flex items-center gap-1 pb-2.5 text-gray-500 hover:text-gray-900"
          aria-label="Back to Leave Requests"
        >
          <ArrowLeft size={18} />
        </button>

        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => switchTab(tab.key)}
            className={`pb-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-brand-yellow text-brand-yellow"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "leave" && (
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

            <LeaveDaySessionPicker
              days={leaveDays}
              onChange={handleSessionChange}
              enabled={halfDayEnabled}
              onToggle={setHalfDayEnabled}
            />

            <div>
              <label className="block mb-1.5 text-sm font-semibold text-gray-700" htmlFor="leaveType">
                Leave Type
              </label>
              <MuiSelectInput
                name="leaveType"
                value={leaveType}
                options={leaveTypeOptions}
                onChange={(_, selected) => setLeaveType(selected)}
                clearable={false}
                theme={{ input: "wg-mui-input wg-leave-type-select w-full" }}
                listboxClassName="wg-leave-type-listbox"
              />
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
      )}

      {activeTab === "permission" && (
      <form onSubmit={handlePermissionSubmit} className="wg-form-container">
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <label className="block mb-1.5 text-sm font-semibold text-gray-700" htmlFor="permissionDate">
                Permission Date <span className="text-red-500">*</span>
              </label>
              <LeaveSingleDatePicker
                value={permissionDate}
                onChange={handlePermissionDateChange}
                blockedDates={permissionBlockedDates}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block mb-1.5 text-sm font-semibold text-gray-700">
                Permission Hours <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {PERMISSION_HOUR_OPTIONS.map((opt) => {
                  const disabled = Number(opt.key) > maxPermissionHours
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        setPermissionHours(opt.key)
                        if (permissionError) setPermissionError("")
                      }}
                      className={`px-4 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                        permissionHours === opt.key
                          ? "bg-brand-yellow border-brand-yellow text-white"
                          : disabled
                            ? "bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed"
                            : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
              {maxPermissionHours < PERMISSION_MAX_HOURS && (
                <p className="mt-1 text-xs text-amber-700">
                  Only {maxPermissionHours} hour{maxPermissionHours > 1 ? "s" : ""} can be taken today (office ends at 6:30 PM).
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block mb-1.5 text-sm font-semibold text-gray-700" htmlFor="permissionRemarks">
                Remarks
              </label>
              <textarea
                id="permissionRemarks"
                value={permissionRemarks}
                onChange={(e) => setPermissionRemarks(e.target.value)}
                className="wg-input resize-none"
                rows={4}
                placeholder="Add any additional notes for your approver..."
              />
            </div>
          </div>

          {permissionError && (
            <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {permissionError}
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
          <button type="submit" disabled={isPermissionPending} className="wg-btn-primary">
            {isPermissionPending ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
      )}
    </div>
  )
}

export default LeaveRequestFormPage

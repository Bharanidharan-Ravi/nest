// ─────────────────────────────────────────────────────────────────────────────
// LeaveRequestPage.jsx
// Lists leave requests via the real /sync/v2 "GetLeaveRequests" master
// (employee sees own rows, admin sees all — resolved server-side from the JWT).
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useMemo, useRef, useState } from "react"
import dayjs from "dayjs"
import { ArrowLeft } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { useSearchParams } from "react-router-dom"
import { useSmartNavigation } from "../../../core/navigation/useSmartNavigation"
import { ROUTE_KEYS } from "../../../core/routing/paths"
import { useActiveEmployees, useLeaveRequestMaster, usePermissionRequestMaster, useLeaveTypeMaster, findLeaveTypeLabel } from "../../../core/master/selectors/selectors"
import { useCurrentUser, readUserFromSession } from "../../../core/auth/useCurrentUser"
import { PERMISSIONS } from "../../../core/auth/permissions"
import { executeApi } from "../../../core/api/executor"
import { queryKeys } from "../../../core/query/queryKeys"
import { WeekRangeFilter } from "../../../packages/ui-List/components/weeklyFilter"
import LeaveRequestActionDialog from "../components/LeaveRequestActionDialog"
import PermissionRequestActionDialog from "../components/PermissionRequestActionDialog"
import CountFilterDropdown from "../components/CountFilterDropdown"
import ConfirmDialog, { useConfirmDialog } from "../../../app/shared/confirmation/confirmationModel"
import { describeHalfDays } from "../leaveSessions"
import { formatDate as formatDisplayDate } from "../../../app/shared/utils/dateFormat"

const formatDate = (value) => formatDisplayDate(value, "")

const formatDuration = (minutes) => {
  if (!minutes) return ""
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h${m ? ` ${m}m` : ""}` : `${m}m`
}

// Static config for WeekRangeFilter — same drag/preset calendar used by the
// dashboard timesheet filter, reused here for client-side date filtering.
const WEEK_RANGE_FILTER = { key: "weekRange", enableDailyNav: true, enableMonthlyNav: true, defaultRange: "month" }
const RANGE_URL_KEY = "range"
const EMPLOYEE_URL_KEY = "employee"
const TAB_URL_KEY = "tab"

const TABS = [
  { key: "leave", label: "Leave Requests" },
  { key: "permission", label: "Permissions" },
]

const TH = "px-4 py-3 font-semibold whitespace-nowrap"
const TD = "px-4 py-3 whitespace-nowrap"

const STATUS_STYLES = {
  REQUESTED: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-500",
}

const isSameId = (a, b) => !!a && !!b && String(a).toLowerCase() === String(b).toLowerCase()

const LeaveRequestPage = () => {
  const { goTo } = useSmartNavigation()
  const { isAdmin, can } = useCurrentUser()
  const canCreate = can(PERMISSIONS.LEAVE_CREATE)
  const queryClient = useQueryClient()
  const leaveRequests = useLeaveRequestMaster()
  const permissionRequests = usePermissionRequestMaster()
  const leaveTypes = useLeaveTypeMaster()
  const activeEmployees = useActiveEmployees()
  const [searchParams, setSearchParams] = useSearchParams()
  const currentUserId = readUserFromSession()?.userId
  const { dialogProps, openDialog } = useConfirmDialog()
  const [cancellingId, setCancellingId] = useState(null)
  const [cancelError, setCancelError] = useState("")

  const activeTab = searchParams.get(TAB_URL_KEY) === "permission" ? "permission" : "leave"
  const switchTab = (key) => {
    setSelectedRequest(null)
    const next = new URLSearchParams(searchParams)
    next.set(TAB_URL_KEY, key)
    setSearchParams(next, { replace: true })
  }
  const requests = activeTab === "leave" ? leaveRequests : permissionRequests

  // The requester may withdraw their own request only while it awaits a decision.
  const canCancel = (request) =>
    request.status?.toUpperCase() === "REQUESTED" && isSameId(request.employeeId, currentUserId)
  // A cancelled request is closed — admins can't open it to approve/reject.
  const canOpen = (request) => isAdmin && request.status?.toUpperCase() !== "CANCELLED"

  const cancelRequest = async (request, kind) => {
    setCancellingId(request.id)
    setCancelError("")
    try {
      const result = await executeApi({
        url: `/${kind === "leave" ? "LeaveRequest" : "PermissionRequest"}/${request.id}/cancel`,
        method: "PATCH",
      })
      if (result?.Ok === false) throw new Error(result?.Err?.M || "Failed to cancel the request.")
      queryClient.invalidateQueries({
        queryKey: kind === "leave" ? queryKeys.leaveRequest.list() : queryKeys.permissionRequest.list(),
      })
    } catch (error) {
      setCancelError(error?.message || "Failed to cancel the request.")
    } finally {
      setCancellingId(null)
    }
  }

  const confirmCancel = (event, request, kind) => {
    event.stopPropagation()
    openDialog({
      variant: "danger",
      title: `Cancel this ${kind === "leave" ? "leave" : "permission"} request?`,
      description: "It will be withdrawn and can no longer be approved or rejected.",
      confirmText: "Yes, Cancel",
      cancelText: "Keep",
      onConfirm: () => cancelRequest(request, kind),
    })
  }

  const renderCancelCell = (request, kind) => (
    <td className={TD}>
      {canCancel(request) ? (
        <button
          type="button"
          onClick={(event) => confirmCancel(event, request, kind)}
          disabled={cancellingId === request.id}
          className="px-2.5 py-1 rounded-md border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
        >
          {cancellingId === request.id ? "Cancelling..." : "Cancel"}
        </button>
      ) : (
        "-"
      )}
    </td>
  )

  const urlRange = searchParams.get(RANGE_URL_KEY) || ""
  const [dateRange, setDateRange] = useState(urlRange)
  const [selectedRequest, setSelectedRequest] = useState(null)
  // WeekRangeFilter auto-initializes its own value to "this month" on mount —
  // that first call is cosmetic (just seeds the pill's label), not a user
  // pick, so it must not silently hide requests outside the current month.
  // Only start actually filtering once the user changes the range themselves
  // (or the page was opened with a range already present in the URL).
  const [userFiltered, setUserFiltered] = useState(!!urlRange)
  const isFirstRangeUpdate = useRef(!urlRange)

  const handleRangeChange = (_key, value) => {
    setDateRange(value)
    if (isFirstRangeUpdate.current) {
      isFirstRangeUpdate.current = false
    } else {
      setUserFiltered(true)
      const next = new URLSearchParams(searchParams)
      next.set(RANGE_URL_KEY, value)
      setSearchParams(next, { replace: true })
    }
  }

  const employeeFilter = isAdmin ? searchParams.get(EMPLOYEE_URL_KEY) || "" : ""

  const handleEmployeeChange = (employee) => {
    const next = new URLSearchParams(searchParams)
    if (employee) next.set(EMPLOYEE_URL_KEY, employee)
    else next.delete(EMPLOYEE_URL_KEY)
    setSearchParams(next, { replace: true })
  }

  const rangeFilteredRequests = useMemo(() => {
    if (!userFiltered || !dateRange) return requests
    const [startStr, endStr] = dateRange.split("~")
    const start = dayjs(startStr)
    const end = dayjs(endStr || startStr)
    return requests.filter((request) => {
      // Leave: overlap test against the [fromDate, toDate] period.
      // Permission: single-day request, so just test it falls within the range.
      const from = dayjs(activeTab === "leave" ? request.fromDate : request.permissionDate)
      const to = dayjs(activeTab === "leave" ? request.toDate : request.permissionDate)
      return !from.isAfter(end, "day") && !to.isBefore(start, "day")
    })
  }, [requests, dateRange, userFiltered, activeTab])

  // Per-employee counts within the current date range, for the admin dropdown.
  // Seeded with every active employee (count 0) so admins can pick anyone, not
  // just people who have already raised a request.
  const employeeOptions = useMemo(() => {
    if (!isAdmin) return []
    const counts = new Map()
    activeEmployees.forEach((employee) => {
      if (employee?.name) counts.set(employee.name, 0)
    })
    rangeFilteredRequests.forEach((request) => {
      const name = request.requestedBy || "Unknown"
      counts.set(name, (counts.get(name) || 0) + 1)
    })
    // Keep the selected employee visible even if the range leaves them with 0.
    if (employeeFilter && !counts.has(employeeFilter)) counts.set(employeeFilter, 0)
    return [...counts.entries()].map(([name, count]) => ({ value: name, label: name, count }))
  }, [isAdmin, activeEmployees, rangeFilteredRequests, employeeFilter])

  const filteredRequests = useMemo(() => {
    if (!employeeFilter) return rangeFilteredRequests
    return rangeFilteredRequests.filter(
      (request) => (request.requestedBy || "Unknown") === employeeFilter
    )
  }, [rangeFilteredRequests, employeeFilter])

  // Opening the list marks "LEAVE_REQUEST" notifications seen — new requests for
  // admins, approved/rejected for employees — same call Header.jsx makes for
  // other notification types. Keeps the unread count (and tab title) clearable.
  useEffect(() => {
    const user = readUserFromSession()
    executeApi({
      url: "/Notification/mark-seen",
      method: "POST",
      payload: { sessionId: user?.sessionId, notificationType: "LEAVE_REQUEST" },
    })
      .then(() => queryClient.invalidateQueries({ queryKey: ["notification"] }))
      .catch((error) => console.error("Failed to mark leave request notifications seen", error))
  }, [queryClient])

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 gap-4">
      <div className="flex flex-wrap justify-between items-center gap-3 flex-none">
        <div className="flex items-center gap-5 border-b border-gray-200">
          <button
            type="button"
            onClick={() => goTo(ROUTE_KEYS.DASHBOARD)}
            className="pb-2 text-gray-400 hover:text-gray-700"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft size={20} />
          </button>

          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => switchTab(tab.key)}
              className={`pb-2 text-lg sm:text-xl font-semibold border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-brand-yellow text-gray-800"
                  : "border-transparent text-gray-400 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <CountFilterDropdown
              allLabel="Employees"
              allCount={rangeFilteredRequests.length}
              options={employeeOptions}
              value={employeeFilter}
              onChange={handleEmployeeChange}
            />
          )}
          <WeekRangeFilter
            filter={WEEK_RANGE_FILTER}
            currentValue={dateRange}
            updateQuery={handleRangeChange}
          />
          {canCreate && (
            <div className="inline-flex rounded-md overflow-hidden border border-brand-yellow shadow-sm">
              <button
                onClick={() => goTo(ROUTE_KEYS.LEAVE_CREATE, {}, {}, { tab: "leave" })}
                className="bg-brand-yellow text-white text-sm px-3 py-1.5 font-medium hover:bg-yellow-500 transition-colors whitespace-nowrap"
              >
                + Leave Request
              </button>
              <button
                onClick={() => goTo(ROUTE_KEYS.LEAVE_CREATE, {}, {}, { tab: "permission" })}
                className="bg-white text-brand-yellow text-sm px-3 py-1.5 font-medium border-l border-brand-yellow hover:bg-yellow-50 transition-colors whitespace-nowrap"
              >
                + Permission
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto bg-white border border-gray-200 rounded-lg shadow-sm">
        {activeTab === "leave" ? (
          <table className="w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                <th className={TH}>From Date</th>
                <th className={TH}>To Date</th>
                <th className={TH}>Leave Type</th>
                <th className={TH}>No. of Days</th>
                <th className={TH}>Comments</th>
                <th className={TH}>Status</th>
                <th className={TH}>Leave Taken</th>
                {isAdmin && <th className={TH}>Requested By</th>}
                <th className={TH}>Requested Date</th>
                <th className={TH}>Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 10 : 9} className="px-4 py-10 text-center text-gray-500">
                    {userFiltered ? "No leave requests in this date range." : "No leave requests yet."}
                  </td>
                </tr>
              )}
              {filteredRequests.map((request) => (
                <tr
                  key={request.id}
                  className={`transition-colors ${canOpen(request) ? "cursor-pointer hover:bg-yellow-50/60" : "hover:bg-gray-50"}`}
                  onClick={() => canOpen(request) && setSelectedRequest(request)}
                >
                  <td className={TD}>{formatDate(request.fromDate)}</td>
                  <td className={TD}>{formatDate(request.toDate)}</td>
                  <td className={TD}>{findLeaveTypeLabel(leaveTypes, request.leaveTypeId)}</td>
                  <td className={TD}>
                    {request.noOfDays}
                    {describeHalfDays(request.days) && (
                      <div className="text-[11px] text-gray-400">{describeHalfDays(request.days)}</div>
                    )}
                  </td>
                  <td className={`${TD} max-w-xs truncate`} title={request.comments}>{request.comments}</td>
                  <td className={TD}>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                        STATUS_STYLES[request.status?.toUpperCase()] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {request.status}
                    </span>
                  </td>
                  <td className={TD}>
                    {request.status !== "APPROVED" ? (
                      "-"
                    ) : request.notTaken ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                        Not Taken
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        Taken
                      </span>
                    )}
                  </td>
                  {isAdmin && <td className={TD}>{request.requestedBy}</td>}
                  <td className={TD}>{formatDate(request.requestedDate)}</td>
                  {renderCancelCell(request, "leave")}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                <th className={TH}>Date</th>
                <th className={TH}>Duration</th>
                <th className={TH}>Actual Duration</th>
                <th className={TH}>Remarks</th>
                <th className={TH}>Status</th>
                {isAdmin && <th className={TH}>Requested By</th>}
                <th className={TH}>Requested Date</th>
                <th className={TH}>Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="px-4 py-10 text-center text-gray-500">
                    {userFiltered ? "No permission requests in this date range." : "No permission requests yet."}
                  </td>
                </tr>
              )}
              {filteredRequests.map((request) => (
                <tr
                  key={request.id}
                  className={`transition-colors ${canOpen(request) ? "cursor-pointer hover:bg-yellow-50/60" : "hover:bg-gray-50"}`}
                  onClick={() => canOpen(request) && setSelectedRequest(request)}
                >
                  <td className={TD}>{formatDate(request.permissionDate)}</td>
                  <td className={TD}>{formatDuration(request.durationMinutes)}</td>
                  <td className={TD}>
                    {request.actualDurationMinutes != null
                      ? formatDuration(request.actualDurationMinutes)
                      : "-"}
                  </td>
                  <td className={`${TD} max-w-xs truncate`} title={request.remarks}>{request.remarks}</td>
                  <td className={TD}>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                        STATUS_STYLES[request.status?.toUpperCase()] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {request.status}
                    </span>
                  </td>
                  {isAdmin && <td className={TD}>{request.requestedBy}</td>}
                  <td className={TD}>{formatDate(request.requestedDate)}</td>
                  {renderCancelCell(request, "permission")}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {cancelError && (
        <div className="flex-none text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {cancelError}
        </div>
      )}

      <ConfirmDialog {...dialogProps} />

      {selectedRequest && activeTab === "leave" && (
        <LeaveRequestActionDialog
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onDone={() => {
            queryClient.invalidateQueries({ queryKey: queryKeys.leaveRequest.list() })
            queryClient.invalidateQueries({ queryKey: ["notification"] })
          }}
        />
      )}

      {selectedRequest && activeTab === "permission" && (
        <PermissionRequestActionDialog
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onDone={() => {
            queryClient.invalidateQueries({ queryKey: queryKeys.permissionRequest.list() })
            queryClient.invalidateQueries({ queryKey: ["notification"] })
          }}
        />
      )}
    </div>
  )
}

export default LeaveRequestPage

// ─────────────────────────────────────────────────────────────────────────────
// LeaveRequestPage.jsx
// Lists leave requests via the real /sync/v2 "GetLeaveRequests" master
// (employee sees own rows, admin sees all — resolved server-side from the JWT).
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useMemo, useRef, useState } from "react"
import dayjs from "dayjs"
import { useQueryClient } from "@tanstack/react-query"
import { useSearchParams } from "react-router-dom"
import { useSmartNavigation } from "../../../core/navigation/useSmartNavigation"
import { ROUTE_KEYS } from "../../../core/routing/paths"
import { useActiveEmployees, useLeaveRequestMaster } from "../../../core/master/selectors/selectors"
import { useCurrentUser, readUserFromSession } from "../../../core/auth/useCurrentUser"
import { executeApi } from "../../../core/api/executor"
import { queryKeys } from "../../../core/query/queryKeys"
import { getLeaveTypeLabel } from "../config/leaveTypes"
import { WeekRangeFilter } from "../../../packages/ui-List/components/weeklyFilter"
import LeaveRequestActionDialog from "../components/LeaveRequestActionDialog"
import CountFilterDropdown from "../components/CountFilterDropdown"

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : "")

// Static config for WeekRangeFilter — same drag/preset calendar used by the
// dashboard timesheet filter, reused here for client-side date filtering.
const WEEK_RANGE_FILTER = { key: "weekRange", enableDailyNav: true, enableMonthlyNav: true, defaultRange: "month" }
const RANGE_URL_KEY = "range"
const EMPLOYEE_URL_KEY = "employee"

const TH = "px-4 py-3 font-semibold whitespace-nowrap"
const TD = "px-4 py-3 whitespace-nowrap"

const STATUS_STYLES = {
  REQUESTED: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
}

const LeaveRequestPage = () => {
  const { goTo } = useSmartNavigation()
  const { isAdmin } = useCurrentUser()
  const queryClient = useQueryClient()
  const leaveRequests = useLeaveRequestMaster()
  const activeEmployees = useActiveEmployees()
  const [searchParams, setSearchParams] = useSearchParams()
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
    if (!userFiltered || !dateRange) return leaveRequests
    const [startStr, endStr] = dateRange.split("~")
    const start = dayjs(startStr)
    const end = dayjs(endStr || startStr)
    return leaveRequests.filter((request) => {
      const from = dayjs(request.fromDate)
      const to = dayjs(request.toDate)
      // Overlap test: request's leave period intersects the selected range.
      return !from.isAfter(end, "day") && !to.isBefore(start, "day")
    })
  }, [leaveRequests, dateRange, userFiltered])

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

  // Opening the list clears the sidebar's "LEAVE_REQUEST" unread badge for admins,
  // same call Header.jsx makes for other notification types.
  useEffect(() => {
    if (!isAdmin) return
    const user = readUserFromSession()
    executeApi({
      url: "/Notification/mark-seen",
      method: "POST",
      payload: { sessionId: user?.sessionId, notificationType: "LEAVE_REQUEST" },
    })
      .then(() => queryClient.invalidateQueries({ queryKey: ["notification"] }))
      .catch((error) => console.error("Failed to mark leave request notifications seen", error))
  }, [isAdmin, queryClient])

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 gap-4">
      <div className="flex flex-wrap justify-between items-center gap-3 flex-none">
        <h2 className="text-xl sm:text-2xl font-semibold m-0 text-gray-800">Leave Requests</h2>

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
          <button
            onClick={() => goTo(ROUTE_KEYS.LEAVE_CREATE)}
            className="bg-brand-yellow text-white text-sm px-3 py-1.5 rounded-md font-medium hover:bg-yellow-500 transition-colors whitespace-nowrap"
          >
            Create Leave Request
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto bg-white border border-gray-200 rounded-lg shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50">
            <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
              <th className={TH}>From Date</th>
              <th className={TH}>To Date</th>
              <th className={TH}>Leave Type</th>
              <th className={TH}>No. of Days</th>
              <th className={TH}>Comments</th>
              <th className={TH}>Status</th>
              {isAdmin && <th className={TH}>Requested By</th>}
              <th className={TH}>Requested Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {filteredRequests.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="px-4 py-10 text-center text-gray-500">
                  {userFiltered ? "No leave requests in this date range." : "No leave requests yet."}
                </td>
              </tr>
            )}
            {filteredRequests.map((request) => (
              <tr
                key={request.id}
                className={`transition-colors ${isAdmin ? "cursor-pointer hover:bg-yellow-50/60" : "hover:bg-gray-50"}`}
                onClick={() => isAdmin && setSelectedRequest(request)}
              >
                <td className={TD}>{formatDate(request.fromDate)}</td>
                <td className={TD}>{formatDate(request.toDate)}</td>
                <td className={TD}>{getLeaveTypeLabel(request.leaveTypeId)}</td>
                <td className={TD}>{request.noOfDays}</td>
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
                {isAdmin && <td className={TD}>{request.requestedBy}</td>}
                <td className={TD}>{formatDate(request.requestedDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedRequest && (
        <LeaveRequestActionDialog
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onDone={() => {
            queryClient.invalidateQueries({ queryKey: queryKeys.leaveRequest.list() })
            queryClient.invalidateQueries({ queryKey: ["notification"] })
          }}
        />
      )}
    </div>
  )
}

export default LeaveRequestPage

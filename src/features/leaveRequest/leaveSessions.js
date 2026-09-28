import dayjs from "dayjs"

export const SESSION = {
  FULL: "FULL",
  FIRST_HALF: "FIRST_HALF",
  SECOND_HALF: "SECOND_HALF",
}

export const SESSION_OPTIONS = [
  { key: SESSION.FULL, label: "Full Day", time: "9:00 AM – 6:30 PM" },
  { key: SESSION.FIRST_HALF, label: "1st Half", time: "9:00 AM – 1:00 PM" },
  { key: SESSION.SECOND_HALF, label: "2nd Half", time: "2:00 PM – 6:30 PM" },
]

const SESSION_LABEL = {
  [SESSION.FULL]: "full day",
  [SESSION.FIRST_HALF]: "1st half",
  [SESSION.SECOND_HALF]: "2nd half",
}

// Must match LeaveDaySession.FirstHalfEnd on the API.
const FIRST_HALF_END_HOUR = 13

const ALL_SESSIONS = [SESSION.FULL, SESSION.FIRST_HALF, SESSION.SECOND_HALF]

export const sessionDays = (session) => (session === SESSION.FULL ? 1 : 0.5)

// "YYYY-MM-DD" → Set of sessions already covered by the user's own
// REQUESTED/APPROVED leave (a rejected or "not taken" request frees them back up).
export const buildTakenSessions = (leaveRequests, userId) => {
  const taken = new Map()
  const add = (date, session) => {
    const key = dayjs(date).format("YYYY-MM-DD")
    if (!taken.has(key)) taken.set(key, new Set())
    taken.get(key).add(session)
  }

  leaveRequests
    .filter(
      (r) =>
        String(r.employeeId) === String(userId) &&
        ["REQUESTED", "APPROVED"].includes(r.status?.toUpperCase()) &&
        !r.notTaken,
    )
    .forEach((r) => {
      if (r.days?.length) {
        r.days.forEach((d) => add(d.date, d.session))
        return
      }
      for (let d = dayjs(r.fromDate); !d.isAfter(dayjs(r.toDate), "day"); d = d.add(1, "day")) {
        add(d, SESSION.FULL)
      }
    })

  return taken
}

// Which sessions can still be picked for a date, and why some can't.
// Pass now = null to skip the "only 2nd half left today" rule (admin edits).
export const getDayAvailability = (date, takenSessions, now = dayjs()) => {
  const taken = takenSessions.get(date)
  if (taken?.has(SESSION.FULL) || (taken?.has(SESSION.FIRST_HALF) && taken?.has(SESSION.SECOND_HALF))) {
    return { allowed: [], note: "Already requested" }
  }

  let allowed = ALL_SESSIONS
  let note = ""

  if (taken?.size) {
    const takenHalf = [...taken][0]
    allowed = allowed.filter((s) => s !== SESSION.FULL && s !== takenHalf)
    note = `${SESSION_LABEL[takenHalf]} already requested`
  }

  if (now && dayjs(date).isSame(now, "day") && now.hour() >= FIRST_HALF_END_HOUR) {
    allowed = allowed.filter((s) => s === SESSION.SECOND_HALF)
    note = allowed.length ? "Only the 2nd half is left today" : "No time left today"
  }

  return { allowed, note }
}

// "30 Sep (1st half), 02 Oct (2nd half)" — only the half days of a request.
export const describeHalfDays = (days = []) =>
  days
    .filter((d) => d.session && d.session !== SESSION.FULL)
    .map((d) => `${dayjs(d.date).format("DD MMM")} (${SESSION_LABEL[d.session]})`)
    .join(", ")

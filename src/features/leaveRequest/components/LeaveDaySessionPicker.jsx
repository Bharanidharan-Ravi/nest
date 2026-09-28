import dayjs from "dayjs"
import { SESSION_OPTIONS, describeHalfDays } from "../leaveSessions"

export default function LeaveDaySessionPicker({ days, onChange, enabled, onToggle }) {
  if (!days.length) return null

  const autoHalfDays = describeHalfDays(days)

  return (
    <div className="md:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="halfDayToggle" className="text-sm font-semibold text-gray-700 cursor-pointer">
          Half Day
          <span className="ml-1.5 text-xs font-normal text-gray-400">Choose 1st / 2nd half for specific days</span>
        </label>
        <button
          id="halfDayToggle"
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => onToggle(!enabled)}
          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
            enabled ? "bg-brand-yellow" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {!enabled && autoHalfDays && (
        <p className="mt-1 text-xs text-amber-700">Includes half day: {autoHalfDays}</p>
      )}

      {enabled && (
      <div className="mt-2 border border-gray-200 rounded-md divide-y divide-gray-100 max-h-72 overflow-y-auto">
        {days.map((day) => {
          const d = dayjs(day.date)
          return (
            <div
              key={day.date}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2.5"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-800">
                  {d.format("ddd, DD MMM")}
                  {d.isSame(dayjs(), "day") && (
                    <span className="ml-2 text-[10px] font-semibold uppercase text-brand-yellow">Today</span>
                  )}
                </div>
                {day.note && <div className="text-[11px] text-amber-700">{day.note}</div>}
              </div>

              <div className="grid grid-cols-3 gap-1.5 sm:w-[360px] shrink-0">
                {SESSION_OPTIONS.map((opt) => {
                  const selected = day.session === opt.key
                  const disabled = !day.allowed.includes(opt.key)
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      disabled={disabled}
                      onClick={() => onChange(day.date, opt.key)}
                      className={`px-2 py-1.5 rounded-md border text-center transition-colors ${
                        selected
                          ? "bg-brand-yellow border-brand-yellow text-white"
                          : disabled
                            ? "bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed"
                            : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <div className="text-xs font-semibold">{opt.label}</div>
                      <div className={`text-[10px] ${selected ? "text-white/90" : ""}`}>{opt.time}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      )}
    </div>
  )
}

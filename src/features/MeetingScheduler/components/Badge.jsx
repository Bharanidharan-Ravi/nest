const COLOR_MAP = {
  Organized : "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Disbanded : "bg-red-50 text-red-600 border border-red-200",
  Completed : "bg-blue-50 text-blue-700 border border-blue-200",
  Available : "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Leave     : "bg-red-50 text-red-600 border border-red-200",
  Vacation  : "bg-orange-50 text-orange-600 border border-orange-200",
  WFH       : "bg-blue-50 text-blue-700 border border-blue-200",
  Internal  : "bg-indigo-50 text-indigo-700 border border-indigo-200",
  Client    : "bg-violet-50 text-violet-700 border border-violet-200",
};

/**
 * Small pill badge for status / type labels.
 * @param {{ status: string }} props
 */
export default function Badge({ status }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium
        ${COLOR_MAP[status] ?? "bg-gray-100 text-gray-600"}`}
    >
      {status}
    </span>
  );
}

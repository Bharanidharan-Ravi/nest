// ─────────────────────────────────────────────────────────────────────────────
// LabelCard.jsx
// Used as cardRenderer in LabelUI.config.jsx
// ─────────────────────────────────────────────────────────────────────────────

const LabelCard = ({ item }) => {
  return (
    <div className="wg-card flex items-center gap-3 p-3">
      {/* Color swatch — shows the hex color visually */}
      <div
        className="w-8 h-8 rounded-full flex-shrink-0 border border-gray-200"
        style={{ backgroundColor: item.color || "#e5e7eb" }}
        title={item.color || "No color"}
      />

      <div className="flex-1 min-w-0">
        {/* Title + key badge */}
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{item.title}</span>
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-xs text-gray-500 truncate mt-0.5">
            {item.description}
          </p>
        )}
      </div>

      {/* Status badge */}
      <span
        className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
          item.status === "Active"
            ? "bg-green-100 text-green-700"
            : "bg-gray-100 text-gray-500"
        }`}
      >
        {item.status ?? "Active"}
      </span>
    </div>
  )
}

export default LabelCard
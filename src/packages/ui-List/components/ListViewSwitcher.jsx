import { useList } from "../context/ListContext"

const VIEW_LABELS = {
  table: "Table",
  card: "Card",
  graph: "Graph",
};

export function ListViewSwitcher() {
  const { view, setView, config } = useList()

  if (!config.allowViewSwitch) return null

  // If array → use it. If true → fallback to defaults.
  const views = Array.isArray(config.allowViewSwitch)
    ? config.allowViewSwitch
    : ["table", "card"];

  const theme = config.theme || {};

  const getBtnClass = (isActive) =>
    isActive
      ? (theme.viewBtnActive || "px-3 py-1.5 text-sm font-medium bg-ghBorder text-ghText rounded-md")
      : (theme.viewBtnInactive || "px-3 py-1.5 text-sm font-medium bg-ghBg border border-ghBorder text-ghMuted hover:text-ghText hover:bg-ghHover rounded-md transition-colors");

  return (
    <div className="flex gap-2">
      {views.map((v) => (
        <button
          key={v}
          onClick={() => setView(v)}
          className={getBtnClass(view === v)}
        >
          {VIEW_LABELS[v] || v}
        </button>
      ))}
    </div>
  )
}
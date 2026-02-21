import { useList } from "../context/ListContext"

export function ListViewSwitcher() {
  const { view, setView, config } = useList()

  if (!config.allowViewSwitch) return null

  const theme = config.theme || {};
  
  const getBtnClass = (isActive) => {
    return isActive 
      ? (theme.viewBtnActive || "px-3 py-1.5 text-sm font-medium bg-ghBorder text-ghText rounded-md")
      : (theme.viewBtnInactive || "px-3 py-1.5 text-sm font-medium bg-ghBg border border-ghBorder text-ghMuted hover:text-ghText hover:bg-ghHover rounded-md transition-colors");
  };

  return (
    <div className="flex gap-2">
      <button 
        onClick={() => setView("table")} 
        className={getBtnClass(view === "table")}
      >
        Table
      </button>
      <button 
        onClick={() => setView("card")} 
        className={getBtnClass(view === "card")}
      >
        Card
      </button>
    </div>
  )
}
import { useList } from "../context/ListContext";

export function ListTabs() {
  const { statusTab, setStatusTab, config } = useList();

  if (!config.tabConfig) return null;

  const theme = config.theme || {};
  const containerClasses = theme.tabsContainer || "flex gap-2 items-center";

  return (
    <div className={containerClasses}>
      {config.tabConfig.map((tab) => {
        const isActive = statusTab === tab.key;
        
        const activeClass = isActive 
          ? (theme.tabActive || "px-3 py-1 text-sm font-semibold text-ghText bg-ghBorder rounded-md") 
          : (theme.tabInactive || "px-3 py-1 text-sm font-medium text-ghMuted hover:text-ghText hover:bg-ghBorder/50 rounded-md transition-colors");

        return (
          <button
            key={tab.key}
            onClick={() => setStatusTab(tab.key)}
            className={activeClass}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
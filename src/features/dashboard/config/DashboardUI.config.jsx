export const DashboardUI = {
  defaultView: "card",
  enableSearch: false,
  enableTabs: false, // 👈 required
  enableSort: false,
  cardRenderer: (item) => (
    <div className="flex flex-col gap-1">
      <h3 className="text-ghBlue font-semibold text-base m-0">{item.title}</h3>
      {/* <p className="text-ghMuted text-sm">{item.owner}</p> */}
      <p className="text-xs text-ghMuted ">Updated: {item.createdAt}</p>
    </div>
  ),
}

export const DashboardTableUI = {
  defaultView: "table",
  enableSearch: false,
  enableTabs: false, // 👈 required
  enableSort: false,
  cardRenderer: (item) => (
    <div className="flex flex-col gap-1">
      <h3 className="text-ghBlue font-semibold text-base m-0">{item.title}</h3>
      {/* <p className="text-ghMuted text-sm">{item.owner}</p> */}
      <p className="text-xs text-ghMuted ">Updated: {item.createdAt}</p>
    </div>
  ),
}
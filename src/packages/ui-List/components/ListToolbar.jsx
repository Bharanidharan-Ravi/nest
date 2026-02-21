import { useList } from "../context/ListContext"

export function ListToolbar() {
  const { search, setSearch, view, setView } = useList()

  return (
    <div className="flex justify-between items-center p-3 border-b">
      <input
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border px-2 py-1 rounded"
      />

      <div className="flex gap-2">
        <button onClick={() => setView("table")}>Table</button>
        <button onClick={() => setView("card")}>Card</button>
      </div>
    </div>
  )
}
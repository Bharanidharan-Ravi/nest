import { useList } from "../context/ListContext"

export function ListPagination() {
  const { page, setPage } = useList()

  return (
    <div className="flex justify-center gap-3 p-4">
      <button onClick={() => setPage(p => p - 1)}>Prev</button>
      <button onClick={() => setPage(p => p + 1)}>Next</button>
    </div>
  )
}
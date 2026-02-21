import { useList } from "../context/ListContext"

export function ListCardView() {
  const { config } = useList()
  const data = config.data || []

  return (
    <div className="grid grid-cols-3 gap-4 p-4">
      {data.map(item =>
        config.cardRenderer(item)
      )}
    </div>
  )
}
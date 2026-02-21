import { useList } from "../context/ListContext"

export function ListFilters() {
  const { filters, setFilters, config } = useList()

  return (
    <div className="flex gap-3 p-3 border-b">
      {config.filters?.map(filter => (
        <select
          key={filter.key}
          onChange={(e) =>
            setFilters(prev => ({
              ...prev,
              [filter.key]: e.target.value
            }))
          }
        >
          {filter.options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  )
}
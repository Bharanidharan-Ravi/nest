import { useList } from "../context/ListContext"

export function ListTableView() {
  const { config } = useList()
  const data = config.data || []

  return (
    <table className="w-full">
      <thead>
        <tr>
          {config.columns.map(col => (
            <th key={col.key}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map(item => (
          <tr key={item.id}>
            {config.columns.map(col => (
              <td key={col.key}>
                {col.render ? col.render(item) : item[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
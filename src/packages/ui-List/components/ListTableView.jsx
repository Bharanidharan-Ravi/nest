import { useList } from "../context/ListContext"

export function ListTableView() {
  const { data, config } = useList()
console.log("ListTableView data:", data, config);

  return (
    <table className="w-full text-gray-200">
      <thead className="">
        <tr>
          {config.columns.map(col => (
            <th key={col.key} className="p-3 text-left">
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map(item => (
          <tr key={item.id} className="border-t border-gray-700 hover:">
            {config.columns.map(col => (
              <td key={col.key} className="p-3">
                {item[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
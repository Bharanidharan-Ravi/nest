import { useList } from "../context/ListContext"


export function ListTableView() {
  const { data, config } = useList();
  const theme = config.theme || {};

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className={theme.tableHeaderRow || "bg-gray-50 border-b border-gray-200 text-gray-500"}>
            {/* Checkbox Header */}
            {config.enableSelection && (
              <th className="p-3 w-10 text-center">
                {/* Optional: Add a "Select All" checkbox here in the future */}
              </th>
            )}
            
            {config.columns.map(col => (
              <th 
                key={col.key} 
                className={`${theme.tableHeaderCell || 'p-3 font-medium whitespace-nowrap'} ${col.className || ''}`}
              >
                {col.label}
              </th>
            ))}

            {/* Actions Header */}
            {config.enableEdit && (
              <th className="p-3 w-20 text-center">Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map(item => (
            <tr 
              key={item.id} 
              onClick={() => config.onItemClick && config.onItemClick(item)}
              className={theme.tableRow || "border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150 group cursor-pointer"}
            >
              {/* Checkbox Cell */}
              {config.enableSelection && (
                <td className="p-3 align-middle text-center" 
                onClick={(e) => e.stopPropagation()}>
                  <input 
                    type="checkbox" 
                    className="cursor-pointer w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    onChange={(e) => config.onSelectionChange && config.onSelectionChange(item, e.target.checked)}
                  />
                </td>
              )}

              {config.columns.map(col => (
                <td key={col.key} className={theme.tableCell || "p-3 align-middle"}>
                  {col.render ? col.render(item) : item[col.key]}
                </td>
              ))}

              {/* Actions Cell */}
              {config.enableEdit && (
                <td className="p-3 align-middle text-center" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-800 hover:underline px-2 py-1 text-sm font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (config.onEditClick) config.onEditClick(item);
                    }}
                  >
                    Edit
                  </button>
                </td>
              )}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td 
                colSpan={config.columns.length + (config.enableSelection ? 1 : 0) + (config.enableEdit ? 1 : 0)} 
                className="p-8 text-center text-gray-400"
              >
                No items found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
// export function ListTableView() {
//   const { data, config } = useList();
//   const theme = config.theme || {};

//   return (
//     <div className="w-full overflow-x-auto">
//       <table className="w-full text-left border-collapse text-sm">
//         <thead>
//           <tr className={theme.tableHeaderRow || "bg-gray-50 border-b border-gray-200 text-gray-500"}>
//             {/* Checkbox Header */}
//             {config.enableSelection && (
//               <th className="p-3 w-10 text-center">
//                 {/* Optional: Add a "Select All" checkbox here in the future */}
//               </th>
//             )}
            
//             {config.columns.map(col => (
//               <th 
//                 key={col.key} 
//                 className={`${theme.tableHeaderCell || 'p-3 font-medium whitespace-nowrap'} ${col.className || ''}`}
//               >
//                 {col.label}
//               </th>
//             ))}

//             {/* Actions Header */}
//             {config.enableEdit && (
//               <th className="p-3 w-20 text-center">Actions</th>
//             )}
//           </tr>
//         </thead>
//         <tbody>
//           {data.map(item => (
//             <tr 
//               key={item.id} 
//               onClick={() => config.onItemClick && config.onItemClick(item)}
//               className={theme.tableRow || "border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150 group cursor-pointer"}
//             >
//               {/* Checkbox Cell */}
//               {config.enableSelection && (
//                 <td className="p-3 align-middle text-center" onClick={(e) => e.stopPropagation()}>
//                   <input 
//                     type="checkbox" 
//                     className="cursor-pointer w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
//                     onChange={(e) => config.onSelectionChange && config.onSelectionChange(item, e.target.checked)}
//                   />
//                 </td>
//               )}

//               {config.columns.map(col => (
//                 <td key={col.key} className={theme.tableCell || "p-3 align-middle"}>
//                   {col.render ? col.render(item) : item[col.key]}
//                 </td>
//               ))}

//               {/* Actions Cell */}
//               {config.enableEdit && (
//                 <td className="p-3 align-middle text-center" onClick={(e) => e.stopPropagation()}>
//                   <button
//                     type="button"
//                     className="text-blue-600 hover:text-blue-800 hover:underline px-2 py-1 text-sm font-medium"
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       if (config.onEditClick) config.onEditClick(item);
//                     }}
//                   >
//                     Edit
//                   </button>
//                 </td>
//               )}
//             </tr>
//           ))}
//           {data.length === 0 && (
//             <tr>
//               <td 
//                 colSpan={config.columns.length + (config.enableSelection ? 1 : 0) + (config.enableEdit ? 1 : 0)} 
//                 className="p-8 text-center text-gray-400"
//               >
//                 No items found.
//               </td>
//             </tr>
//           )}
//         </tbody>
//       </table>
//     </div>
//   )
// }
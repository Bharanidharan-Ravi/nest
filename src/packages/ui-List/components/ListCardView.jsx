import { useList } from "../context/ListContext";
import { FiEdit } from "react-icons/fi";

export function ListCardView() {
  const { data, config } = useList();

  const theme = config.theme || {};
  const containerClasses = theme.cardContainer || "flex flex-col w-full";

  const itemClasses =
    theme.cardItem ||
    "p-1.5 border-b border-ghBorder bg-white hover:bg-ghHover transition-colors duration-150 last:border-b-0 w-full overflow-hidden break-words relative cursor-pointer";

  const advanced = config.enableCardControls;

  return (
    <div className={containerClasses}>
      {data.map((item) => {
        const isDisabled = config.disabledIds?.includes(item.id || item.issueId) || false;
        const controls = advanced
          ? {
            disabled: isDisabled,
              renderCheckbox: config.enableSelection
                ? () => (
                    <input
                      type="checkbox"
                      className="cursor-pointer w-4 h-4"
                      defaultChecked={config.selectedIds?.includes(item.id) || false}
                      onClick={(e) => {
                        e.stopPropagation();
                        config.onSelectionChange &&
                          config.onSelectionChange(item, e.target.checked);
                      }}
                    />
                  )
                : null,

              renderEdit: config.enableEdit
                ? () => (
                    <FiEdit
                      className="cursor-pointer text-gray-500 hover:text-blue-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        config.onEditClick && config.onEditClick(item);
                      }}
                    />
                  )
                : null,
            }
          : null;

        return (
          <div
            key={item.id}
            className={itemClasses}
            onClick={() => config.onItemClick && config.onItemClick(item)}
          >
            {/* OLD MODE CONTROLS */}
            {!advanced && config.enableSelection && (
              <div
                className="absolute left-3 top-2 flex items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  className="cursor-pointer w-4 h-4"
                  defaultChecked = {config.selectedIds?.includes(item.id) || false}
                  onChange={(e) =>
                    config.onSelectionChange &&
                    config.onSelectionChange(item, e.target.checked)
                  }
                />
              </div>
            )}

            {!advanced && config.enableEdit && (
              <div
                className="absolute right-3 top-2 flex items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <FiEdit
                  onClick={(e) => {
                    e.stopPropagation();
                    config.onEditClick && config.onEditClick(item);
                  }}
                />
              </div>
            )}

            {/* CARD CONTENT */}
            <div className={`w-full ${!advanced && config.enableSelection ? "pl-7" : ""}`}>
              {advanced
                ? config.cardRenderer(item, controls)
                : config.cardRenderer(item)}
            </div>
          </div>
        );
      })}
    </div>
  );
}






// import { useList } from "../context/ListContext";
// import { FiEdit } from "react-icons/fi";

// export function ListCardView() {
//   const { data, config } = useList();

//   const theme = config.theme || {};

//   const containerClasses = theme.cardContainer || "flex flex-col w-full";
//   const itemClasses =
//     theme.cardItem ||
//     "p-1.5 border-b border-ghBorder bg-white hover:bg-ghHover transition-colors duration-150 last:border-b-0 w-full overflow-hidden break-words relative cursor-pointer";
//   return (
//     <div className={containerClasses}>
//       {data.map((item) => (
//         <div
//           key={item.id}
//           className={itemClasses}
//           onClick={() => config.onItemClick && config.onItemClick(item)}
//         >
//           {/* 1. ABSOLUTE CHECKBOX */}
//           {config.enableSelection && (
//             <div
//               // 🔥 top-3 matches the card padding. h-8 & items-center perfectly vertically centers the checkbox!
//               className="absolute left-3 top-2 flex items-center h-4.5"
//               onClick={(e) => e.stopPropagation()}
//             >
//               <input
//                 type="checkbox"
//                 className="cursor-pointer w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
//                 onChange={(e) =>
//                   config.onSelectionChange &&
//                   config.onSelectionChange(item, e.target.checked)
//                 }
//               />
//             </div>
//           )}

//           {/* 2. ABSOLUTE EDIT BUTTON */}
//           {config.enableEdit && (
//             <div
//               // 🔥 Matches the checkbox wrapper exactly
//               className="absolute right-3 top-2 flex items-center h-4.5"
//               onClick={(e) => e.stopPropagation()}
//             >
//               <FiEdit
//                 className=""
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   if (config.onEditClick) config.onEditClick(item);
//                 }}
//               />
//               {/* <button
//                 type="button"
//                 className="text-xs text-gray-600 hover:text-blue-600 border border-gray-200 hover:border-blue-300 bg-gray-50 hover:bg-blue-50 rounded px-3 py-1.5 transition-colors shadow-sm"
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   if (config.onEditClick) config.onEditClick(item);
//                 }}
//               >
//                 Edit
//               </button> */}
//             </div>
//           )}

//           {/* 3. CARD CONTENT */}
//           {/* <div className={`w-full ${config.enableSelection ? 'pl-7' : ''} ${config.enableEdit ? '' : ''}`}>
//             {config.cardRenderer(item)}
//           </div> */}
//           <div className="w-full">
//             {config.enableCardControls
//               ? config.cardRenderer(item, {
//                   renderCheckbox: config.enableSelection
//                     ? () => (
//                         <input
//                           type="checkbox"
//                           className="cursor-pointer w-4 h-4"
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             if (config.onSelectionChange)
//                               config.onSelectionChange(item, e.target.checked);
//                           }}
//                         />
//                       )
//                     : null,

//                   renderEdit: config.enableEdit
//                     ? () => (
//                         <FiEdit
//                           className="cursor-pointer text-gray-500 hover:text-blue-600"
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             if (config.onEditClick) config.onEditClick(item);
//                           }}
//                         />
//                       )
//                     : null,
//                 })
//               : config.cardRenderer(item)}
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }

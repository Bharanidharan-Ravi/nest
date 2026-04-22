// core/FormEngine.jsx
import { inputRegistry } from "../registry/inputRegistry";

const FormEngine = ({
  fields,
  values,
  errors = {},
  onChange,
  master,
  uploadFile,
  onFileDelete,
  globalTheme,
}) => {
  const colSpanClasses = {
    12: "col-span-12",
    8: "col-span-12 md:col-span-8",
    6: "col-span-12 md:col-span-6",
    4: "col-span-12 md:col-span-4",
    5: "col-span-12 md:col-span-5",
    3: "col-span-12 md:col-span-3",
    2: "col-span-12 md:col-span-2",
    1: "col-span-12 md:col-span-1",
  };

  const getErrors = (field) => {
    const err = errors[field.name];
    if (typeof err === "string") return err;
    if (Array.isArray(err)) return err.join(", ");
    return null;
  };

  const getError = (field) => {
    const err = errors[field.name];
    if (!err) return null;
    if (field.type === "group" && field.isMulti) return err;
    return err;
  };

  // 🔥 Build the elements array manually so we can inject headers
  const renderElements = [];
  let currentGroupName = null;

  if (fields?.length > 0) {
    fields.forEach((field, index) => {
      // const Component = inputRegistry?.[field.ui || "html"]?.[field.type];
      const Component = field.customComponent || inputRegistry?.[field.ui || "html"]?.[field.type];
      if (!Component) return;

      const fieldTheme = field.theme || globalTheme || {};
      const fielderror = getError(field);

      // 1. Determine the column span
      let currentSpan = field.colSpan || 6;
      if (
        field.type === "adEditor" ||
        field.type === "group" ||
        field.fullWidth
      ) {
        currentSpan = 12;
      }
      const spanClass = colSpanClasses[currentSpan] || colSpanClasses[12];

      // 🔥 2. Group Header Injection
      if (field.groupName && field.groupName !== currentGroupName) {
        currentGroupName = field.groupName;
        renderElements.push(
          <div
            key={`header-${field.groupName}-${index}`}
            className="col-span-12 mt-4 mb-2 pb-2 border-b border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-800">
              {field.groupName}
            </h3>
          </div>
        );
      } else if (!field.groupName && currentGroupName !== null) {
        // Reset group tracking if we transition back to ungrouped fields
        currentGroupName = null;
      }

      // 3. Push the actual field
      renderElements.push(
        <div key={field.name} className={spanClass}>
          <Component
            name={field.name}
            label={field.label}
            value={values[field.name]}
            error={fielderror}
            options={field.options}
            multiple={field.multiple}
            fields={field.fields}
            onChange={onChange}
            required={field.required}
            clearable={field.clearable}
            disabled={field.disabled}
            userList={master?.EmployeeList}
            labelList={master?.LabelMaster}
            uploadFile={uploadFile}
            onFileDelete={onFileDelete}
            theme={fieldTheme}
            isMulti={field.isMulti}
          />
        </div>
      );
    });
  }

  return (
    <div className="grid grid-cols-12 gap-x-6 gap-y-5">
      {renderElements}
    </div>
  );
};

export default FormEngine;

// // core/FormEngine.jsx
// import { inputRegistry } from "../registry/inputRegistry";

// const FormEngine = ({
//   fields,
//   values,
//   errors = {},
//   onChange,
//   master,
//   uploadFile,
//   onFileDelete,
//   globalTheme,
// }) => {
//   const colSpanClasses = {
//     12: "col-span-12",
//     8: "col-span-12 md:col-span-8",
//     6: "col-span-12 md:col-span-6",
//     4: "col-span-12 md:col-span-4",
//     3: "col-span-12 md:col-span-3",
//     2: "col-span-12 md:col-span-2",
//     1: "col-span-12 md:col-span-1",
//   };

//   const getErrors = (field) => {
//     const err = errors[field.name];
//     if (typeof err === "string") return err;
//     if (Array.isArray(err)) return err.join(", ");
//     return null;
//   };
//   const getError = (field) => {
//     const err = errors[field.name];
//     if (!err) return null;
//     if (field.type === "group" && field.isMulti) return err;
//     return err;
//   };
//   return (
//     // 1. CSS Grid: 1 column on mobile/small spaces, 2 columns when space allows
//     <div className="grid grid-cols-12 gap-x-6 gap-y-5">
//       {fields?.length > 0 &&
//         fields.map((field) => {
//           const Component = inputRegistry?.[field.ui || "html"]?.[field.type];

//           if (!Component) return null;
//           const fieldTheme = field.theme || globalTheme || {};
//           const fielderrors = getErrors(field);
//           const fielderror = getError(field);

//           // 3. Determine the column span for this specific field
//           let currentSpan = field.colSpan || 6; // Default to 6 (50% width)

//           // Force full width (12 columns) for specific types or if explicitly requested
//           if (
//             field.type === "adEditor" ||
//             field.type === "group" ||
//             field.fullWidth
//           ) {
//             currentSpan = 12;
//           }

//           // Safely grab the Tailwind classes from our map (fallback to 12 if an invalid number is passed)
//           const spanClass = colSpanClasses[currentSpan] || colSpanClasses[12];

//           return (
//             // 4. Apply the dynamic span class to the wrapper
//             <div key={field.name} className={spanClass}>
//               <Component
//                 name={field.name}
//                 label={field.label}
//                 value={values[field.name]}
//                 error={fielderror}
//                 options={field.options}
//                 multiple={field.multiple}
//                 fields={field.fields}
//                 onChange={onChange}
//                 required={field.required}
//                 clearable={field.clearable}
//                 disabled={field.disabled}
//                 userList={master?.EmployeeList}
//                 labelList={master?.LabelMaster}
//                 uploadFile={uploadFile}
//                 onFileDelete={onFileDelete}
//                 theme={fieldTheme}
//                 isMulti={field.isMulti}
//               />
//             </div>
//           );
//         })}
//     </div>
//   );
// };

// export default FormEngine;
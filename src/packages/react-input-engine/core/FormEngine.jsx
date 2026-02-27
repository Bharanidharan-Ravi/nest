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
    3: "col-span-12 md:col-span-2",
  };
  return (
    // 1. CSS Grid: 1 column on mobile/small spaces, 2 columns when space allows
    <div className="grid grid-cols-12 gap-x-6 gap-y-5">
      {fields?.length > 0 &&
        fields.map((field) => {
          const Component = inputRegistry?.[field.ui || "html"]?.[field.type];

          if (!Component) return null;
          const fieldTheme = field.theme || globalTheme || {};

          // 3. Determine the column span for this specific field
          let currentSpan = field.colSpan || 6; // Default to 6 (50% width)

          // Force full width (12 columns) for specific types or if explicitly requested
          if (
            field.type === "adEditor" ||
            field.type === "group" ||
            field.fullWidth
          ) {
            currentSpan = 12;
          }

          // Safely grab the Tailwind classes from our map (fallback to 12 if an invalid number is passed)
          const spanClass = colSpanClasses[currentSpan] || colSpanClasses[12];

          return (
            // 4. Apply the dynamic span class to the wrapper
            <div key={field.name} className={spanClass}>
              <Component
                name={field.name}
                label={field.label}
                value={values[field.name]}
                error={errors[field.name]}
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
              />
            </div>
          );
        })}
    </div>
  );
};

export default FormEngine;

// const FormEngine = ({ fields, values, setValues, masters }) => {

//   const setFieldValue = (name, data) => {
//     setValues(prev => ({ ...prev, [name]: data }));
//   };

//   const resolveOptions = (field) => {
//     if (field.resolveOptions) {
//       return field.resolveOptions({ masters, values });
//     }
//     return field.options || [];
//   };

//   // 🔥 handle dependency reset
//   useEffect(() => {
//     fields.forEach(field => {
//       if (!field.dependsOn) return;

//       field.dependsOn.forEach(dep => {
//         if (!values[dep]) {
//           setFieldValue(field.name, null);
//         }
//       });
//     });
//   }, [values]);

//   return (
//     <>
//       {fields.map(field => {
//         const Component =
//           inputRegistry?.[field.ui || "html"]?.[field.type];

//         if (!Component) {
//           console.error("Missing component", field);
//           return null;
//         }

//         return (
//           <Component
//             key={field.name}
//             field={field}
//             value={values[field.name]}
//             options={resolveOptions(field)}
//             onChange={setFieldValue}
//           />
//         );
//       })}
//     </>
//   );
// };

// export default FormEngine;

////////////////////////////////////////////////////////////////

// import { inputRegistry } from "../registry/inputRegistry";
// import { useFormEngine } from "./useFormEngine";

// const FormEngine = ({ fields, values, setValues }) => {
//   const engine = useFormEngine({ fields, values, setValues });

//   return (
//     <>
//       {fields.map((field) => {
//         const Component = inputRegistry[field.ui || "html"][field.type];
//         if (!Component) {
//           console.error("❌ Missing input component", {
//             fieldName: field.name,
//             ui,
//             type,
//             registry: inputRegistry,
//           });
//           return null;
//         }

//         return (
//           <Component
//             key={field.name}
//             field={field}
//             value={values[field.name]}
//             values={values}
//             onChange={engine.handleChange}
//             onSelect={engine.handleSelect}
//           />
//         );
//       })}
//     </>
//   );
// };

// export default FormEngine;

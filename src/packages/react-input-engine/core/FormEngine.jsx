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
  globalTheme
}) => {
  return (
    // 1. CSS Grid: 1 column on mobile/small spaces, 2 columns when space allows
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
      {fields?.length > 0 &&
        fields.map((field) => {
          const Component = inputRegistry?.[field.ui || "html"]?.[field.type];

          if (!Component) return null;
          const fieldTheme = field.theme || globalTheme || {};
          // 2. Logic to determine if a field should take the full width of the row
          // We force 'adEditor' and 'group' (multi-inputs) to always take a full line.
          // You can also add `fullWidth: true` to any field in CreateRepo.Config.js to force it!
          const isFullWidth =
            field.type === "adEditor" ||
            field.type === "group" ||
            field.fullWidth;

          return (
            // 3. Apply column spanning conditionally
            <div
              key={field.name}
              className={
                isFullWidth ? "col-span-1 md:col-span-2" : "col-span-1"
              }
            >
              <Component
                name={field.name}
                label={field.label}
                value={values[field.name]}
                error={errors[field.name]}
                options={field.options}
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

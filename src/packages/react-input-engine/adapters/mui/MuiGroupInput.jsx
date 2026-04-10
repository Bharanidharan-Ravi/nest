import { Button, TextField, Autocomplete } from "@mui/material"; // 🔥 Make sure Autocomplete is imported
import MuiDateInput from "./MuiDateInput";

const createEmptyGroup = (fields) => {
  return fields.reduce((acc, field) => {
    const identifier = field.name || field.key;
    if (identifier) {
      acc[identifier] = "";
    }
    return acc;
  }, {});
};

const MuiGroupInput = ({
  name,
  label,
  value,
  onChange,
  fields = [],
  disabled = false,
  theme = {},
  error = {},
  isMulti = true,
}) => {
  let normalizedValues = [];

  if (Array.isArray(value) && value.length > 0) {
    normalizedValues = value;
  } else if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).length > 0
  ) {
    normalizedValues = [value];
  } else {
    normalizedValues = [createEmptyGroup(fields)];
  }

  const values = normalizedValues;

  const handleChange = (index, key, val) => {
    const updated = [...values];
    updated[index] = {
      ...updated[index],
      [key]: val, // val will now be the full { label, value } object
    };

    const valueToEmit = isMulti ? updated : updated[0];
    onChange(name, valueToEmit);
  };

  const handleAdd = () => {
    onChange(name, [...values, createEmptyGroup(fields)]);
  };

  const handleRemove = (index) => {
    const updated = [...values];
    updated.splice(index, 1);
    onChange(name, updated);
  };

  const getFieldError = (rowIndex, fieldName) => {
    if (!isMulti && error && !Array.isArray(error)) {
      return error[fieldName];
    }
    return Array.isArray(error) ? error[rowIndex]?.[fieldName] : null;
  };

  return (
    <div>
      <h4>{isMulti && label}</h4>

      {values.map((item, idx) => (
        <div
          key={`${name}-${idx}`}
          className={
            theme.MultiInput
              ? theme.MultiInput
              : isMulti
                ? "flex gap-3 mb-3"
                : "flex flex-col gap-3 col-12"
          }
        >
          {fields.map((subField) => {
            const fieldError = getFieldError(idx, subField.name);
            if (subField.type === "date") {
              return (
                <MuiDateInput
                  key={`${name}-${idx}-${subField.name}`}
                  name={subField.name}
                  label={subField.label}
                  value={item[subField.name]} // Current value for this specific row
                  required={subField.required}
                  error={fieldError}
                  theme={theme}
                  disableMinDate={true}
                  // Map your date component's onChange to the Group's handleChange
                  onChange={(returnedName, formattedApiDate) => {
                    handleChange(idx, subField.name, formattedApiDate);
                  }}
                />
              );
            }
            // 🔥 NEW: Check if the field is a select dropdown, and render Autocomplete
            if (subField.type === "select") {
              const currentValue = item[subField.name];

              // MUI Autocomplete expects the exact option object.
              // This safely maps the current value (even if it's just an ID from initValueResolver) to the full option.
              let autocompleteValue = null;
              if (
                currentValue !== null &&
                currentValue !== undefined &&
                currentValue !== ""
              ) {
                if (
                  typeof currentValue === "object" &&
                  currentValue?.value?.id !== undefined
                ) {
                  autocompleteValue = currentValue; // Already the full object
                } else {
                  // Fallback: If it's a primitive ID, find the full option from the options list
                  autocompleteValue =
                    (subField.options || []).find(
                      (opt) =>
                        opt.value?.id === currentValue ||
                        opt.value === currentValue,
                    ) || null;
                }
              }

              return (
                <Autocomplete
                  key={`${name}-${idx}-${subField.name}`}
                  options={subField.options || []}
                  disabled={disabled}
                  value={autocompleteValue}
                  isOptionEqualToValue={(o, v) => o?.value?.id === v?.value?.id}
                  getOptionLabel={(option) => option?.label || ""}
                  onChange={(_, selected) => {
                    // Pass the full `{ label, value }` object (or null) back to state
                    handleChange(idx, subField.name, selected || null);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={subField.label}
                      error={!!fieldError}
                      variant="outlined"
                      size="small"
                      className={theme.input || "wg-mui-input col-3"}
                      helperText={fieldError || ""}
                      required={subField.required}
                    />
                  )}
                />
              );
            }

            // DEFAULT: Render standard TextField
            return (
              <TextField
                key={`${name}-${idx}-${subField.name}`}
                label={subField.label}
                value={item[subField.name] || ""}
                variant="outlined"
                required={subField.required}
                className={theme.input || "wg-mui-input col-3"}
                onChange={(e) =>
                  handleChange(idx, subField.name, e.target.value)
                }
                disabled={disabled}
                size="small"
                error={!!fieldError}
                helperText={fieldError || ""}
              />
            );
          })}

          {!disabled && idx > 0 && isMulti && (
            <Button color="error" onClick={() => handleRemove(idx)}>
              Remove
            </Button>
          )}
        </div>
      ))}

      {!disabled && isMulti && (
        <Button onClick={handleAdd}>+ Add {label}</Button>
      )}
    </div>
  );
};

export default MuiGroupInput;

// import { Button, TextField } from "@mui/material";

// const createEmptyGroup = (fields) => {
//   return fields.reduce((acc, field) => {
//     acc[field.key] = "";
//     return acc;
//   }, {});
// };

// const MuiGroupInput = ({
//   name,
//   label,
//   value = [],
//   onChange,
//   fields = [],
//   disabled = false,
//   theme = {},
//   error = {},
//   isMulti=true,
// }) => {
//   const values =
//     Array.isArray(value) && value.length > 0
//       ? value
//       : [createEmptyGroup(fields)];

//       console.log("value :", value, values);

//   const handleChange = (index, key, val) => {
//     const updated = [...values];
//     updated[index] = {
//       ...updated[index],
//       [key]: val,
//     };
//     onChange(name, updated, updated);
//   };

//   const handleAdd = () => {
//     onChange(name, [...values, createEmptyGroup(fields)]);
//   };

//   const handleRemove = (index) => {
//     const updated = [...values];
//     updated.splice(index, 1);
//     onChange(name, updated);
//   };

//   const getFieldError = (rowIndex, fieldName) =>
//     Array.isArray(error) ? error[rowIndex]?.[fieldName] : null;
//   return (
//     <div>
//       <h4>{isMulti && label}</h4>

//       {values.map((item, idx) => (
//         <div
//           key={`${name}-${idx}`} // 🔥 FIXED KEY
//           className={theme.MultiInput ? theme.MultiInput : (isMulti ? "flex gap-3 mb-3" : "flex flex-col gap-3 col-12") }
//           // style={{
//           //   display: "flex",
//           //   gap: "8px",
//           //   marginBottom: "10px",
//           // }}
//         >
//           {fields.map((subField) => {
//             const fieldError = getFieldError(idx, subField.name);
//             return (
//               <TextField
//                 key={`${name}-${idx}-${subField.name}`} // 🔥 UNIQUE KEY
//                 label={subField.label}
//                 value={item[subField.name] || ""}
//                 variant="outlined"
//                 required={subField.required}
//                 className={theme.input || "wg-mui-input col-3"}
//                 onChange={(e) =>
//                   handleChange(idx, subField.name, e.target.value)
//                 }
//                 disabled={disabled}
//                 size="small"
//                 error={!!fieldError}
//                 helperText={fieldError || ""}
//               />
//             );
//           })}

//           {!disabled && idx > 0 && isMulti && (
//             <Button color="error" onClick={() => handleRemove(idx)}>
//               Remove
//             </Button>
//           )}
//         </div>
//       ))}

//       {!disabled && isMulti &&<Button onClick={handleAdd}>+ Add {label}</Button>}
//     </div>
//   );
// };

// export default MuiGroupInput;

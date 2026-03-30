import { Button, TextField } from "@mui/material";

const createEmptyGroup = (fields) => {
  return fields.reduce((acc, field) => {
    acc[field.key] = "";
    return acc;
  }, {});
};

const MuiGroupInput = ({
  name,
  label,
  value = [],
  onChange,
  fields = [],
  disabled = false,
  theme = {},
  error = {},
  isMulti=true,
}) => {
  console.log("ismulti :", isMulti);
  
  const values =
    Array.isArray(value) && value.length > 0
      ? value
      : [createEmptyGroup(fields)];

  const handleChange = (index, key, val) => {
    const updated = [...values];
    updated[index] = {
      ...updated[index],
      [key]: val,
    };
    onChange(name, updated, updated);
  };

  const handleAdd = () => {
    onChange(name, [...values, createEmptyGroup(fields)]);
  };

  const handleRemove = (index) => {
    const updated = [...values];
    updated.splice(index, 1);
    onChange(name, updated);
  };

  const getFieldError = (rowIndex, fieldName) =>
    Array.isArray(error) ? error[rowIndex]?.[fieldName] : null;
  return (
    <div>
      <h4>{isMulti && label}</h4>

      {values.map((item, idx) => (
        <div
          key={`${name}-${idx}`} // 🔥 FIXED KEY
          className={theme.MultiInput ? theme.MultiInput : (isMulti ? "flex gap-3 mb-3" : "flex flex-col gap-3 col-12") }
          // style={{
          //   display: "flex",
          //   gap: "8px",
          //   marginBottom: "10px",
          // }}
        >
          {fields.map((subField) => {
            const fieldError = getFieldError(idx, subField.name);
            return (
              <TextField
                key={`${name}-${idx}-${subField.name}`} // 🔥 UNIQUE KEY
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

      {!disabled && isMulti &&<Button onClick={handleAdd}>+ Add {label}</Button>}
    </div>
  );
};

export default MuiGroupInput;

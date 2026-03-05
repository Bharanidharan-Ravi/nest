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
}) => {
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
      <h4>{label}</h4>

      {values.map((item, idx) => (
        <div
          key={`${name}-${idx}`} // 🔥 FIXED KEY
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "10px",
          }}
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
                className={theme.input || "wg-mui-input"}
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

          {!disabled && idx > 0 && (
            <Button color="error" onClick={() => handleRemove(idx)}>
              Remove
            </Button>
          )}
        </div>
      ))}

      {!disabled && <Button onClick={handleAdd}>+ Add {label}</Button>}
    </div>
  );
};

export default MuiGroupInput;

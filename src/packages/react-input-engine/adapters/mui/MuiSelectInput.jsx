import { Autocomplete, TextField } from "@mui/material";

const MuiSelectInput = ({
  name,
  label,
  value,
  error,
  options = [],
  onChange,
  clearable = true,
  disabled = false,
  required,
  theme = {},
  multiple = false,
}) => {
  // const selected = options.find((o) => o.value === value?.value) ?? null;
  // const selected = options.find((o) => o.value?.id === value?.value?.id) ?? null;
  const handleChange = (_, selected, reason) => {
    if (multiple) {
      // MULTI SELECT
      const values =
        selected?.map((o) => ({
          value: o.value,
          label: o.label,
        })) || [];

      onChange(name, values);
      return;
    }

    // SINGLE SELECT
    if (!selected) {
      onChange(name, null, { cleared: true });
      return;
    }

    onChange(name, {
      value: selected.value,
      label: selected.label,
    });
  };
  return (
    <Autocomplete
      multiple={multiple}
      options={options}
      disabled={disabled}
      disableClearable={!clearable && !multiple}
      value={value || (multiple ? [] : null)}
      isOptionEqualToValue={(o, v) => o.value === v.value}
      getOptionLabel={(option) => option?.label || ""}
      onChange={handleChange}
      clearOnEscape
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={!!error}
          variant="outlined"
          size="small"
          className={theme.input || "wg-mui-input"}
          helperText={error}
          required={required}
        />
      )}
    />
  );
};

export default MuiSelectInput;

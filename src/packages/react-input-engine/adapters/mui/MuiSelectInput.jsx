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
  theme={}
}) => {
  // const selected = options.find((o) => o.value === value?.value) ?? null;
  const selected = options.find((o) => o.value?.id === value?.value.id) ?? null;

  return (
    <Autocomplete
      options={options}
      value={selected}
      // isOptionEqualToValue={(o, v) => o.value === v.value}
      isOptionEqualToValue={(o, v) => o.value?.id === (v?.value?.id ?? v?.id)}
      disableClearable={!clearable}
      disabled={disabled}
      onChange={(_, option, reason) => {
        // ✅ CLEAR CASE
        if (option === null) {
          onChange(name, "", {
            cleared: true,
          });
          return;
        }

        // ✅ SELECT CASE
        onChange(name, option.value, {
          label: option.label,
          raw: option,
        });
      }}
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

import React from "react";
import { FormControl, FormControlLabel, FormHelperText, FormLabel, Radio, RadioGroup } from "@mui/material";

// Standard MUI radio buttons, one row, for a single choice from `options`.
// Stores the whole option ({ label, value: { id } }) like the select input,
// so mapFormToDto / visibleWhen read it the same way. An option's
// `description` becomes its tooltip.

const optionId = (option) => option?.value?.id ?? option?.value;
const valueId = (value) => (value && typeof value === "object" ? optionId(value) : value);

const MuiRadioGroup = ({
  name,
  label,
  value,
  error,
  onChange,
  options = [],
  required,
  disabled,
  theme = {},
}) => {
  const selected = valueId(value);

  const handleChange = (e) => {
    const picked = options.find((opt) => String(optionId(opt)) === e.target.value);
    if (picked) onChange?.(name, picked);
  };

  return (
    <FormControl
      error={!!error}
      disabled={disabled}
      component="fieldset"
      className={theme.radioContainer || "w-full"}
    >
      {label && (
        <FormLabel
          component="legend"
          required={required}
          sx={{
            fontSize: 13,
            fontWeight: 500,
            lineHeight: "16px",
            color: "rgb(71 85 105)",
            "& .MuiFormLabel-asterisk": { color: "rgb(239 68 68)" },
          }}
        >
          {label}
        </FormLabel>
      )}

      {/* mt keeps the radios level with 40px controls under a same-size label */}
      <RadioGroup row name={name} value={selected != null ? String(selected) : ""} onChange={handleChange} sx={{ mt: 0.5 }}>
        {options.map((opt) => (
          <FormControlLabel
            key={String(optionId(opt))}
            value={String(optionId(opt))}
            title={opt.description}
            control={
              <Radio
                size="small"
                sx={theme.radioAccent ? { "&.Mui-checked": { color: theme.radioAccent } } : undefined}
              />
            }
            label={<span className="text-sm text-gray-700">{opt.label}</span>}
          />
        ))}
      </RadioGroup>

      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
};

export default MuiRadioGroup;

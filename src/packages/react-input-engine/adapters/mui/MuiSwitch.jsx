import React from "react";
import { Switch, FormControlLabel, FormControl, FormHelperText } from "@mui/material";

const MuiSwitch = ({ 
  name, 
  label, 
  value, 
  error, 
  onChange, 
  disabled,
  theme = {} 
}) => {
  // Ensure the value is strictly evaluated as a boolean
  const isChecked = Boolean(value);

  const handleChange = (e) => {
    // Pass the boolean state back to FormEngine (true/false)
    onChange(name, e.target.checked);
  };

  return (
    <FormControl 
      error={!!error} 
      component="fieldset" 
      className={theme.switchContainer || "w-full pt-2"}
    >
      <FormControlLabel
        control={
          <Switch
            checked={isChecked}
            onChange={handleChange}
            name={name}
            color="warning" 
            disabled={disabled}
            size="small" // 🔥 Scales down the toggle itself to match the text
          />
        }
        // 🔥 Wrap the label in a span to force Tailwind's smaller font size
        label={<span className="text-sm text-gray-700">{label}</span>}
        className={theme.switchLabel || ""} 
      />
      
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
};

export default MuiSwitch;
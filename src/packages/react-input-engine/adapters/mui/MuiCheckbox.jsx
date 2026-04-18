import React from "react";
import { Checkbox, FormControlLabel, FormControl, FormHelperText } from "@mui/material";

const MuiCheckbox = ({ 
  name, 
  label, 
  value, 
  error, 
  onChange, 
  required, 
  disabled,
  theme = {} 
}) => {
  // Ensure the value is strictly evaluated as a boolean
  const isChecked = Boolean(value);

  const handleChange = (e) => {
    // Pass the boolean state back to FormEngine and useEntityForm
    onChange(name, e.target.checked);
  };

  return (
    <FormControl 
      error={!!error} 
      component="fieldset" 
      className={theme.checkboxContainer || "w-full flex items-center h-full pt-2"}
    >
      <FormControlLabel
        control={
          <Checkbox
            checked={isChecked}
            onChange={handleChange}
            name={name}
            color="primary"
            disabled={disabled}
            required={required}
            className={theme.checkbox || ""}
          />
        }
        label={label}
        // Optional: you can apply typography classes here if needed
        className={theme.checkboxLabel || "text-gray-700"} 
      />
      
      {/* Renders validation error text underneath if any exist */}
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
};

export default MuiCheckbox;
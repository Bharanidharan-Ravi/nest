// MuiTimeInput.jsx
import { TextField } from "@mui/material";

// const MuiTimeInput = ({ name, label, value, error, onChange, theme={} }) => (
//   <TextField
//     type="time"
//     label={label}
//     className={theme.input || "wg-mui-input"} // 🔥 3-Tier Theme Applied!
//     variant="outlined"
//     size="small"
//     InputLabelProps={{ shrink: true }}
//     value={value || ""}
//     error={!!error}
//     helperText={error}
//     onChange={(e) => onChange(name, e.target.value, e.target.value)}
//   />
// );

// export default MuiTimeInput;
const MuiTimeInput = ({ name, label, value, error, onChange, theme = {} }) => {
  const handleFocus = (e) => {
    e.target.select();
  };
  const handleMouseUp = (e) => {
    // Prevent cursor reposition after focus
    e.preventDefault();
  };
  const handleChange = (e) => {
    let val = e.target.value.replace(/[^\d:.]/g, "");
    // Directly call onChange with the formatted value
    if (onChange) {
      onChange(name, val); // Send the unformatted value to parent (for real-time update)
    }
  };

  const handleBlur = () => {
    if (!value) return;
    let hours = "0";
    let minutes = "00";  
    if (value.includes(":") || value.includes(".")) {
      const parts = value.split(/[:.]/);
      hours = parts[0] || "0"; // Get hours (default to "0" if empty)
      minutes = parts[1] || "00"; // Get minutes (default to "00" if empty)
    } else {
      if (value.length <= 2) {
        hours = value; // Use value as hours (e.g., "10")
        minutes = "00"; // Default minutes to "00"
      } else if (value.length > 2) {
        hours = value.slice(0, 2); // First two digits as hours
        minutes = value.slice(2); // Remaining as minutes
      }
    }
    // Convert hours and minutes to integers
    let hh = parseInt(hours, 10);
    let mm = parseInt(minutes, 10);
    // Validation/clamping to ensure valid range
    if (mm > 59) mm = 59;
    if (hh > 23) hh = 23; // Limit hours to 23 (24-hour format)

    // Format to HH:mm (ensuring two digits)
    const formatted = `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}`;

    // Only update if the value has actually changed
    if (formatted !== value && onChange) {
      onChange(name, formatted); // Send the updated time in HH:mm format
    }
  };

  return (
    <TextField
      type="text"
      label={label}
      className={theme.input || "wg-mui-input"} // Apply theme if available
      variant="outlined"
      size="small"
      InputLabelProps={{ shrink: true }}
      value={value || ""} // Directly use the value prop
      error={!!error}
      helperText={error}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onMouseUp={handleMouseUp}
    />
  );
};

export default MuiTimeInput;
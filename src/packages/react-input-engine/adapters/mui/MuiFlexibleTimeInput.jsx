import { TextField } from "@mui/material";



const MuiFlexibleHoursInput = ({ name, label, value, error, onChange, theme = {} }) => {

  const handleFocus = (e) => e.target.select();
  const handleMouseUp = (e) => e.preventDefault();

  // Allow digits and colon/period while typing
  const handleChange = (e) => {
    const val = e.target.value.replace(/[^\d:.]/g, "");
    onChange?.(name, val);
  };

  // Format value on blur/tab
  const handleBlur = () => {
    if (!value) return;

    // Remove non-digits
    const digits = value.replace(/\D/g, "");
    if (!digits) {
      onChange?.(name, "");
      return;
    }

    let hours = "0";
    let minutes = "00";

    if (digits.length >= 3) {
      // Last 2 digits = minutes
      hours = digits.slice(0, -2);
      minutes = digits.slice(-2);
    } else {
      // Less than 3 digits = all hours
      hours = digits;
      minutes = "00";
    }

    // Clamp minutes to 59
    let mm = parseInt(minutes, 10);
    if (mm > 59) mm = 59;

    const formatted = `${parseInt(hours, 10)}:${mm.toString().padStart(2, "0")}`;

    onChange?.(name, formatted);
  };

  return (
    <TextField
      type="text"
      label={label}
      // placeholder="HH:MM"
      className={theme.input || "wg-mui-input"}
      variant="outlined"
      size="small"
      InputLabelProps={{ shrink: true }}
      value={value || ""}
      error={!!error}
      helperText={error}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onMouseUp={handleMouseUp}
    />
  );
};

export default MuiFlexibleHoursInput;

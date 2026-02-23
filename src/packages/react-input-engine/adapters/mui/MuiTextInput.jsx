// MuiTextInput.jsx
import { TextField } from "@mui/material";

const MuiTextInput = ({ name, label, value, error, onChange, required, theme={} }) => (
  <TextField
    fullWidth
    variant="outlined"
    size="small"
    className={theme.input || "wg-mui-input"}
    label={label}
    value={value || ""}
    error={!!error}
    required={required}
    helperText={error}
    onChange={(e) => onChange(name, e.target.value, e.target.value)}
 
  />
);

export default MuiTextInput;

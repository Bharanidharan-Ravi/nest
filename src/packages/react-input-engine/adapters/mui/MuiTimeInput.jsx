// MuiTimeInput.jsx
import { TextField } from "@mui/material";

const MuiTimeInput = ({ name, label, value, error, onChange, theme={} }) => (
  <TextField
    type="time"
    label={label}
    className={theme.input || "wg-mui-input"} // 🔥 3-Tier Theme Applied!
    variant="outlined"
    size="small"
    InputLabelProps={{ shrink: true }}
    value={value || ""}
    error={!!error}
    helperText={error}
    onChange={(e) => onChange(name, e.target.value, e.target.value)}
  />
);

export default MuiTimeInput;

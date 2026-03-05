import { useMemo, useState } from "react";
import { TextField, Popover, IconButton, InputAdornment } from "@mui/material";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import dayjs from "dayjs";

const MuiDateInput = ({
  name,
  label,
  value,
  error,
  onChange,
  required,
  theme = {},
}) => {
  const formattedValue = useMemo(() => {
    if (value && dayjs(value).isValid()) {
      return dayjs(value).format("DD/MM/YYYY");
    }

    return "";
  }, [value]);

  const [inputText, setInputText] = useState(formattedValue);
  const [isEditing, setIsEditing] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const isOpen = Boolean(anchorEl);

  const handleSmartInput = (text) => {
    if (!text) {
      setInputText("");
      setIsEditing(false);
      onChange(name, "", "");
      return;
    }

    const str = text.trim().toLowerCase();
    let newDate = null;

    if (/^[a-z]+$/.test(str) || str === "0") {
      newDate = dayjs();
    } else if (/^([+-]?)(\d+)([dmyw]?)$/.test(str)) {
      const match = str.match(/^([+-]?)(\d+)([dmyw]?)$/);
      const sign = match[1] || "+";
      const amount = parseInt(match[2], 10);
      const unitChar = match[3] || "d";
      const unitMap = { d: "day", m: "month", y: "year", w: "week" };

      newDate =
        sign === "+"
          ? dayjs().add(amount, unitMap[unitChar])
          : dayjs().subtract(amount, unitMap[unitChar]);
    } else if (/^[\d/.-]+$/.test(str)) {
      const parsed = dayjs(str);
      if (parsed.isValid() && parsed.year() > 1000) {
        newDate = parsed;
      }
    }

    if (newDate && newDate.isValid()) {
      const formattedDisplay = newDate.format("DD/MM/YYYY");
      const formattedApi = newDate.format("YYYY-MM-DD");
      setInputText(formattedDisplay);
      setIsEditing(false);
      onChange(name, formattedApi, formattedApi);
      return;
    }

    if (formattedValue) {
      setInputText(formattedValue);
    } else {
      setInputText("");
      onChange(name, "", "");
    }
    setIsEditing(false);
  };

  const handleCalendarSelect = (newValue) => {
    if (newValue && newValue.isValid()) {
      const formattedDisplay = newValue.format("DD/MM/YYYY");
      const formattedApi = newValue.format("YYYY-MM-DD");
      setInputText(formattedDisplay);
      setIsEditing(false);
      onChange(name, formattedApi, formattedApi);
      setAnchorEl(null);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <TextField
        label={label}
        size="small"
        variant="outlined"
        required={required}
        error={!!error}
        helperText={error}
        className={`${theme.input || "wg-mui-input"}`}
        InputLabelProps={{ shrink: true }}
        placeholder="DD/MM/YYYY"
        value={isEditing ? inputText : formattedValue}
        onChange={(e) => {
          setInputText(e.target.value);
          setIsEditing(true);
        }}
        onBlur={(e) => handleSmartInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSmartInput(e.target.value);
            setAnchorEl(null);
          }
        }}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        onFocus={(e) => {
          setIsEditing(true);
          e.target.select();
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={(e) =>
                  setAnchorEl(e.currentTarget.closest(".MuiFormControl-root"))
                }
                edge="end"
              >
                <CalendarMonthIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Popover
        open={isOpen}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <DateCalendar
          value={value ? dayjs(value) : null}
          onChange={handleCalendarSelect}
          minDate={dayjs()}
        />
      </Popover>
    </LocalizationProvider>
  );
};

export default MuiDateInput;

import { useState, useEffect } from "react";
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
  const [inputText, setInputText] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const isOpen = Boolean(anchorEl);

  useEffect(() => {
    if (value && dayjs(value).isValid()) {
      setInputText(dayjs(value).format("MM/DD/YYYY"));
    } else if (!value) {
      setInputText("");
    }
  }, [value]);

  // THE SMART PARSER
  const handleSmartInput = (text) => {
    if (!text) {
      onChange(name, "", "");
      return;
    }

    const str = text.trim().toLowerCase();
    let newDate = null;

    // RULE 1: Letters only (t, today, now) or exactly "0" -> Today
    if (/^[a-z]+$/.test(str) || str === "0") {
      newDate = dayjs();
    }
    // RULE 2: Math Shortcuts (Sign is now OPTIONAL!)
    // Matches: +10, -5, 10, 2m, -1y, etc.
    else if (/^([+-]?)(\d+)([dmyw]?)$/.test(str)) {
      const match = str.match(/^([+-]?)(\d+)([dmyw]?)$/);
      const sign = match[1] || "+"; // 🔥 Default to + if they just typed "10"
      const amount = parseInt(match[2], 10);
      const unitChar = match[3] || "d";
      const unitMap = { d: "day", m: "month", y: "year", w: "week" };

      newDate =
        sign === "+"
          ? dayjs().add(amount, unitMap[unitChar])
          : dayjs().subtract(amount, unitMap[unitChar]);
    }
    // RULE 3: Strict Date Parsing
    else {
      // 🔥 Only allow numbers, slashes, dashes, and dots. Blocks "sfd"!
      if (/^[\d\/\-\.]+$/.test(str)) {
        const parsed = dayjs(str);
        // Ensure it's a valid date and the year makes sense (e.g., > 1000)
        if (parsed.isValid() && parsed.year() > 1000) {
          newDate = parsed;
        }
      }
    }

    // RULE 4: Apply the valid date, OR revert if they typed garbage
    if (newDate && newDate.isValid()) {
      setInputText(newDate.format("MM/DD/YYYY"));
      const formattedApi = newDate.format("YYYY-MM-DD");
      onChange(name, formattedApi, formattedApi);
    } else {
      // 🔥 INVALID INPUT FALLBACK:
      // If they type "10/10/2026sfd", we revert the text box back to the last known valid date.
      if (value && dayjs(value).isValid()) {
        setInputText(dayjs(value).format("MM/DD/YYYY"));
      } else {
        setInputText("");
        onChange(name, "", "");
      }
    }
  };

  const handleCalendarSelect = (newValue) => {
    if (newValue && newValue.isValid()) {
      setInputText(newValue.format("MM/DD/YYYY"));
      const formattedApi = newValue.format("YYYY-MM-DD");
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
        // 🔥 Added Placeholder
        placeholder="MM/DD/YYYY"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onBlur={(e) => handleSmartInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSmartInput(e.target.value);
            setAnchorEl(null);
          }
        }}
        // 🔥 Opens calendar when clicking the text field
        onClick={(e) => setAnchorEl(e.currentTarget)}
        // 🔥 Auto-selects all text when the field gains focus
        onFocus={(e) => e.target.select()}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                // We can keep this for the icon click as well, or rely entirely on the text field click
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
        />
      </Popover>
    </LocalizationProvider>
  );
};

export default MuiDateInput;

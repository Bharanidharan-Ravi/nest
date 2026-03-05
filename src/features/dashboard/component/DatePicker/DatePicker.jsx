import React, { useState, forwardRef } from "react";
import { Paper, Typography, TextField, Box } from "@mui/material";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const CustomInput = forwardRef(({ value, onClick, label }, ref) => (
  <TextField
    label={label}
    value={value}
    onClick={onClick}
    inputRef={ref}
    fullWidth
    variant="outlined"
    sx={{
      cursor: 'pointer',
      '& .MuiInputBase-root': {
        height: '30px', // Adjust height of the input field
        padding: '0 12px', // Adjust padding inside the input field if needed
      },
      '& .MuiInputLabel-root': {
        fontSize: '0.875rem', // Optional: Adjust label font size
      }
    }}
    readOnly
  />
));

const DateRangePickerComponent = ({ value, onChange }) => {
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = value || dateRange;

  const handleChange = (dates) => {
    const [start, end] = dates;

    if (!value) {
      setDateRange(dates);
    }

    if (onChange) {
      onChange({ startDate: start, endDate: end });
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 0, m: 0, borderRadius: 3, backgroundColor: 'transparent' }}>
      <Box  >
        <DatePicker 
          selected={startDate}
          onChange={handleChange}
          startDate={startDate}
          endDate={endDate}
          selectsRange
          customInput={<CustomInput label="Date Range" />}
          dateFormat="dd/MM/yyyy"
        />
      </Box>
    </Paper>
  );
};

export default DateRangePickerComponent;
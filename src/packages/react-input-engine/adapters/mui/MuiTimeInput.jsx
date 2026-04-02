// MuiTimeInput.jsx
import { TextField } from "@mui/material";

// 🔥 1. Added disabled and readOnly to the props!
const MuiTimeInput = ({ name, label, value, error, onChange, theme = {}, disabled, readOnly }) => {
  const handleFocus = (e) => {
    e.target.select();
  };

  const handleMouseUp = (e) => {
    e.preventDefault();
  };

  const handleChange = (e) => {
    let val = e.target.value.replace(/[^\d:.]/g, "");
    if (onChange) {
      onChange(name, val); 
    }
  };

  const handleBlur = () => {
    if (!value) return;
    
    let val = value.replace(/[^\d:.]/g, "");
    let hours = "0";
    let minutes = "00";  
    
    if (val.includes(":") || val.includes(".")) {
      const parts = val.split(/[:.]/);
      hours = parts[0] || "0"; 
      minutes = parts[1] || "00"; 
    } else {
      // 🔥 2. PERFECTED NUMBER PARSING LOGIC
      if (val.length <= 2) {
        hours = val; // "10" -> H: 10, M: 00
        minutes = "00"; 
      } else if (val.length === 3) {
        hours = val.slice(0, 1); // "945" -> H: 9
        minutes = val.slice(1, 3); // "945" -> M: 45
      } else if (val.length >= 4) {
        hours = val.slice(0, 2); // "1020" -> H: 10
        minutes = val.slice(2, 4); // "1020" -> M: 20
      }
    }

    let hh = parseInt(hours, 10);
    let mm = parseInt(minutes, 10);

    // 🔥 3. BLOCK INVALID TIMES (like "90" hours)
    // Instead of forcing it to 23:00, we clear the field so they must fix it!
    if (isNaN(hh) || isNaN(mm) || hh > 23 || mm > 59) {
      onChange(name, ""); 
      return;
    }

    const formatted = `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}`;

    if (formatted !== value && onChange) {
      onChange(name, formatted); 
    }
  };

  return (
    <TextField
      type="text"
      label={label}
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
      // 🔥 4. PASS THE PROPS TO MATERIAL UI
      disabled={disabled}
      InputProps={{
        readOnly: readOnly,
      }}
    />
  );
};

export default MuiTimeInput;


// export default MuiTimeInput;
// const MuiTimeInput = ({ name, label, value, error, onChange, theme = {} }) => {
//   const handleFocus = (e) => {
//     e.target.select();
//   };
//   const handleMouseUp = (e) => {
//     // Prevent cursor reposition after focus
//     e.preventDefault();
//   };
//   const handleChange = (e) => {
//     let val = e.target.value.replace(/[^\d:.]/g, "");
//     // Directly call onChange with the formatted value
//     if (onChange) {
//       onChange(name, val); // Send the unformatted value to parent (for real-time update)
//     }
//   };

//   const handleBlur = () => {
//     if (!value) return;
//     let hours = "0";
//     let minutes = "00";  
//     if (value.includes(":") || value.includes(".")) {
//       const parts = value.split(/[:.]/);
//       hours = parts[0] || "0"; // Get hours (default to "0" if empty)
//       minutes = parts[1] || "00"; // Get minutes (default to "00" if empty)
//     } else {
//       if (value.length <= 2) {
//         hours = value; // Use value as hours (e.g., "10")
//         minutes = "00"; // Default minutes to "00"
//       } else if (value.length > 2) {
//         hours = value.slice(0, 2); // First two digits as hours
//         minutes = value.slice(2); // Remaining as minutes
//       }
//     }
//     // Convert hours and minutes to integers
//     let hh = parseInt(hours, 10);
//     let mm = parseInt(minutes, 10);
//     // Validation/clamping to ensure valid range
//     if (mm > 59) mm = 59;
//     if (hh > 23) hh = 23; // Limit hours to 23 (24-hour format)

//     // Format to HH:mm (ensuring two digits)
//     const formatted = `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}`;

//     // Only update if the value has actually changed
//     if (formatted !== value && onChange) {
//       onChange(name, formatted); // Send the updated time in HH:mm format
//     }
//   };

//   return (
//     <TextField
//       type="text"
//       label={label}
//       className={theme.input || "wg-mui-input"} // Apply theme if available
//       variant="outlined"
//       size="small"
//       InputLabelProps={{ shrink: true }}
//       value={value || ""} // Directly use the value prop
//       error={!!error}
//       helperText={error}
//       onChange={handleChange}
//       onBlur={handleBlur}
//       onFocus={handleFocus}
//       onMouseUp={handleMouseUp}
//     />
//   );
// };

// export default MuiTimeInput;
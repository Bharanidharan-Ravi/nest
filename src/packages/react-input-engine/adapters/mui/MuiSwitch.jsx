// import React from "react";
// import { Switch, FormControlLabel, FormControl, FormHelperText } from "@mui/material";

// const MuiSwitch = ({ 
//   name, 
//   label, 
//   value, 
//   error, 
//   onChange, 
//   disabled,
//   theme = {} 
// }) => {
//   // Ensure the value is strictly evaluated as a boolean
//   const isChecked = Boolean(value);

//   const handleChange = (e) => {
//     // Pass the boolean state back to FormEngine (true/false)
//     onChange(name, e.target.checked);
//   };

//   return (
//     <FormControl 
//       error={!!error} 
//       component="fieldset" 
//       className={theme.switchContainer || "w-full pt-2"}
//     >
//       <FormControlLabel
//         control={
//           <Switch
//             checked={isChecked}
//             onChange={handleChange}
//             name={name}
//             color="warning" 
//             disabled={disabled}
//             size="small" // 🔥 Scales down the toggle itself to match the text
//           />
//         }
//         // 🔥 Wrap the label in a span to force Tailwind's smaller font size
//         label={<span className="text-sm text-gray-700">{label}</span>}
//         className={theme.switchLabel || ""} 
//       />

//       {error && <FormHelperText>{error}</FormHelperText>}
//     </FormControl>
//   );
// };

// export default MuiSwitch;



// import React from "react";
// import { FormHelperText } from "@mui/material";



// const MuiSwitch = ({
//   name,
//   label,
//   value,
//   error,
//   onChange,
//   switchColor,
//   disabled,
// }) => {
//   const isChecked = Boolean(value);

//   const handleToggle = () => {
//     if (!disabled) {
//       onChange(name, !isChecked);
//     }
//   };

//   return (
//     <>
//       <div
//         role="switch"
//         aria-checked={isChecked}
//         aria-label={label}
//         tabIndex={disabled ? -1 : 0}
//         onClick={handleToggle}
//         onKeyDown={(e) => {
//           if (e.key === " " || e.key === "Enter") {
//             e.preventDefault();
//             handleToggle();
//           }
//         }}
//         //   className={`
//         //     inline-flex items-center gap-2 px-3 py-1 rounded-full
//         //     border ${isChecked ? "border-[#1D9E75]" : "border-gray-300"}
//         //     ${isChecked ? "bg-[#E1F5EE]" : "bg-white"}
//         //     cursor-${disabled ? "not-allowed" : "pointer"}
//         //     ${disabled ? "opacity-50" : "opacity-100"}
//         //     select-none transition-all duration-200
//         //   `}
//         // >
//         className={`
//         w-[150px]        
//         flex items-center justify-center  
//         gap-2 px-3 py-1 
//         rounded-full
//         border ${isChecked ? "border-[#1D9E75]" : "border-gray-300"}
//         ${isChecked ? "bg-[#E1F5EE]" : "bg-white"}
//         cursor-${disabled ? "not-allowed" : "pointer"}
//         ${disabled ? "opacity-50" : "opacity-100"}
//         select-none transition-all duration-200
//       `}
//       >
//         <div
//           className={`
//             relative w-[26px] h-[15px] rounded-full
//             ${isChecked ? "bg-[#1D9E75]" : "bg-gray-300"}
//             flex-shrink-0 transition-colors duration-200
//           `}
//         >
//           <div
//             className={`
//               absolute w-[11px] h-[11px] rounded-full bg-white
//               top-[2px] ${isChecked ? "left-[13px]" : "left-[2px]"}
//               transition-left duration-200 shadow-sm
//             `}
//           />
//         </div>
//         <span
//           className={`
//             text-[13px] font-normal
//             ${isChecked ? "text-[#085041]" : "text-gray-700"}
//             whitespace-nowrap transition-colors duration-200
//           `}
//         >
//           {label}
//         </span>
//       </div>
//       {error && (
//         <FormHelperText error className="mt-1 ml-0.5">
//           {error}
//         </FormHelperText>
//       )}
//     </>
//   );
// };

// export default MuiSwitch;

const MuiSwitch = ({
  name,
  label,
  value,
  error,
  onChange,
  switchColor = "", // e.g., "bg-yellow-100 text-yellow-800 toggle-yellow-500"
  disabled,
}) => {
  const isChecked = Boolean(value);

  // Split string into classes
  const classes = switchColor.split(" ");

  // Extract each type
  const bgClass = classes.find((cls) => cls.startsWith("bg-")) || "bg-[#E1F5EE]";
  const textClass = classes.find((cls) => cls.startsWith("text-")) || "text-[#085041]";
  const toggleClass =
    classes.find((cls) => cls.startsWith("toggle-"))?.replace("toggle-", "bg-") || "bg-[#1D9E75]";

  const handleToggle = () => {
    if (!disabled) onChange(name, !isChecked);
  };

  return (
    <>
      <div
        role="switch"
        aria-checked={isChecked}
        aria-label={label}
        tabIndex={disabled ? -1 : 0}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            handleToggle();
          }
        }}
        className={`
          w-[150px]
          flex items-center justify-center
          gap-2 px-3 py-1
          rounded-full
          border ${isChecked ? bgClass.replace("bg-", "border-") : "border-gray-300"}
          ${isChecked ? bgClass : "bg-white"}
          ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
          select-none transition-all duration-200
        `}
      >
        <div
          className={`
            relative w-[26px] h-[15px] rounded-full
            ${isChecked ? toggleClass : "bg-gray-300"}
            flex-shrink-0 transition-colors duration-200
          `}
        >
          <div
            className={`
              absolute w-[11px] h-[11px] rounded-full bg-white
              top-[2px]
              ${isChecked ? "left-[13px]" : "left-[2px]"}
              shadow-sm transition-all duration-200
            `}
          />
        </div>

        <span
          className={`
            text-[13px] font-normal
            ${isChecked ? textClass : "text-gray-700"}
            whitespace-nowrap transition-colors duration-200
          `}
        >
          {label}
        </span>
      </div>

      {error && (
        <FormHelperText error className="mt-1 ml-0.5">
          {error}
        </FormHelperText>
      )}
    </>
  );
};

export default MuiSwitch;
import React from "react";

export default function ToggleSwitchField({
  name,
  label,
  value = false, // Defaults to false (off)
  onChange,
  error,
  disabled = false,
}) {
  // Ensure the value is treated strictly as a boolean
  const isChecked = Boolean(value);

  const handleToggle = (e) => {
    if (disabled || !onChange) return;
    
    // Pass the exact opposite of the current state back to the form engine
    onChange(name, !isChecked);
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <label 
        className={`flex items-center gap-3 ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        {/* Hidden Native Checkbox for accessibility/forms */}
        <input
          type="checkbox"
          name={name}
          className="sr-only peer"
          checked={isChecked}
          onChange={handleToggle}
          disabled={disabled}
        />
        
        {/* Custom Tailwind Switch Track */}
        <div 
          className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${
            isChecked ? "bg-blue-600" : "bg-gray-300"
          }`}
        >
          {/* Custom Tailwind Switch Thumb */}
          <div 
            className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-200 ease-in-out ${
              isChecked ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </div>

        {/* Text Label */}
        {label && (
          <span className="text-sm font-medium text-gray-700 select-none">
            {label}
          </span>
        )}
      </label>

      {/* Validation Error Display */}
      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
    </div>
  );
}
import { Autocomplete, TextField } from "@mui/material";
import { useState } from "react";

const MuiSelectInput = ({
  name,
  label,
  value,
  error,
  options = [],
  onChange,
  clearable = true,
  disabled = false,
  required,
  theme = {},
  multiple = false,
}) => {
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleChange = (_, selected) => {
    if (multiple) {
      const values =
        selected?.map((o) => ({
          value: o.value,
          label: o.label,
        })) || [];

      onChange(name, values);
      return;
    }

    if (!selected) {
      onChange(name, null, { cleared: true });
      return;
    }

    onChange(name, {
      value: selected.value,
      label: selected.label,
    });
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      setHasInteracted(true);
    }

    if (event.key === "Tab") {
      const listbox = document.querySelector('[role="listbox"]');

      if (!listbox) return;
      if (!hasInteracted) return;

      const activeOption =
        document.querySelector('[role="option"][aria-selected="true"]') ||
        document.querySelector('[role="option"].Mui-focused') ||
        document.querySelector('[role="option"][data-focus="true"]');

      // fallback to first option IF user typed
      const fallbackOption = listbox.querySelector('[role="option"]');

      const optionToSelect = activeOption || fallbackOption;

      if (!optionToSelect) return;

      event.preventDefault();

      const activeOptionLabel = optionToSelect.textContent;

      const matchedOption = options.find(
        (o) => o.label === activeOptionLabel
      );

      if (!matchedOption) return;

      if (multiple) {
        const currentValues = Array.isArray(value) ? value : [];

        const alreadySelected = currentValues.some(
          (v) => v.value === matchedOption.value
        );

        if (!alreadySelected) {
          onChange(name, [
            ...currentValues,
            {
              value: matchedOption.value,
              label: matchedOption.label,
            },
          ]);
        }
      } else {
        onChange(name, {
          value: matchedOption.value,
          label: matchedOption.label,
        });
      }

      setHasInteracted(false);

      const input = event.target;
      input.blur();

      setTimeout(() => {
        const focusableElements = Array.from(
          document.querySelectorAll(
            'input,select,textarea,button,[tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => !el.disabled);

        const currentIndex = focusableElements.indexOf(input);

        if (
          currentIndex !== -1 &&
          focusableElements[currentIndex + 1]
        ) {
          focusableElements[currentIndex + 1].focus();
        }
      }, 50);
    }
  };

  const handleInputChange = (_, inputValue) => {
    if (inputValue) {
      setHasInteracted(true); 
    } else {
      setHasInteracted(false);
    }
  };

  return (
    <Autocomplete
      multiple={multiple}
      options={options}
      disabled={disabled}
      disableClearable={!clearable && !multiple}
      value={value || (multiple ? [] : null)}
      isOptionEqualToValue={(o, v) => o.value.id === v.value.id}
      getOptionLabel={(option) => option?.label || ""}
      onChange={handleChange}
      onInputChange={handleInputChange}
      filterSelectedOptions={multiple}
      clearOnEscape
      openOnFocus
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={!!error}
          variant="outlined"
          size="small"
          className={theme.input || "wg-mui-input w-full"}
          helperText={error}
          required={required}
          onKeyDown={handleKeyDown}
        />
      )}
    />
  );
};

export default MuiSelectInput;

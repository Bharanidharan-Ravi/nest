// validationEngine.js

export const validateForm = (formData, fields, context = {}) => {
  const errors = {};

  const validateField = (field, data, errorTarget) => {
    const fieldKey = field.name || field.key; // Support both 'name' and 'key' as identifiers
    if (!fieldKey) return; // Skip if no identifier
    const value = data[field.name] ?? data[field.key];

    if (field.hidden) return;
    if (field.visibleWhen && typeof field.visibleWhen === "function") {
      // Use the top-level formData and context to evaluate visibility
      const isVisible = field.visibleWhen(formData, context);
      
      // If the field is NOT visible, EXIT EARLY and skip all validation!
      if (!isVisible) return; 
    }
    const isRequired = field.requiredWhen
      ? field.requiredWhen(context, data)
      : field.required;

    if (isRequired && !value) {
      
      errorTarget[field.name] = `${field.label} is required`;
    }
    // if (field.required && !value) {
    //   errorTarget[fieldKey] = `${field.label} is required`;
    // }

    if (field.pattern && value) {
      if (!new RegExp(field.pattern).test(value)) {
        errorTarget[field.name] =
          field.errorMessage || `${field.label} is invalid`;
      }
    }

    if (field.customValidator) {      
      const result = field.customValidator(value, data, context);
      
      if (result !== true) {
        errorTarget[field.name] = result;
      }
    }
    if (field.type === "group") {
      const items = value || (field.isMulti ? [] : {});
      let hasAnyErrors = false;

      if (field.isMulti) {
        // ... (Keep your existing isMulti array logic here) ...
        const groupErrors = [];
        if (items.length === 0) {
          const itemError = {};
          field.fields.forEach((subField) => validateField(subField, {}, itemError));
          if (Object.keys(itemError).length > 0) {
            groupErrors.push(itemError);
            hasAnyErrors = true;
          }
        } else {
          items.forEach((item, index) => {
            const itemError = {};
            field.fields.forEach((subField) => validateField(subField, item, itemError));
            if (Object.keys(itemError).length > 0) {
              groupErrors[index] = itemError;
              hasAnyErrors = true;
            } else {
              groupErrors[index] = null;
            }
          });
        }
        if (hasAnyErrors) errorTarget[fieldKey] = groupErrors;

      } else {
        // 🔥 NEW: Single Group Logic
        const groupError = {};
        field.fields.forEach((subField) => {
          validateField(subField, items, groupError);
        });

        if (Object.keys(groupError).length > 0) {
          errorTarget[fieldKey] = groupError;
        }
      }
    }
    // if (field.type === "group" && field.isMulti) {
    //   const items = value || [];
    //   const groupErrors = [];
    //   let hasAnyErrors = false; // 🔥 Track if we actually found errors

    //   if (items.length === 0) {
    //     const itemError = {};
    //     field.fields.forEach((subField) =>
    //       validateField(subField, {}, itemError),
    //     );

    //     if (Object.keys(itemError).length > 0) {
    //       groupErrors.push(itemError);
    //       hasAnyErrors = true;
    //     }
    //   } else {
    //     items.forEach((item, index) => {
    //       const itemError = {};
    //       field.fields.forEach((subField) =>
    //         validateField(subField, item, itemError),
    //       );

    //       // 🔥 FIX: Always use the exact index to maintain row alignment!
    //       if (Object.keys(itemError).length > 0) {
    //         groupErrors[index] = itemError;
    //         hasAnyErrors = true;
    //       } else {
    //         groupErrors[index] = null; // Keeps the array aligned if valid
    //       }
    //     });
    //   }

    //   // Only set the error target if we actually found something
    //   if (hasAnyErrors) {
    //     errorTarget[fieldKey] = groupErrors;
    //   }
    // }
  };
  fields.forEach((field) => validateField(field, formData, errors));

  return errors;
};

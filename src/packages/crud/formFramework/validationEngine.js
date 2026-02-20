// validationEngine.js

export const validateForm = (formData, fields) => {
  const errors = {};

  const validateField = (field, data) => {
    const value = data[field.name];

    if (field.required && !value) {
      errors[field.name] = `${field.label} is required`;
    }

    if (field.pattern && value) {
      if (!new RegExp(field.pattern).test(value)) {
        errors[field.name] =
          field.errorMessage || `${field.label} is invalid`;
      }
    }

    if (field.customValidator) {
      const result = field.customValidator(value, data);      
      if (result !== true) {
        errors[field.name] = result;
      }
    }

    if (field.type === "group" && field.isMulti) {
      (value || []).forEach(item => {
        field.fields.forEach(subField =>
          validateField(subField, item)
        );
      });
    }
  };

  fields.forEach(field =>
    validateField(field, formData)
  );

  return errors;
};

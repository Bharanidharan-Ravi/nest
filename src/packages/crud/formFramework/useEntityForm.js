// useEntityForm.js

import { useState, useMemo } from "react";
import { mapFormToDto } from "./mapFormToDto";
import { validateForm } from "./validationEngine";
import { applyDependencies } from "./dependencyEngine";
import { applyVisibilityRules } from "./visibilityEngine";

export const useEntityForm = (config) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const processedFields = useMemo(() => {
    let updated = applyDependencies(formData, config.fields);
    updated = applyVisibilityRules(formData, updated);
    return updated;
  }, [formData, config.fields]);

  //   const handleChange = (name, value, metadata = {}) => {
  //     console.log("handleChange called with:", name, value, metadata);

  //     setFormData(prev => ({
  //       ...prev,
  //       [name]: metadata.raw ? metadata.raw : metadata
  //     }));
  //   };

  const handleChange = (name, value, metadata = {}) => {
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: metadata?.raw ?? value,
      };

      const field = config.fields.find((f) => f.name === name);

      if (field?.effects && metadata?.raw) {
        Object.entries(field.effects).forEach(([target, path]) => {
          next[target] = path
            .split(".")
            .reduce((acc, k) => acc?.[k], metadata.raw);
        });
      }

      return next;
    });
  };

  const validate = () => {
    const validationErrors = validateForm(formData, config.fields);
console.log("Validation errors:", validationErrors);

    setErrors(validationErrors);

    return Object.keys(validationErrors).length === 0;
  };

  const buildDto = () => mapFormToDto(formData, config.fields);

  return {
    formData,
    errors,
    fields: processedFields,
    handleChange,
    validate,
    buildDto,
    setFormData,
  };
};

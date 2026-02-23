// useEntityForm.js

import { useState, useMemo } from "react";
import { mapFormToDto } from "./mapFormToDto";
import { validateForm } from "./validationEngine";
import { applyDependencies } from "./dependencyEngine";
import { applyVisibilityRules } from "./visibilityEngine";
import { useMasterData } from "../../../core/master/useMasterData";
import { useEffect } from "react";

export const useEntityForm = (config, context = {}) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const { data: masterData } = useMasterData();

  const processedFields = useMemo(() => {
    const baseFields = config.fields || [];

    // 1️⃣ Apply dependencies first
    let updated = applyDependencies(formData, baseFields);

    // 2️⃣ Apply optionsResolver per field
    updated = updated.map((field) => {
      let newField = { ...field };

      // 🔥 Handle master-based options
      if (field.optionsResolver && masterData) {
        newField.options = field.optionsResolver(masterData);
      }

      // 🔥 Handle disableWhen (if using context)
      if (field.disableWhen) {
        newField.disabled = field.disableWhen(context);
      }

      return newField;
    });

    // 3️⃣ Apply visibility rules (recursive safe)
    updated = applyVisibilityRules(formData, updated);

    return updated;
  }, [formData, config.fields, masterData, context]);

  // 🔥 Handle initial value injection
  useEffect(() => {
    processedFields.forEach((field) => {
      if (field.initValueResolver) {
        const initialValue = field.initValueResolver(context, masterData);
        if (initialValue) {
          setFormData((prev) => ({
            ...prev,
            [field.name]: initialValue,
          }));
        }
      }
    });
  }, [masterData]);

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

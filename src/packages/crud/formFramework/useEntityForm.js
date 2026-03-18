// useEntityForm.js

import { useState, useMemo } from "react";
import { mapFormToDto } from "./mapFormToDto";
import { validateForm } from "./validationEngine";
import { applyDependencies } from "./dependencyEngine";
import { applyVisibilityRules } from "./visibilityEngine";
import { useMasterData } from "../../../core/master/useMasterData";

export const useEntityForm = (config, context = {}) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const { data: masterData } = useMasterData();

  const resolvedInitialData = useMemo(() => {
    const initialValues = {};

    (config.fields || []).forEach((field) => {
      if (!field.initValueResolver) return;

      const initialValue = field.initValueResolver({context, masterData, formData});
      
      if (initialValue !== null && initialValue !== undefined) {
        initialValues[field.name] = initialValue;
      }
    });

    return initialValues;
  }, [config.fields, context, masterData, formData]);

  const mergedFormData = useMemo(
    () => ({ ...resolvedInitialData, ...formData }),
    [resolvedInitialData, formData],
  );

  const processedFields = useMemo(() => {
    const baseFields = config.fields || [];

    let updated = applyDependencies(mergedFormData, baseFields);

    updated = updated.map((field) => {
      let newField = { ...field };

      if (field.optionsResolver && masterData) {
        newField.options = field.optionsResolver({masterData, context, formData});
      }

      if (field.disableWhen) {
        newField.disabled = field.disableWhen(context, mergedFormData);
      }

      return newField;
    });

    updated = applyVisibilityRules(mergedFormData, updated);

    return updated;
  }, [mergedFormData, config.fields, masterData, context]);

  // const handleChange = (name, value, metadata = {}) => {
  //   setFormData((prev) => {
  //     const next = {
  //       ...prev,
  //       [name]: metadata?.raw ?? value,
  //     };

  //     const field = config.fields.find((f) => f.name === name);

  //     if (field?.effects && metadata?.raw) {
  //       Object.entries(field.effects).forEach(([target, path]) => {
  //         next[target] = path
  //           .split(".")
  //           .reduce((acc, k) => acc?.[k], metadata.raw);
  //       });
  //     }

  //     return next;
  //   });
  // };

  // const handleChange = (name, value, metadata = {}) => {
  //   setFormData((prev) => {
  //     const next = {
  //       ...prev,
  //       [name]: metadata?.raw ?? value,
  //     };

  //     (config.fields || []).forEach((field) => {
  //       if (
  //         field.effectResolver &&
  //         (field.effectDependencies || []).includes(name)
  //       ) {
  //         const Hours = field.effectResolver(next);
  //         if (Hours != null) next[field.name] = Hours;
  //       }
  //     });

  //     const field = config.fields.find((f) => f.name === name);
  //     if (field?.effects && metadata?.raw) {
  //       Object.entries(field.effects).forEach(([target, path]) => {
  //         next[target] = path
  //           .split(".")
  //           .reduce((acc, k) => acc?.[k], metadata.raw);
  //       });
  //     }
  //     return next;
  //   });
  // };

const handleChange = (name, value, metadata = {}) => {
  
    setFormData((prev) => {
      // 1. Calculate the new state for this specific field
      const next = {
        ...prev,
        [name]: metadata?.raw ?? value,
      };

      // 2. Handle effectResolvers (Dynamic field updates based on dependencies)
      (config.fields || []).forEach((field) => {
        if (
          field.effectResolver &&
          (field.effectDependencies || []).includes(name)
        ) {
          const resolvedValue = field.effectResolver(next);
          if (resolvedValue != null) next[field.name] = resolvedValue;
        }
      });

      // 3. Handle metadata effects (e.g., auto-filling related fields)
      const fieldConfig = config.fields.find((f) => f.name === name);
      if (fieldConfig?.effects && metadata?.raw) {
        Object.entries(fieldConfig.effects).forEach(([target, path]) => {
          next[target] = path
            .split(".")
            .reduce((acc, k) => acc?.[k], metadata.raw);
        });
      }

      // 4. REAL-TIME VALIDATION ENGINE
      const currentStateToValidate = { ...resolvedInitialData, ...next };
      const latestErrors = validateForm(currentStateToValidate, config.fields);

      setErrors((prevErrors) => {
        const updatedErrors = { ...prevErrors };
        
        // Check if the field being changed is a group/array
        const isArrayChange = Array.isArray(next[name]);

        if (isArrayChange) {
          // --- GROUP / ARRAY FIELD LOGIC ---
          if (!latestErrors[name]) {
            delete updatedErrors[name];
          } else {
            const prevGroupErrors = prevErrors[name] || [];
            const newGroupErrors = latestErrors[name];
            const mergedGroupErrors = [];
            let hasMergedErrors = false;

            newGroupErrors.forEach((rowErrors, rowIndex) => {
              if (!rowErrors) {
                mergedGroupErrors[rowIndex] = null;
                return;
              }

              const prevRowErrors = prevGroupErrors[rowIndex] || {};
              const currentRowValue = next[name][rowIndex] || {};
              const mergedRowErrors = {};

              // Check each sub-field's error
              Object.keys(rowErrors).forEach((subFieldKey) => {
                const val = currentRowValue[subFieldKey];
                // Determine if user has interacted with this specific sub-field
                const hasValue = val !== undefined && val !== "" && val !== null;
                const hadErrorBefore = prevRowErrors[subFieldKey] !== undefined;

                // Only show the error if they typed something invalid or it already had an error
                if (hasValue || hadErrorBefore) {
                  mergedRowErrors[subFieldKey] = rowErrors[subFieldKey];
                }
              });

              if (Object.keys(mergedRowErrors).length > 0) {
                mergedGroupErrors[rowIndex] = mergedRowErrors;
                hasMergedErrors = true;
              } else {
                mergedGroupErrors[rowIndex] = null;
              }
            });

            if (hasMergedErrors) {
              updatedErrors[name] = mergedGroupErrors;
            } else {
              delete updatedErrors[name];
            }
          }
        } else {
          // --- STANDARD FIELD LOGIC ---
          if (latestErrors[name]) {
            updatedErrors[name] = latestErrors[name];
          } else {
            delete updatedErrors[name];
          }
        }

        // Clean up any other fixed errors across the form (e.g., effects fixing a field)
        Object.keys(updatedErrors).forEach((key) => {
           if (key !== name && !latestErrors[key]) {
             delete updatedErrors[key];
           }
        });

        return updatedErrors;
      });

      // 🔥 5. CRITICAL: Return the next state so the UI actually updates! 🔥
      return next;
    });
  };
  const validate = () => {
    const validationErrors = validateForm(mergedFormData, config.fields);
    setErrors(validationErrors);

    return Object.keys(validationErrors).length === 0;
  };

  const buildDto = () => mapFormToDto(mergedFormData, config.fields);
  const reset = () => {
    setFormData({});
    setErrors({});
  };
  
  return {
    formData: mergedFormData,
    errors,
    fields: processedFields,
    handleChange,
    validate,
    buildDto,
    setFormData,
    reset,
  };
};

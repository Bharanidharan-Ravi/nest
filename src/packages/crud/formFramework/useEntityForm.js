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

      const initialValue = field.initValueResolver(context, masterData);
      if (initialValue !== null && initialValue !== undefined) {
        initialValues[field.name] = initialValue;
      }
    });

    return initialValues;
  }, [config.fields, context, masterData]);

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
        newField.options = field.optionsResolver(masterData, context);
      }

      if (field.disableWhen) {
        newField.disabled = field.disableWhen(context);
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

  const handleChange = (name, value, metadata = {}) => {
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: metadata?.raw ?? value,
      };

      (config.fields || []).forEach((field) => {
        if (
          field.effectResolver &&
          (field.effectDependencies || []).includes(name)
        ) {
          const Hours = field.effectResolver(next);
          if (Hours != null) next[field.name] = Hours;
        }
      });

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

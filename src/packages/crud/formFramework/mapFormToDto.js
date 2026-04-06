// ---------------------------------------------------------
// ENTERPRISE DTO MAPPER
// Compatible with:
// - metadata?.raw ?? value storage
// - group fields
// - hidden/default fields
// - multi-map
// - transform
// - datatype conversion
// ---------------------------------------------------------

export const mapFormToDto = (formData = {}, fields = [], context = {}) => {
  const dto = {};
  const processField = (field, sourceData, target) => {

    // ====================================================================
    // 🔥 0️⃣ DISABLED FIELD CHECK (The Gatekeeper)
    // If the field is disabled AND does not have forceSubmit: true, skip it!
    // ====================================================================
    if (field.disableWhen && typeof field.disableWhen === "function") {
      const isDisabled = field.disableWhen(context, sourceData);
      if (isDisabled && !field.forceSubmit) {
        return; // 🛑 EXIT EARLY: Do not map this field to the DTO
      }
    }

    // ----------------------------------------
    // 1️⃣ Hidden field (auto inject)
    // ----------------------------------------
    if (field.hidden) {
      // 🔥 Extract the current value from the form data context first
      const currentValue = sourceData[field.name];

      target[field.apiKey] = convertType(
        // If currentValue exists (even if it's 0 or false), use it.
        // Otherwise, fall back to defaultValue or null.
        currentValue !== undefined && currentValue !== null
          ? currentValue
          : (field.defaultValue ?? null),
        field.dataType,
      );
      return;
    }

    const rawValue = sourceData[field.name];

    // ----------------------------------------
    // 2️⃣ Group Field (Nested Multi)
    // ----------------------------------------
    if (field.type === "group" && field.isMulti) {
      const groupArray = Array.isArray(rawValue) ? rawValue : [];

      target[field.apiKey] = groupArray.map((item) => {
        const groupObject = {};

        field.fields?.forEach((subField) => {
          processField(subField, item, groupObject);
        });

        return groupObject;
      });

      return;
    }

    if (field.type === "group" && field.isMulti) {
      const groupArray = Array.isArray(rawValue) ? rawValue : [];

      target[field.apiKey] = groupArray.map((item) => {
        const groupObject = {};

        field.fields?.forEach((subField) => {
          processField(subField, item, groupObject);
        });

        return groupObject;
      });

      return;
    }

    if (field.type === "select" && field.multiple) {
      const groupArray = Array.isArray(rawValue) ? rawValue : [];

      let finalArray = groupArray
        .map((item) => {
          if (item && item.value && item.value.id !== undefined) {
            return { id: item.value.id };
          }
          return null;
        })
        .filter((item) => item !== null);

      // 🔥 ALLOW TRANSFORM: Reshape the array if a transform function is provided
      if (field.transform) {
        finalArray = field.transform(finalArray, sourceData);
      }

      target[field.apiKey] = finalArray;
      return;
    }
    // ----------------------------------------
    // 3️⃣ Extract Value
    // ----------------------------------------
    let finalValue = extractValue(rawValue);

    // ----------------------------------------
    // 4️⃣ Apply Transform (if exists)
    // ----------------------------------------
    if (field.transform) {
      finalValue = field.transform(finalValue, sourceData);
    }

    // ----------------------------------------
    // 5️⃣ Multi-map (one field → many API keys)
    // ----------------------------------------
    if (Array.isArray(field.mapTo)) {
      field.mapTo.forEach((key) => {
        target[key] = convertType(finalValue, field.dataType);
      });
    } else {
      target[field.apiKey] = convertType(finalValue, field.dataType);
    }
  };

  fields.forEach((field) => processField(field, formData, dto));

  return dto;
};

// ---------------------------------------------------------
// Extract Value From Stored Data
// Supports:
// - Primitive
// - { label, value }
// - Any object with value key
// ---------------------------------------------------------

const extractValue = (value) => {
  if (value == null) return null;

  if (typeof value === "object") {
    if ("value" in value) {
      return value.value.id;
    }
  }

  return value;
};

// ---------------------------------------------------------
// Data Type Conversion
// ---------------------------------------------------------

const convertType = (value, type) => {
  if (value == null || value === "") return null;

  switch (type) {
    case "number":
      return Number(value);

    case "boolean":
      return Boolean(value);

    case "date":
      return new Date(value).toISOString();

    case "dateTime":
      if (typeof value === "string" && value.match(/^\d{2}:\d{2}$/)) {
        const today = new Date().toISOString().split("T")[0];
        const dateTimeString = `${today}T${value}:00`;
        const localDate = new Date(dateTimeString);
        const isoDateString = new Date(
          localDate.getTime() - localDate.getTimezoneOffset() * 60000,
        ).toISOString();
        return isoDateString;
      }
      return new Date(value).toISOString();

    case "string":
    default:
      return value;
  }
};

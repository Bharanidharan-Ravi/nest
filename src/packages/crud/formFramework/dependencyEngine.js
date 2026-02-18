// dependencyEngine.js

export const applyDependencies = (formData, fields) => {
  return fields.map(field => {
    if (!field.dependsOn) return field;

    const dependencyValue =
      formData[field.dependsOn.field];

    const shouldShow =
      field.dependsOn.condition(dependencyValue);

    return {
      ...field,
      hidden: !shouldShow
    };
  });
};

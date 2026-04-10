/**
 * Formats the Employee list for standard UI dropdown filters.
 * @param {Array} employeeList - The raw list from Master data
 * @param {boolean} includeAllOption - Whether to prepend the "All Employees" option
 */

export const getEmployeeFilterOptions = (employeeList, includeAllOption = true) => {
  if (!Array.isArray(employeeList)) {
    return includeAllOption ? [{ label: "All Employees", value: "" }] : [];
  }

  // 1. Filter for active
  // 2. Map to the simple { label, value } format used by standard dropdowns
  const options = employeeList
    .map((user) => ({
      label: user.UserName,
      value: user.UserID, // Simple string value!
    }));

  // 3. Prepend "All Employees" if requested
  return includeAllOption
    ? [{ label: "All Employees", value: "" }, ...options]
    : options;
};
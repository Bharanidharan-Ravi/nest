// hooks/useQueryParser.js

export function parseQuery(query = "", configFilters = [], userRole = null) {
  const regex = /(\w+:"[^"]+"|\w+:\S+|\S+)/g;
  const tokens = query.match(regex) || [];

  const filters = {};
  let text = [];
  let validTokens = []; // Keep track of tokens we are allowed to keep

  tokens.forEach((token) => {
    if (token.includes(":")) {
      const [key, rawValue] = token.split(":");
      const value = rawValue.replace(/^"|"$/g, "");

      // 1. RBAC CHECK: Find the filter config for this key
      const filterConfig = configFilters.find((f) => f.key === key);

      // 2. If it has restricted roles and the user isn't in them, DROP IT.
      // (We skip keys like "is" which handle tabs and usually aren't in configFilters)
      if (
        filterConfig &&
        filterConfig.allowedRoles &&
        !filterConfig.allowedRoles.includes(userRole)
      ) {
        console.warn(`RBAC Blocked unauthorized URL filter injection: ${key}`);
        return; // Skip this token entirely
      }

      // 3. If it passed the RBAC check, process it normally
      validTokens.push(token);

      if (filters[key]) {
        if (Array.isArray(filters[key])) {
          filters[key].push(value);
        } else {
          filters[key] = [filters[key], value];
        }
      } else {
        filters[key] = value.includes(",")
          ? value.split(",").map((val) => val.trim())
          : value;
      }
    } else {
      // Standard text search tokens pass through
      text.push(token);
      validTokens.push(token);
    }
  });

  return {
    filters,
    text: text.join(" "),
    sanitizedQuery: validTokens.join(" "), // We return this to fix the URL!
  };
}



// export function parseQuery(query = "") {
//   const regex = /(\w+:"[^"]+"|\w+:\S+|\S+)/g
//   const tokens = query.match(regex) || []

//   const filters = {}
//   let text = []

//   tokens.forEach(token => {
//     if (token.includes(":")) {
//       const [key, rawValue] = token.split(":")
//       const value = rawValue.replace(/^"|"$/g, "")
//       // filters[key] = value
//       if (filters[key]) {
//         // Check if the existing value is already an array
//         if (Array.isArray(filters[key])) {
//           filters[key].push(value);
//         } else {
//           // If not an array, convert it to an array with the new value
//           filters[key] = [filters[key], value];
//         }
//       } else {
//         // If the key doesn't exist, simply assign the value
//         filters[key] = value.includes(",")
//           ? value.split(",").map((val) => val.trim())
//           : value;
//       }
//     } else {
//       text.push(token)
//     }
//   })

//   return {
//     filters,
//     text: text.join(" ")
//   }
// }

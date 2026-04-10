// hooks/useQueryParser.js

// export function parseQuery(query = "") {
//   console.log("query", query);

//   const regex = /(\w+:"[^"]+"|\w+:\S+|\S+)/g;
//   const tokens = query.match(regex) || [];
//   const filters = {};
//   let text = [];

//   tokens.forEach((token) => {
//     if (token.includes(":")) {
//       const [key, rawValue] = token.split(":");
//       const value = rawValue.replace(/^"|"$/g, "");
//       // If the key already exists in filters, append the value to an array
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
//       text.push(token);
//     }
//   });

//   return {
//     filters,
//     text: text.join(" "),
//   };
// }

export function parseQuery(query = "") {
  const regex = /(\w+:"[^"]+"|\w+:\S+|\S+)/g
  const tokens = query.match(regex) || []

  const filters = {}
  let text = []

  tokens.forEach(token => {
    if (token.includes(":")) {
      const [key, rawValue] = token.split(":")
      const value = rawValue.replace(/^"|"$/g, "")
      // filters[key] = value
      if (filters[key]) {
        // Check if the existing value is already an array
        if (Array.isArray(filters[key])) {
          filters[key].push(value);
        } else {
          // If not an array, convert it to an array with the new value
          filters[key] = [filters[key], value];
        }
      } else {
        // If the key doesn't exist, simply assign the value
        filters[key] = value.includes(",")
          ? value.split(",").map((val) => val.trim())
          : value;
      }
    } else {
      text.push(token)
    }
  })

  return {
    filters,
    text: text.join(" ")
  }
}

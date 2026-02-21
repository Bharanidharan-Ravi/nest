// hooks/useQueryParser.js

export function parseQuery(query = "") {
  const regex = /(\w+:"[^"]+"|\w+:\S+|\S+)/g
  const tokens = query.match(regex) || []

  const filters = {}
  let text = []

  tokens.forEach(token => {
    if (token.includes(":")) {
      const [key, rawValue] = token.split(":")
      const value = rawValue.replace(/^"|"$/g, "")
      filters[key] = value
    } else {
      text.push(token)
    }
  })

  return {
    filters,
    text: text.join(" ")
  }
}
// export function parseQuery(query) {
//   const tokens = query.split(" ")
//   const filters = {}
//   let text = []

//   tokens.forEach(token => {
//     if (token.startsWith("author:"))
//       filters.author = token.replace("author:", "")

//     else if (token.startsWith("is:"))
//       filters.status = token.replace("is:", "")

//     else if (token.startsWith("label:"))
//       filters.label = token.replace("label:", "")

//     else
//       text.push(token)
//   })

//   return { filters, text: text.join(" ") }
// }
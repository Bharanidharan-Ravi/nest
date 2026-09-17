/** Looks backward from the cursor for an unfinished @word or #word to drive the composer's tag picker. */
export function detectTrigger(value, cursor) {
  const upToCursor = value.slice(0, cursor);
  const match = /(?:^|\s)([@#])([^\s@#]{0,40})$/.exec(upToCursor);
  if (!match) return null;
  const [, type, query] = match;
  return { type, query, start: cursor - type.length - query.length };
}

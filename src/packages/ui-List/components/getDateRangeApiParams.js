// utils/getDateRangeApiParams.js
import dayjs from "dayjs";

/**
 * Converts the stored "start~end" query value into API-ready params.
 * Shape is driven entirely by filter config — zero hardcoding in consumer.
 */
export function getDateRangeApiParams(filterConfig, rawValue) {
  if (!rawValue) return {};
  const [startStr, endStr] = String(rawValue).split("~");
  if (!startStr) return {};

  const fmt   = filterConfig.apiDateFormat || "YYYY-MM-DD";
  const start = dayjs(startStr).format(fmt);
  const end   = endStr ? dayjs(endStr).format(fmt) : start;

  // Mode: "split" → two separate named keys
  if (filterConfig.apiMode === "split") {
    return {
      [filterConfig.apiStartKey || "startDate"]: start,
      [filterConfig.apiEndKey   || "endDate"]  : end,
    };
  }

  // Mode: "range" → single combined key (default)
  return { [filterConfig.key]: `${start}~${end}` };
}
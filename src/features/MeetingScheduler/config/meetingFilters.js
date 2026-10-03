// Filters for the meeting scheduler. They apply to every view (List, Day, Week,
// Month). Host loads that employee's meetings from the API and sits in the
// sidebar calendar, next to the dates it loads; the others narrow down the
// loaded meetings in the browser and sit in the filter bar on top.
import { bookingTypeOptions, recurrenceOptions } from "./Meetingcreate.config";
import { isMeetingHost } from "../Helpers/meetingValidation";

/** The API filter: whose meetings are loaded. */
export const HOST_FILTER_KEY = "HostName";

/** The filter bar's filters, which "Clear filters" resets (the dates and Host stay). */
export const MEETING_FILTER_KEYS = ["status", "recurrence_type", "booking_type", "hosting", "project_id"];

/** Fields the search box looks in. */
export const MEETING_SEARCH_FIELDS = ["title", "project_Name", "Ticket_Title", "issue_Code", "HostName"];

/** A filter value ("a", "a,b" or ["a", "b"]) -> lower-case values. */
const selectedValues = (value) =>
  (Array.isArray(value) ? value : String(value ?? "").split(","))
    .map((v) => String(v).trim().toLowerCase())
    .filter(Boolean);

/** Keeps meetings whose `field` is one of the selected values, ignoring case (ids come back in either case). */
const fieldIsOneOf = (field) => (item, value) => {
  const wanted = selectedValues(value);
  return wanted.length === 0 || wanted.includes(String(item?.[field] ?? "").toLowerCase());
};

const toFilterOptions = (allLabel, options) => [
  { label: allLabel, value: "" },
  ...options.map((option) => ({ label: option.label, value: option.value.id })),
];

export function buildMeetingFilters({ employeeFilterOptions, projectFilterOptions, currentUserId }) {
  return [
    {
      key: HOST_FILTER_KEY,
      label: "Host",
      apiKey: "EmployeeID",
      filterType: "api",
      api: "/sync/v2",
      configKey: "MeetingData",
      source: "MeetingData",
      options: employeeFilterOptions,
      defaultValue: currentUserId ? String(currentUserId) : "",
    },
    {
      key: "status",
      view: "Status",
      filterType: "custom",
      customFilter: fieldIsOneOf("status"),
      allowMultiple: true,
      showCounts: true,
      options: [
        { label: "Statuses", value: "" },
        { label: "Scheduled", value: "Scheduled" },
        { label: "Completed", value: "Completed" },
        { label: "Cancelled", value: "Cancelled" },
      ],
    },
    {
      key: "recurrence_type",
      view: "Repeats",
      filterType: "custom",
      customFilter: fieldIsOneOf("recurrence_type"),
      allowMultiple: true,
      showCounts: true,
      options: toFilterOptions("Repeats", recurrenceOptions),
    },
    {
      key: "booking_type",
      view: "Meeting type",
      filterType: "custom",
      customFilter: fieldIsOneOf("booking_type"),
      allowMultiple: true,
      showCounts: true,
      options: toFilterOptions("Meeting types", bookingTypeOptions),
    },
    {
      key: "hosting",
      view: "Hosting",
      filterType: "custom",
      customFilter: (item, value) => {
        const [wanted] = selectedValues(value);
        if (!wanted) return true;
        return isMeetingHost(item, currentUserId) === (wanted === "me");
      },
      showCounts: true,
      options: [
        { label: "Hosted by anyone", value: "" },
        { label: "Hosted by me", value: "me" },
        { label: "Hosted by others", value: "others" },
      ],
    },
    {
      key: "project_id",
      view: "Project",
      filterType: "custom",
      customFilter: fieldIsOneOf("project_id"),
      allowMultiple: true,
      showCounts: true,
      options: projectFilterOptions,
    },
  ];
}

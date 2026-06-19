import { queryKeys } from "../../../core/query/queryKeys"
import { ROUTE_KEYS } from "../../../core/routing/paths"
import { LabelFieldConfig } from "../../label/config/Labelcreate.config"
import { MeetinglFieldConfig } from "./Meetingcreate.config"


export const meetingFormConfig = {
  key: "MeetingData",
  title: "MeetingData",
  api: "/MeetingSchedulerControler/CreateMeeting",                          // POST /api/label
// transformPayload:(fields)=>({dto:{...fields}}),
  // Invalidate full label list after create or update
  invalidateKeys: [queryKeys.MeetingData.list()],

  // redirectTo:ROUTE_KEYS.MEETING_LIST,

  fields: MeetinglFieldConfig(),
}
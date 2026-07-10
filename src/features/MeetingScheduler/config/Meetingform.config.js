import { toast } from "react-toastify";
import { queryKeys } from "../../../core/query/queryKeys";
import { ROUTE_KEYS } from "../../../core/routing/paths";
import { LabelFieldConfig } from "../../label/config/Labelcreate.config";
import { MeetinglFieldConfig } from "./Meetingcreate.config";

export const meetingFormConfig = {
  key: "MeetingData",
  title: "MeetingData",
  api: "/MeetingSchedulerControler/CreateMeeting",

  fields: MeetinglFieldConfig(),

  actions: ({ formData, context }) => [
    {
      label: "Create Meeting",
      onClick: ({ submitForm, setErrors }) => {
        const meetingDate = formData.meeting_Date;
        const startTime = formData.start_time;
        const endTime = formData.end_time;
        const hostId = formData.host_Name?.value?.id;
        const hasConflict = context?.upcomingMeetings?.some((meeting) => {
          if (meeting.Date !== meetingDate) return false;
          const overlap =
            startTime < meeting.end_time &&
            endTime > meeting.start_time;
  
          if (!overlap) return false;
  
          const sameHost = meeting.Organizer_Id === hostId;
          return sameHost 
        });
  
        if (hasConflict) {
          alert(
            "Host or one of the participants already has another meeting during this time."
          );
  
          // setErrors({
          //   meeting_Date:
          //     "Choose another Date.",
          // });
  
          return;
        }
  
        submitForm();
      },
    },
  ]
};
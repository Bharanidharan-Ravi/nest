// import { toast } from "react-toastify";
// import { queryKeys } from "../../../core/query/queryKeys";
// import { ROUTE_KEYS } from "../../../core/routing/paths";
// import { LabelFieldConfig } from "../../label/config/Labelcreate.config";
// import { MeetinglFieldConfig } from "./Meetingcreate.config";

// export const meetingFormConfig = {
//   key: "MeetingData",
//   title: "MeetingData",
//   api: "/MeetingSchedulerControler/CreateMeeting",

//   fields: MeetinglFieldConfig(),

//   actions: ({ formData, context }) => [
//     {
//       label: "Create Meeting",
//       onClick: ({ submitForm, setErrors }) => {
//         const meetingDate = formData.meeting_Date;
//         const startTime = formData.start_time;
//         const endTime = formData.end_time;
//         const hostId = formData.host_Name?.value?.id;
//         const hasConflict = context?.upcomingMeetings?.some((meeting) => {
//           if (meeting.Date !== meetingDate) return false;
//           const overlap =
//             startTime < meeting.end_time &&
//             endTime > meeting.start_time;

//           if (!overlap) return false;

//           const sameHost = meeting.Organizer_Id === hostId;
//           return sameHost 
//         });

//         if (hasConflict) {
//           alert(
//             "Host or one of the participants already has another meeting during this time."
//           );

//           // setErrors({
//           //   meeting_Date:
//           //     "Choose another Date.",
//           // });

//           return;
//         }

//         submitForm();
//       },
//     },
//   ]
// };
// import { toast } from "react-toastify";
// import { queryKeys } from "../../../core/query/queryKeys";
// import { ROUTE_KEYS } from "../../../core/routing/paths";
// import { LabelFieldConfig } from "../../label/config/Labelcreate.config";
// import { MeetinglFieldConfig } from "./Meetingcreate.config";
// import { safeParseList } from "../hooks/participants";

// export const meetingFormConfig = {
//   key: "MeetingData",
//   title: "MeetingData",
//   api: "/MeetingSchedulerControler/CreateMeeting",

//   fields: MeetinglFieldConfig(),

//   actions: ({ formData, context }) => [
//     {
//       label: "Create Meeting",
//       onClick: ({ submitForm, setErrors }) => {
//         const meetingDate = formData.meeting_Date;
//         const startTime = formData.start_time;
//         const endTime = formData.end_time;
//         const hostId = formData.host_Name?.value?.id;
//         const hostName = formData.host_Name?.label || "Host";
// console.log("context",context,formData);

//         const conflictingMeeting = context?.upcomingMeetings
//           ?.filter((meeting) => meeting.meeting_id !== context.meetingId)
//           ?.find((meeting) => {
//             let rangeStart = meeting.Date;
//             let rangeEnd = meeting.Date;

//             // Handle date ranges safely
//             if (meeting.Date.includes("~")) {
//               [rangeStart, rangeEnd] = meeting.Date.split("~");
//             } else if (meeting.Date.includes(" - ")) {
//               [rangeStart, rangeEnd] = meeting.Date.split(" - ");
//             }

//             const sameDate =
//               meetingDate >= rangeStart && meetingDate <= rangeEnd;

//             if (!sameDate) return false;

//             const overlappingTime =
//               startTime < meeting.end_time &&
//               endTime > meeting.start_time;

//             if (!overlappingTime) return false;

//             const participantIds = safeParseList(meeting.Participants).map(
//               (p) => p.participant_id
//             );

//             const hostConflict = meeting.Organizer_Id === hostId;
//             const participantConflict = participantIds.includes(hostId);

//             return hostConflict || participantConflict;
//           });

//         if (conflictingMeeting) {
//           toast.error(
//             `${hostName} is already booked on ${meetingDate} between ${conflictingMeeting.start_time} and ${conflictingMeeting.end_time}`
//           );
//           return;
//         }

//         submitForm();
//       },
//     },
//   ],
// };

import { toast } from "react-toastify";
import { queryKeys } from "../../../core/query/queryKeys";
import { ROUTE_KEYS } from "../../../core/routing/paths";
import { LabelFieldConfig } from "../../label/config/Labelcreate.config";
import { MeetinglFieldConfig } from "./Meetingcreate.config";
import { safeParseList } from "../hooks/participants";
import { useUIStore } from "../../../core/state/useUIStore";
import { formatDate } from "../Helpers/dateTime";

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

        // New meeting participants (Host + Internal + Client)
        const newMeetingUsers = [
          hostId,

          ...(formData.internalParticipants || []).map(
            (participant) => participant.value?.id
          ),

          ...(formData.clientParticipants || []).map(
            (participant) => participant.value?.id
          ),
        ]
          .filter(Boolean)
          .map((id) => id.toLowerCase());


        const conflictingMeeting = context?.upcomingMeetings
          ?.filter(
            (meeting) =>
              meeting.meeting_id !== context.meetingId
          )
          ?.find((meeting) => {

            let rangeStart = meeting.Date;
            let rangeEnd = meeting.Date;


            // Handle date formats:
            // 2026-07-15
            // 2026-07-15 - 2026-07-16
            // 2026-07-15~2026-07-16
            if (meeting.Date.includes("~")) {
              [rangeStart, rangeEnd] = meeting.Date.split("~");
            }
            else if (meeting.Date.includes(" - ")) {
              [rangeStart, rangeEnd] = meeting.Date.split(" - ");
            }


            // Check date
            const sameDate =
              meetingDate >= rangeStart &&
              meetingDate <= rangeEnd;


            if (!sameDate) {
              return false;
            }


            // Check time overlap
            const overlappingTime =
              startTime < meeting.end_time &&
              endTime > meeting.start_time;


            if (!overlappingTime) {
              return false;
            }


            // Existing meeting users
            const existingMeetingUsers = [
              meeting.Organizer_Id,

              ...safeParseList(meeting.Participants).map(
                (participant) =>
                  participant.participant_id
              ),
            ]
              .filter(Boolean)
              .map((id) => id.toLowerCase());


            // Host OR participant conflict
            const userConflict = newMeetingUsers.some(
              (id) => existingMeetingUsers.includes(id)
            );


            return userConflict;
          });


        if (conflictingMeeting) {
          useUIStore.getState().setError(
            `Host or participant is already booked on ${formatDate(meetingDate)} between ${conflictingMeeting.start_time} and ${conflictingMeeting.end_time}`
          );

          return;
        }


        submitForm();
      },
    },
  ],
};
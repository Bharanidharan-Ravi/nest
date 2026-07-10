// src/features/meeting-scheduler/lib/normalizeMeeting.js
// Extracted from MeetingDashboard so the mapping from API/PascalCase fields
// to the view model can be unit-tested on its own and reused wherever a raw
// meeting row needs normalizing (dashboard, exports, notifications, etc.)

export function normalizeMeeting(meet) {
    return {
      meeting_id: meet?.Meeting_Id,
      meeting_date: meet?.Meeting_Date,
      title: meet?.Title,
      Ticket_Title: meet?.Ticket_Title,
      meeting_summary: meet?.Meeting_Summary,
      ticket_id: meet?.Ticket_Id,
      project_id: meet?.Project_Id,
      project_Name: meet?.Project_Name,
      recurrence_type: meet?.Recurrence_Type,
      slot_duration: meet?.Slot_Duration,
      booking_type: meet?.Booking_Type,
      created_at: meet?.Created_At,
      HostName: meet?.Host_Name,
      days_of_week: meet?.Days_Of_Week,
      start_time: meet?.Start_Time,
      status: meet?.Status ?? "Active",
      end_time: meet?.End_Time,
      host_id: meet?.Host_Id,
      host_type: meet?.Host_Type,
      issue_Code: meet?.Issue_Code,
      project_Code: meet?.ProjectKey,
      valid_from_date: meet?.Valid_From_Date,
      valid_to_date: meet?.Valid_To_Date,
      InternalParticipants: meet?.InternalParticipants,
      ClientParticipants: meet?.ClientParticipants,
    };
  }
  
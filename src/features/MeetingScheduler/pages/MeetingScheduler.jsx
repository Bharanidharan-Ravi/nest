import React, { useCallback, useEffect, useMemo, useState } from "react";
import { format, startOfDay } from "date-fns";
import { useParams } from "react-router-dom";
import { useList } from "../../../packages/ui-List/context/ListContext";
import { parseQuery } from "../../../packages/ui-List/hooks/useQueryParser";
import { readUserFromSession } from "../../../core/auth/useCurrentUser";
import { useTicketMaster } from "../../tickets/hooks/useTicketMaster";
import SchedulerSidebar from "../components/SchedulerSidebar";
import ListView from "../components/ListView";
import WeekView from "../components/WeeklyView";
import { MeetingFormModal } from "../components/MeetingFormModal";
import MonthView from "../components/MonthView";
import SchedulerHeader from "../components/SchedulerHeader";
import MeetingCompleteModal from "../components/MeetingCompletionModel/MeetingCompletionModel";
import MeetingPopover from "../components/MeetingPopover";
import { CalendarLegend } from "../components/Common";
import MeetingFilterBar, { useMeetingFilters } from "../components/MeetingFilterBar";
import { DATE_RANGE_KEY, useDateRange, useMediaQuery, useUpcomingMeeting } from "../hooks";
import {
  clearQueryFilters,
  sameId,
  setQueryFilter,
  upcomingMeetingInvolves,
  VIEW_MODES,
} from "../Helpers/common";
import { formatDateRange, minutesToTime, parseDay, todayKey, toMinutes } from "../Helpers/dateTime";
import {
  anchorFromRange,
  daysInRange,
  isCalendarView,
  rangeContains,
  rangeForView,
  rangeLabel,
  sameRange,
  toRangeValue,
} from "../Helpers/calendarRange";
import { nextUpcomingDay } from "../Helpers/recurrence";
import { canManageMeeting, OFFICE_START_MINUTES } from "../Helpers/meetingValidation";
import { HOST_FILTER_KEY, MEETING_FILTER_KEYS } from "../config/meetingFilters";

const NEW_MEETING_MINUTES = 30;

/** "10:30" -> "11:00" (never past 23:59) */
const addMinutes = (time, minutes) => minutesToTime(Math.min(toMinutes(time) + minutes, 23 * 60 + 59));

export default function MeetingScheduler() {
  const { data = [], setQuery } = useList();
  const params = useParams();
  const user = readUserFromSession();
  const currentUserId = user?.userId;
  const isPhone = useMediaQuery("(max-width: 639px)");

  const { data: upcomingMeetings = [] } = useUpcomingMeeting();
  const { data: ticketMaster = [] } = useTicketMaster();
  const { value: rangeValue, range, setRange } = useDateRange();
  const { activeCount: activeFilterCount, clearFilters } = useMeetingFilters();
  const [viewMode, setViewMode] = useState("List");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  // Day / time slot clicked on the calendar, filled into a new meeting.
  const [prefill, setPrefill] = useState(null);
  // Meeting clicked on the calendar: { meeting, rect }.
  const [popover, setPopover] = useState(null);
  // Meeting picked in the sidebar's "Upcoming Meetings", shown in the List: { id }.
  const [listFocus, setListFocus] = useState(null);

  // A phone is too narrow for seven columns, so Week shows one day at a time.
  const view = isPhone && viewMode === "Week" ? "Day" : viewMode;
  const isCalendar = isCalendarView(view);
  const anchor = useMemo(() => anchorFromRange(view, range), [view, range]);
  const visibleDays = useMemo(() => daysInRange(rangeForView(view, anchor)), [view, anchor]);

  // A calendar view loads exactly the days it shows, including when a date is
  // picked in the sidebar calendar.
  useEffect(() => {
    if (!isCalendar) return;
    const wanted = rangeForView(view, anchor);
    if (!sameRange(wanted, range)) setRange(wanted);
  }, [isCalendar, view, anchor, range, setRange]);

  const meetingContext = useMemo(
    () => ({
      ticketMaster,
      currentUserId,
      upcomingMeetings,
      entityData: selectedMeeting,
      isEditMode,
      meetingId: selectedMeeting?.meeting_id,
      fromTicketId: params.ticketId,
      fromProjectId: params.projectId,
      fromTicketTitle: params.ticketTitle,
      prefill,
    }),
    [ticketMaster, currentUserId, params, selectedMeeting, isEditMode, upcomingMeetings, prefill]
  );

  const closePopover = useCallback(() => setPopover(null), []);
  const openMeeting = useCallback((meeting, rect) => setPopover({ meeting, rect }), []);

  const changeView = useCallback(
    (next) => {
      setPopover(null);
      const nextView = isPhone && next === "Week" ? "Day" : next;
      if (isCalendarView(nextView)) {
        // Stay on today when it is in what was showing; otherwise keep the place.
        const today = startOfDay(new Date());
        setRange(rangeForView(nextView, rangeContains(range, today) ? today : anchorFromRange(view, range)));
      }
      setViewMode(next);
    },
    [isPhone, range, view, setRange]
  );

  const openDay = useCallback(
    (dateKey) => {
      setPopover(null);
      setRange(rangeForView("Day", parseDay(dateKey)));
      setViewMode("Day");
    },
    [setRange]
  );

  // Shows an upcoming meeting in the List. When it isn't listed yet, this loads
  // its next day (and its host, when the Host filter is someone it doesn't
  // include) and clears the filter bar, whose filters could hide it.
  const showInList = useCallback(
    (meeting) => {
      setPopover(null);
      setViewMode("List");
      setListFocus({ id: meeting.meeting_id });
      if (data.some((row) => sameId(row.meeting_id, meeting.meeting_id))) return;

      const day = parseDay(nextUpcomingDay(meeting));
      setQuery((current) => {
        let next = clearQueryFilters(current, MEETING_FILTER_KEYS);
        if (day) next = setQueryFilter(next, DATE_RANGE_KEY, toRangeValue({ start: day, end: day }));
        const host = parseQuery(next).filters?.[HOST_FILTER_KEY];
        if (host && meeting.Organizer_Id && !upcomingMeetingInvolves(meeting, host)) {
          next = setQueryFilter(next, HOST_FILTER_KEY, meeting.Organizer_Id);
        }
        return next;
      });
    },
    [data, setQuery]
  );

  const onNewMeeting = useCallback((slot = null) => {
    setPopover(null);
    setPrefill(slot);
    setIsEditMode(false);
    setSelectedMeeting(null);
    setModalOpen(true);
  }, []);

  // A time slot books NEW_MEETING_MINUTES from its start. A whole day starts at
  // office opening, except today, which keeps the form's "now".
  const createAt = useCallback(
    (date, startTime) => {
      const start = startTime ?? (date === todayKey() ? null : minutesToTime(OFFICE_START_MINUTES));
      onNewMeeting(
        start
          ? { date, start_time: start, end_time: addMinutes(start, NEW_MEETING_MINUTES) }
          : { date }
      );
    },
    [onNewMeeting]
  );

  const handleFormSuccess = useCallback(() => setModalOpen(false), []);
  // Only the host can edit (and, from the edit form, cancel) a meeting.
  const canEditMeeting = useCallback(
    (meeting) => canManageMeeting(meeting, currentUserId),
    [currentUserId]
  );
  const onEdit = useCallback((item) => {
    if (!canEditMeeting(item)) return;
    setPopover(null);
    setPrefill(null);
    setIsEditMode(true);
    setModalOpen(true);
    setSelectedMeeting(item);
  }, [canEditMeeting]);

  const onComplete = useCallback((meeting) => {
    setPopover(null);
    setSelectedMeeting(meeting);
    setCompleteModalOpen(true);
  }, []);
  const closeCompleteModal = useCallback(() => {
    setCompleteModalOpen(false);
    setSelectedMeeting(null);
  }, []);
  const handleCompleteSubmit = useCallback(() => {
    closeCompleteModal();
  }, [closeCompleteModal]);
  const closeModal = useCallback(() => {
    setModalOpen(false);
    setIsEditMode(false);
    setSelectedMeeting(null);
    setPrefill(null);
  }, []);
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  // The month the sidebar calendar shows: today's while today is on screen
  // (except in Month, whose grid spills into the next month), else the middle.
  const focusDate =
    view === "Month" || !rangeContains(range, new Date()) ? anchorFromRange("Month", range) : new Date();

  return (
    <div className="flex-1 min-h-0 flex flex-col lg:flex-row bg-white rounded-lg border border-gray-100">
      {sidebarOpen && (
        <SchedulerSidebar
          className="w-full lg:w-80 xl:w-80"
          upcomingMeetings={upcomingMeetings}
          currentUserId={currentUserId}
          currentValue={rangeValue}
          focusMonth={isCalendar ? format(focusDate, "yyyy-MM") : undefined}
          selectedMeetingId={view === "List" ? listFocus?.id : undefined}
          onOpenMeeting={showInList}
        />
      )}

      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        <SchedulerHeader
          subtitle={isCalendar ? rangeLabel(view, anchor) : formatDateRange(rangeValue)}
          viewMode={view}
          // On a phone, Week is the same as Day, so only Day is offered.
          viewModes={isPhone ? VIEW_MODES.filter((mode) => mode !== "Week") : VIEW_MODES}
          onViewModeChange={changeView}
          onNewMeeting={onNewMeeting}
          onMenuClick={toggleSidebar}
        />

        <MeetingFilterBar resultLabel={`${data.length} ${data.length === 1 ? "meeting" : "meetings"}`} />

        {isCalendar && <CalendarLegend />}

        <div className="flex-1 min-h-0 relative overflow-auto">
          {view === "Month" && (
            <MonthView
              anchor={anchor}
              data={data}
              currentUserId={currentUserId}
              compact={isPhone}
              onOpenMeeting={openMeeting}
              onOpenDay={openDay}
              onCreateAt={createAt}
            />
          )}
          {(view === "Week" || view === "Day") && (
            <WeekView
              days={visibleDays}
              data={data}
              currentUserId={currentUserId}
              onOpenMeeting={openMeeting}
              onCreateAt={createAt}
            />
          )}
          {view === "List" && <ListView data={data} focus={listFocus}
            onEdit={onEdit} onComplete={onComplete} currentUserId={currentUserId}
            onClearFilters={activeFilterCount > 0 ? clearFilters : undefined} />}
        </div>

        {popover && (
          <MeetingPopover
            meeting={popover.meeting}
            anchorRect={popover.rect}
            currentUserId={currentUserId}
            asSheet={isPhone}
            onClose={closePopover}
            onEdit={onEdit}
            onComplete={onComplete}
          />
        )}

        <MeetingFormModal
          isOpen={modalOpen}
          onClose={closeModal}
          onSuccess={handleFormSuccess}
          context={meetingContext}
        />

        {completeModalOpen &&
          <MeetingCompleteModal
            meeting={selectedMeeting}
            onClose={closeCompleteModal}
            handleSuccess={handleCompleteSubmit}
          />
        }
      </div>
    </div>
  );
}

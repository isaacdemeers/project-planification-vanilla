/* eslint-disable quotes */
/* eslint-disable jsx-quotes */
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { AvailabilityPeriod, Availability, convertAvailabilitiesToEvents } from '@/lib/calendar-utils';
import { DateSelectArg, DatesSetArg, EventClickArg } from '@fullcalendar/core';

interface CalendarEvent {
    title: string;
    start: string;
    end: string;
    backgroundColor?: string;
    borderColor?: string;
}

interface FormattedAvailability {
    weekKey: string;
    availability: Availability;
}

interface WorkWeekItem {
    week: number;
    hours: number;
}

interface WeekData {
    week: number;
    count: number;
}

interface CalendarProps {
    intervenantId: string;
}

interface DeleteModalState {
    isOpen: boolean;
    event: CalendarEvent | null;
    calendar: FullCalendar | null;
}

interface DeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

interface HeaderSectionProps {
    isRecurrent: boolean;
    onRecurrentChange: (value: boolean) => void;
    hasSpecificAvailabilities: boolean;
    currentWeek: number;
    workweek: WorkWeekItem[];
}

interface WeekIndicatorProps {
    availabilities: AvailabilityPeriod;
    onWeekClick: (date: Date) => void;
    onModeChange: (isRecurrent: boolean) => void;
}

function getAcademicYearDates() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    let startYear = currentYear;

    if (currentDate.getMonth() < 7) {
        startYear = currentYear - 1;
    }

    return {
        start: new Date(startYear, 7, 1),
        end: new Date(startYear + 1, 6, 31)
    };
}

function formatEventToAvailability(event: CalendarEvent, view: { currentStart: Date }): FormattedAvailability {
    const start = new Date(event.start);
    const end = new Date(event.end);

    const weekStart = new Date(view.currentStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);

    const weekNumber = getWeekNumber(weekStart);

    return {
        weekKey: `S${weekNumber}`,
        availability: {
            days: getDayName(start.getDay()),
            from: start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            to: end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        }
    };
}

function getWeekNumber(date: Date): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getDayName(dayIndex: number): string {
    const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    return days[dayIndex];
}

function doEventsOverlap(event1: CalendarEvent, event2: CalendarEvent): boolean {
    const start1 = new Date(event1.start).getTime();
    const end1 = new Date(event1.end).getTime();
    const start2 = new Date(event2.start).getTime();
    const end2 = new Date(event2.end).getTime();

    return start1 < end2 && start2 < end1;
}

function DeleteModal({ isOpen, onClose, onConfirm }: DeleteModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
                <h3 className="text-lg font-semibold mb-4">Supprimer la disponibilité</h3>
                <p className="text-gray-600 mb-6">
                    Êtes-vous sûr de vouloir supprimer cette disponibilité ?
                </p>
                <div className="flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                        Supprimer
                    </button>
                </div>
            </div>
        </div>
    );
}

function HeaderSection({
    isRecurrent,
    onRecurrentChange,
    hasSpecificAvailabilities,
    currentWeek,
    workweek
}: HeaderSectionProps) {
    return (
        <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex bg-white rounded-lg p-1 shadow-sm">
                        <button
                            onClick={() => onRecurrentChange(false)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!isRecurrent
                                ? 'bg-blue-100 text-blue-800'
                                : 'text-gray-600 hover:text-gray-800'
                                }`}
                        >
                            Mode spécifique
                        </button>
                        <button
                            onClick={() => onRecurrentChange(true)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isRecurrent
                                ? 'bg-blue-100 text-blue-800'
                                : 'text-gray-600 hover:text-gray-800'
                                }`}
                        >
                            Mode récurrent
                        </button>
                    </div>
                    <div className="text-xs text-gray-500">
                        {isRecurrent ? (
                            "Les disponibilités seront appliquées à toutes les semaines"
                        ) : (
                            "Les disponibilités seront spécifiques à la semaine sélectionnée"
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between border-t pt-4">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-blue-700 font-medium">Semaine {currentWeek}</span>
                        </div>
                        {hasSpecificAvailabilities && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Disponibilités spécifiques existantes
                            </span>
                        )}
                    </div>
                    {workweek.find(w => w.week === currentWeek) && (
                        <div className="text-sm text-blue-600">
                            {workweek.find(w => w.week === currentWeek)?.hours}h prévues cette semaine
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function getDateOfISOWeek(week: number) {
    const date = new Date();
    const currentYear = date.getFullYear();

    const targetYear = week < 31 ? currentYear + 1 : currentYear;

    const adjustedWeek = week > 52 ? week - 1 : week;

    const firstDayOfYear = new Date(targetYear, 0, 1);

    const firstMonday = new Date(firstDayOfYear);
    firstMonday.setDate(firstDayOfYear.getDate() + (8 - firstDayOfYear.getDay()) % 7);

    const targetDate = new Date(firstMonday);
    targetDate.setDate(firstMonday.getDate() + (adjustedWeek - 1) * 7);

    return targetDate;
}

function WeekIndicator({ availabilities, onWeekClick, onModeChange }: WeekIndicatorProps) {
    const weeks = useMemo(() => {
        const currentYearWeeks: WeekData[] = [];
        const nextYearWeeks: WeekData[] = [];

        Object.keys(availabilities)
            .filter(key => key !== 'default')
            .forEach(key => {
                const week = parseInt(key.substring(1));
                const weekData = {
                    week,
                    count: availabilities[key].length
                };

                if (week < 31) {
                    nextYearWeeks.push(weekData);
                } else {
                    currentYearWeeks.push(weekData);
                }
            });

        return [...currentYearWeeks.sort((a, b) => a.week - b.week), ...nextYearWeeks.sort((a, b) => a.week - b.week)];
    }, [availabilities]);

    const handleWeekClick = (week: number) => {
        onModeChange(false); // Passer en mode spécifique
        onWeekClick(getDateOfISOWeek(week));
    };

    return (
        <div className="flex flex-wrap gap-2">
            {weeks.map(({ week, count }) => (
                <button
                    key={week}
                    onClick={() => handleWeekClick(week)}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                >
                    S{week} ({count})
                </button>
            ))}
        </div>
    );
}

export default function IntervenantCalendar({ intervenantId }: CalendarProps) {
    const [availabilities, setAvailabilities] = useState<AvailabilityPeriod>({});
    const [workweek, setWorkweek] = useState<WorkWeekItem[]>([]);
    const [isRecurrent, setIsRecurrent] = useState<boolean>(false);
    const [currentWeek, setCurrentWeek] = useState<number>(getWeekNumber(new Date()));
    const [hasSpecificAvailabilities, setHasSpecificAvailabilities] = useState<boolean>(false);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
        isOpen: false,
        event: null,
        calendar: null
    });
    const calendarRef = useRef<FullCalendar>(null);

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch(`/api/admin/intervenant/${intervenantId}/availabilities`);
            const data = await response.json();
            setAvailabilities(data.availabilities || {});
            setWorkweek(data.workweek || []);
        };
        fetchData();
    }, [intervenantId]);

    useEffect(() => {
        if (!availabilities) return;

        const filteredAvailabilities: AvailabilityPeriod = {};
        const weekKey = `S${currentWeek}`;

        if (isRecurrent) {
            if (availabilities.default) {
                filteredAvailabilities.default = availabilities.default;
            }
        } else {
            if (availabilities[weekKey]) {
                filteredAvailabilities[weekKey] = availabilities[weekKey];
            }
        }

        const newEvents = convertAvailabilitiesToEvents(filteredAvailabilities);
        setEvents(newEvents);
    }, [availabilities, isRecurrent, currentWeek]);

    const handleAvailabilityChange = async (newAvailabilities: AvailabilityPeriod) => {
        try {
            const response = await fetch(`/api/admin/intervenant/${intervenantId}/availabilities`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ availabilities: newAvailabilities }),
            });
            const data = await response.json();
            setAvailabilities(data.availabilities || {});
        } catch (error) {
            console.error('Error saving availabilities:', error);
        }
    };

    const handleSelect = useCallback((selectInfo: DateSelectArg) => {
        const calendarApi = selectInfo.view.calendar;
        const newEvent: CalendarEvent = {
            title: 'Disponible',
            start: selectInfo.startStr,
            end: selectInfo.endStr,
            backgroundColor: '#3B82F6',
            borderColor: '#2563EB'
        };

        // Check for overlapping events
        const existingEvents = calendarApi.getEvents();
        const hasOverlap = existingEvents.some(existingEvent => {
            const eventData = {
                start: existingEvent.startStr,
                end: existingEvent.endStr
            };
            return doEventsOverlap(newEvent, eventData as CalendarEvent);
        });

        if (hasOverlap) {
            alert('Cette plage horaire chevauche une disponibilité existante.');
            return;
        }

        calendarApi.unselect();
        calendarApi.addEvent(newEvent);

        // Update availabilities
        const formattedAvailability = formatEventToAvailability(newEvent, selectInfo.view);
        const weekKey = formattedAvailability.weekKey;
        const newAvailabilities = { ...availabilities };

        if (isRecurrent) {
            newAvailabilities.default = [...(newAvailabilities.default || []), formattedAvailability.availability];
        } else {
            newAvailabilities[weekKey] = [...(newAvailabilities[weekKey] || []), formattedAvailability.availability];
        }

        handleAvailabilityChange(newAvailabilities);
    }, [availabilities, isRecurrent, handleAvailabilityChange]);

    const handleEventClick = useCallback((clickInfo: EventClickArg) => {
        setDeleteModal({
            isOpen: true,
            event: {
                title: clickInfo.event.title,
                start: clickInfo.event.startStr,
                end: clickInfo.event.endStr
            },
            calendar: calendarRef.current
        });
    }, []);

    const handleDeleteEvent = useCallback(() => {
        if (!deleteModal.event || !deleteModal.calendar) return;

        const calendarApi = deleteModal.calendar.getApi();
        const formattedAvailability = formatEventToAvailability(deleteModal.event, { currentStart: calendarApi.view.currentStart });
        const weekKey = formattedAvailability.weekKey;
        const newAvailabilities = { ...availabilities };

        if (isRecurrent) {
            newAvailabilities.default = (newAvailabilities.default || []).filter(
                avail =>
                    avail.days !== formattedAvailability.availability.days ||
                    avail.from !== formattedAvailability.availability.from ||
                    avail.to !== formattedAvailability.availability.to
            );
        } else {
            newAvailabilities[weekKey] = (newAvailabilities[weekKey] || []).filter(
                avail =>
                    avail.days !== formattedAvailability.availability.days ||
                    avail.from !== formattedAvailability.availability.from ||
                    avail.to !== formattedAvailability.availability.to
            );
        }

        handleAvailabilityChange(newAvailabilities);
        setDeleteModal({ isOpen: false, event: null, calendar: null });
    }, [availabilities, isRecurrent, deleteModal, handleAvailabilityChange]);

    // const formatDayHeader = useCallback((arg: { date: Date; text: string }) => {
    //     if (isRecurrent) {
    //         const weekday = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' })
    //             .format(arg.date);
    //         return weekday.charAt(0).toUpperCase() + weekday.slice(1);
    //     }
    //     return arg.text;
    // }, [isRecurrent]);

    const handleDatesSet = useCallback((arg: DatesSetArg) => {
        const date = new Date(arg.start);
        const week = getWeekNumber(date);
        setCurrentWeek(week);
        setHasSpecificAvailabilities(!!availabilities[`S${week}`]?.length);
    }, [availabilities]);

    return (
        <div className="space-y-4">
            <HeaderSection
                isRecurrent={isRecurrent}
                onRecurrentChange={setIsRecurrent}
                hasSpecificAvailabilities={hasSpecificAvailabilities}
                currentWeek={currentWeek}
                workweek={workweek}
            />

            <WeekIndicator
                availabilities={availabilities}
                onWeekClick={(date) => {
                    if (calendarRef.current) {
                        calendarRef.current.getApi().gotoDate(date);
                    }
                }}
                onModeChange={setIsRecurrent}
            />

            <div className="bg-white rounded-lg shadow">
                <FullCalendar
                    ref={calendarRef}
                    plugins={[timeGridPlugin, interactionPlugin]}
                    initialView="timeGridWeek"
                    selectable={true}
                    selectMirror={true}
                    dayMaxEvents={true}
                    weekends={false}
                    allDaySlot={false}
                    locale={frLocale}
                    slotMinTime="08:00:00"
                    slotMaxTime="19:00:00"
                    validRange={getAcademicYearDates()}
                    select={handleSelect}
                    eventClick={handleEventClick}
                    headerToolbar={false}
                    events={events}
                    dayHeaderFormat={{
                        weekday: isRecurrent ? 'long' : 'short',
                        month: isRecurrent ? undefined : 'numeric',
                        day: isRecurrent ? undefined : 'numeric',
                        omitCommas: true
                    }}
                    datesSet={handleDatesSet}
                />
            </div>

            <DeleteModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, event: null, calendar: null })}
                onConfirm={handleDeleteEvent}
            />
        </div>
    );
}
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { analyzeAvailabilities, formatWeekWarning } from '@/lib/calendar-utils';
import { AlertTriangle, AlertCircle } from 'lucide-react';

interface CalendarEvent {
    title: string;
    start: string;
    end: string;
    backgroundColor?: string;
    borderColor?: string;
}

function getAcademicYearDates() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    let startYear = currentYear;

    // Si on est avant août, on est dans l'année académique précédente
    if (currentDate.getMonth() < 7) { // 7 = août (0-based)
        startYear = currentYear - 1;
    }

    return {
        start: new Date(startYear, 7, 1), // 1er août
        end: new Date(startYear + 1, 6, 31) // 31 juillet
    };
}

function formatEventToAvailability(event: any, calendar: any) {
    const start = new Date(event.start);
    const end = new Date(event.end);

    // Récupérer la date de début de la semaine affichée
    const currentDate = calendar.currentData.currentDate;
    const weekStart = new Date(currentDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Lundi de la semaine courante

    // Calculer le numéro de semaine
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

interface DeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
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

function WeekTypeSelector({ isRecurrent, onChange, hasSpecificAvailabilities }: {
    isRecurrent: boolean;
    onChange: (isRecurrent: boolean) => void;
    hasSpecificAvailabilities: boolean;
}) {
    return (
        <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="weekType"
                    checked={isRecurrent}
                    onChange={(e) => onChange(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 focus:ring-blue-500 text-blue-600 cursor-pointer"
                />
                <label
                    htmlFor="weekType"
                    className="text-sm text-gray-700"
                >
                    Disponibilité récurrente
                </label>
            </div>
            <div className="ml-2 flex items-center gap-2">
                <span className="text-xs text-gray-500">
                    {isRecurrent ? (
                        "Affichage des disponibilités récurrentes"
                    ) : (
                        "Affichage des disponibilités spécifiques à la semaine"
                    )}
                </span>
                {hasSpecificAvailabilities && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Disponibilités spécifiques existantes
                    </span>
                )}
            </div>
        </div>
    );
}

function WeekIndicator({ availabilities }: { availabilities: any }) {
    const weeks = useMemo(() => {
        const currentYearWeeks: { week: number; count: number }[] = [];
        const nextYearWeeks: { week: number; count: number }[] = [];

        Object.keys(availabilities)
            .filter(key => key !== 'default')
            .forEach(key => {
                const week = parseInt(key.substring(1));
                const weekData = {
                    week,
                    count: availabilities[key].length
                };

                if (week >= 31) {
                    currentYearWeeks.push(weekData);
                } else {
                    nextYearWeeks.push(weekData);
                }
            });

        return [
            ...currentYearWeeks.sort((a, b) => a.week - b.week),
            ...nextYearWeeks.sort((a, b) => a.week - b.week)
        ];
    }, [availabilities]);

    if (weeks.length === 0) return null;

    return (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Semaines avec disponibilités spécifiques :</h3>
            <div className="flex flex-wrap gap-2">
                {weeks.map(({ week, count }, index) => (
                    <div
                        key={week}
                        className={`px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-1 ${week < 31 && weeks[index - 1]?.week >= 31 ? 'ml-6' : ''
                            }`}
                    >
                        <span>S{week}</span>
                        <span className="bg-blue-200 text-blue-900 px-1.5 py-0.5 rounded-full text-xs">
                            {count}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function IntervenantCalendar({ intervenantId }: { intervenantId: string }) {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [availabilities, setAvailabilities] = useState<any>({});
    const [workweek, setWorkweek] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<string | null>(null);
    const [currentWeek, setCurrentWeek] = useState<number>(0);
    const academicYear = useMemo(() => getAcademicYearDates(), []);
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        event: null as any,
        calendar: null as any
    });
    const [isRecurrent, setIsRecurrent] = useState(false);

    const analysis = useMemo(() => {
        return analyzeAvailabilities(availabilities, workweek);
    }, [availabilities, workweek]);

    const generateRecurringEvents = useMemo(() => (slot: any, weekKey: string) => {
        const events: CalendarEvent[] = [];
        const [hours, minutes] = slot.from.split(':').map(Number);
        const [endHours, endMinutes] = slot.to.split(':').map(Number);
        const days = slot.days.split(',').map((day: string) => day.trim());

        days.forEach((day: string) => {
            const dayIndex = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'].indexOf(day);
            if (dayIndex === -1) return;

            let currentDate = new Date(academicYear.start);
            const diff = (dayIndex + 1 - (currentDate.getDay() || 7) + 7) % 7;
            currentDate.setDate(currentDate.getDate() + diff);

            while (currentDate <= academicYear.end) {
                const start = new Date(currentDate);
                start.setHours(hours, minutes, 0);
                const end = new Date(currentDate);
                end.setHours(endHours, endMinutes, 0);

                events.push({
                    title: 'Disponible (Récurrent)',
                    start: start.toISOString(),
                    end: end.toISOString(),
                    backgroundColor: '#60a5fa',
                    borderColor: '#60a5fa'
                });

                currentDate.setDate(currentDate.getDate() + 7);
            }
        });

        return events;
    }, [academicYear]);

    const convertAvailabilitiesToEvents = useMemo(() => () => {
        const newEvents: CalendarEvent[] = [];

        if (isRecurrent) {
            if (Array.isArray(availabilities.default)) {
                availabilities.default.forEach((slot: any) => {
                    newEvents.push(...generateRecurringEvents(slot, 'default'));
                });
            }
            return newEvents;
        }

        Object.entries(availabilities).forEach(([weekKey, slots]) => {
            if (weekKey === 'default') return;

            if (Array.isArray(slots)) {
                slots.forEach((slot: any) => {
                    const [hours, minutes] = slot.from.split(':').map(Number);
                    const [endHours, endMinutes] = slot.to.split(':').map(Number);
                    const days = slot.days.split(',').map((day: string) => day.trim());

                    days.forEach((day: string) => {
                        const date = getDateFromWeekAndDay(weekKey, day, academicYear);
                        if (date) {
                            const start = new Date(date);
                            start.setHours(hours, minutes);
                            const end = new Date(date);
                            end.setHours(endHours, endMinutes);

                            newEvents.push({
                                title: 'Disponible',
                                start: start.toISOString(),
                                end: end.toISOString(),
                                backgroundColor: '#93c5fd',
                                borderColor: '#93c5fd'
                            });
                        }
                    });
                });
            }
        });

        return newEvents;
    }, [availabilities, generateRecurringEvents, academicYear, isRecurrent]);

    useEffect(() => {
        setEvents(convertAvailabilitiesToEvents());
    }, [convertAvailabilitiesToEvents, isRecurrent]);

    function getDateFromWeekAndDay(weekKey: string, day: string, academicYear: { start: Date, end: Date }): Date | null {
        if (weekKey === 'default') {
            const dayIndex = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']
                .indexOf(day.toLowerCase());

            if (dayIndex === -1) return null;

            const date = new Date(academicYear.start);
            const currentDay = date.getDay() || 7;
            const diff = dayIndex + 1 - currentDay;
            date.setDate(date.getDate() + diff);

            return date;
        }

        const weekNumber = parseInt(weekKey.substring(1));
        const dayIndex = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']
            .indexOf(day.toLowerCase());

        if (dayIndex === -1) return null;

        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const firstDayOfYear = new Date(currentYear, 0, 1);
        const dayOffset = firstDayOfYear.getDay() || 7;
        firstDayOfYear.setDate(firstDayOfYear.getDate() + (1 - dayOffset));
        const date = new Date(firstDayOfYear);
        date.setDate(date.getDate() + (weekNumber - 1) * 7 + dayIndex);

        return date;
    }

    const handleSelect = useCallback((selectInfo: any) => {
        const newEvent = {
            title: isRecurrent ? 'Disponible (Récurrent)' : 'Disponible',
            start: selectInfo.start,
            end: selectInfo.end,
            backgroundColor: isRecurrent ? '#60a5fa' : '#93c5fd',
            borderColor: isRecurrent ? '#60a5fa' : '#93c5fd'
        };

        const hasOverlap = events.some(existingEvent => {
            const sameDay = new Date(existingEvent.start).toDateString() === new Date(newEvent.start).toDateString();
            return sameDay && doEventsOverlap(existingEvent, newEvent);
        });

        if (hasOverlap) {
            setError("Il y a déjà une disponibilité sur ce créneau");
            setTimeout(() => setError(null), 3000);
            selectInfo.view.calendar.unselect();
            return;
        }

        const { weekKey, availability } = formatEventToAvailability(newEvent, selectInfo.view.calendar);
        const newAvailabilities = { ...availabilities };
        const targetKey = isRecurrent ? 'default' : weekKey;

        if (!newAvailabilities[targetKey]) {
            newAvailabilities[targetKey] = [];
        }
        newAvailabilities[targetKey].push(availability);

        saveAvailabilities(newAvailabilities);
    }, [events, availabilities, isRecurrent, intervenantId]);

    const handleEventClick = useCallback((clickInfo: any) => {
        setDeleteModal({
            isOpen: true,
            event: clickInfo.event,
            calendar: clickInfo.view.calendar
        });
    }, []);

    const handleDeleteConfirm = useCallback(() => {
        if (!deleteModal.event) return;

        const eventToDelete = deleteModal.event;
        const isRecurrentEvent = eventToDelete.title.includes('Récurrent');
        const { weekKey, availability } = formatEventToAvailability(eventToDelete, deleteModal.calendar);

        const newAvailabilities = { ...availabilities };
        const targetKey = isRecurrentEvent ? 'default' : weekKey;

        if (newAvailabilities[targetKey]) {
            const eventTime = new Date(eventToDelete.start).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
            });
            const eventDay = getDayName(new Date(eventToDelete.start).getDay());

            newAvailabilities[targetKey] = newAvailabilities[targetKey].filter(
                (a: any) => !(a.from === eventTime && a.days === eventDay)
            );

            if (newAvailabilities[targetKey].length === 0) {
                delete newAvailabilities[targetKey];
            }

            saveAvailabilities(newAvailabilities);
        }

        setDeleteModal({ isOpen: false, event: null, calendar: null });
    }, [deleteModal.event, deleteModal.calendar, availabilities, intervenantId]);

    // Charger les disponibilités initiales
    useEffect(() => {
        const fetchAvailabilities = async () => {
            try {
                const response = await fetch(`/api/admin/intervenant/${intervenantId}/availabilities`);
                if (!response.ok) throw new Error('Failed to fetch availabilities');
                const data = await response.json();
                setAvailabilities(data.availabilities || {});
                setWorkweek(data.workweek || []);
                setLastUpdate(data.last_availability_update);
            } catch (error) {
                console.error('Error fetching availabilities:', error);
                setError('Erreur lors du chargement des disponibilités');
            }
        };

        fetchAvailabilities();
    }, [intervenantId]);

    // Fonction pour sauvegarder les disponibilités
    const saveAvailabilities = async (newAvailabilities: any) => {
        try {
            const response = await fetch(`/api/admin/intervenant/${intervenantId}/availabilities`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ availabilities: newAvailabilities }),
            });

            if (!response.ok) throw new Error('Failed to save availabilities');

            const data = await response.json();
            setAvailabilities(data.availabilities || {});
        } catch (error) {
            console.error('Error saving availabilities:', error);
            setError('Erreur lors de la sauvegarde des disponibilités');
        }
    };

    // Fonction pour formater les dates du calendrier
    const formatDayHeader = useCallback((arg: { date: Date, text: string }) => {
        if (isRecurrent) {
            // En mode récurrent, n'afficher que le nom du jour
            const weekday = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' })
                .format(arg.date);
            return weekday.charAt(0).toUpperCase() + weekday.slice(1);
        }
        // En mode normal, utiliser le texte par défaut fourni
        return arg.text;
    }, [isRecurrent]);

    // Ajouter un gestionnaire pour les changements de dates
    const handleDatesSet = useCallback((arg: any) => {
        const date = new Date(arg.start);
        const weekNum = getWeekNumber(date);
        setCurrentWeek(weekNum);
    }, []);

    // Ajouter cette fonction pour vérifier les disponibilités spécifiques
    const hasSpecificAvailabilities = useMemo(() => {
        const weekKey = `S${currentWeek}`;
        return availabilities[weekKey] && availabilities[weekKey].length > 0;
    }, [availabilities, currentWeek]);

    return (
        <div className="space-y-6">
            <WeekTypeSelector
                isRecurrent={isRecurrent}
                onChange={setIsRecurrent}
                hasSpecificAvailabilities={hasSpecificAvailabilities}
            />

            <WeekIndicator availabilities={availabilities} />

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                    {error}
                </div>
            )}

            {/* Indicateur de la semaine actuelle */}
            <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                    <span className="text-blue-700 font-medium">Semaine {currentWeek}</span>
                    <span className="text-blue-600">
                        ({new Date().getFullYear()})
                    </span>
                </div>
                {workweek.find(w => w.week === currentWeek) && (
                    <div className="text-sm text-blue-600">
                        {workweek.find(w => w.week === currentWeek)?.hours}h prévues cette semaine
                    </div>
                )}
            </div>

            {/* Avertissements pour les semaines manquantes */}
            {analysis.missingWeeks.length > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
                        <h3 className="text-sm font-medium text-yellow-800">
                            Semaines sans disponibilité
                        </h3>
                    </div>
                    <div className="mt-2 text-sm text-yellow-700">
                        <ul className="list-disc pl-5 space-y-1">
                            {analysis.missingWeeks.map(week => (
                                <li key={week.week}>
                                    Semaine {week.week} ({formatWeekWarning(week.week)}) - {week.hours}h prévues
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Avertissements pour les heures insuffisantes */}
            {analysis.insufficientHours.length > 0 && (
                <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
                    <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-orange-400 mr-2" />
                        <h3 className="text-sm font-medium text-orange-800">
                            Disponibilités insuffisantes
                        </h3>
                    </div>
                    <div className="mt-2 text-sm text-orange-700">
                        <ul className="list-disc pl-5 space-y-1">
                            {analysis.insufficientHours.map(week => (
                                <li key={week.week}>
                                    Semaine {week.week} ({formatWeekWarning(week.week)}) <span className="w-4"></span>
                                    {week.available.toFixed(1)}h disponibles sur {week.required}h requises
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {lastUpdate && (
                <div className="text-sm text-gray-600">
                    Dernière modification : {new Date(lastUpdate).toLocaleString('fr-FR', {
                        dateStyle: 'long',
                        timeStyle: 'short'
                    })}
                </div>
            )}

            <div className="h-[600px] bg-white p-4 rounded-lg shadow">
                <FullCalendar
                    plugins={[timeGridPlugin, interactionPlugin]}
                    initialView="timeGridWeek"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'timeGridWeek'
                    }}
                    locale={frLocale}
                    slotMinTime="08:00:00"
                    slotMaxTime="19:30:00"
                    allDaySlot={false}
                    weekends={false}
                    events={events}
                    height="100%"
                    selectable={true}
                    select={handleSelect}
                    validRange={{
                        start: academicYear.start,
                        end: academicYear.end
                    }}
                    selectConstraint={{
                        start: '08:00',
                        end: '19:30',
                        dows: [1, 2, 3, 4, 5]
                    }}
                    selectMirror={true}
                    eventClick={handleEventClick}
                    unselectAuto={true}
                    dayHeaderFormat={isRecurrent ? {
                        weekday: 'long',
                        month: undefined,
                        day: undefined,
                        year: undefined,
                        omitCommas: true
                    } : {
                        weekday: 'short',
                        month: 'numeric',
                        day: 'numeric',
                        omitCommas: true
                    }}
                    dayHeaderFormatter={formatDayHeader}
                    datesSet={handleDatesSet}
                />
            </div>

            <DeleteModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, event: null, calendar: null })}
                onConfirm={handleDeleteConfirm}
            />
        </div>
    );
}
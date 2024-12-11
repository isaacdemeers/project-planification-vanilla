'use client';

import { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';

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

function formatEventToAvailability(event: any) {
    const start = new Date(event.start);
    const end = new Date(event.end);
    const weekNumber = getWeekNumber(start);

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

export default function IntervenantCalendar({ intervenantId }: { intervenantId: string }) {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [availabilities, setAvailabilities] = useState<any>({});
    const [error, setError] = useState<string | null>(null);
    const academicYear = getAcademicYearDates();
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, event: null as any });

    // Effet pour synchroniser les événements avec les disponibilités
    useEffect(() => {
        const newEvents: CalendarEvent[] = [];
        Object.entries(availabilities).forEach(([weekKey, slots]) => {
            (slots as any[]).forEach((slot: any) => {
                const [hours, minutes] = slot.from.split(':').map(Number);
                const [endHours, endMinutes] = slot.to.split(':').map(Number);
                const days = slot.days.split(',').map((day: string) => day.trim());

                days.forEach((day: string) => {
                    const date = getDateFromWeekAndDay(weekKey, day);
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
        });
        setEvents(newEvents);
    }, [availabilities]);

    // Fonction utilitaire pour obtenir la date à partir de la semaine et du jour
    function getDateFromWeekAndDay(weekKey: string, day: string): Date | null {
        const weekNumber = parseInt(weekKey.substring(1));
        const dayIndex = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']
            .indexOf(day.toLowerCase());

        if (dayIndex === -1) return null;

        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();

        // Obtenir le premier jour de l'année
        const firstDayOfYear = new Date(currentYear, 0, 1);

        // Ajuster au premier lundi de l'année
        const dayOffset = firstDayOfYear.getDay() || 7;
        firstDayOfYear.setDate(firstDayOfYear.getDate() + (1 - dayOffset));

        // Ajouter les semaines
        const date = new Date(firstDayOfYear);
        date.setDate(date.getDate() + (weekNumber - 1) * 7 + dayIndex);

        return date;
    }

    const handleSelect = useCallback((selectInfo: any) => {
        const newEvent = {
            title: 'Disponible',
            start: selectInfo.start,
            end: selectInfo.end,
            backgroundColor: '#93c5fd',
            borderColor: '#93c5fd'
        };

        // Vérifier si le nouvel événement chevauche un événement existant
        const hasOverlap = events.some(existingEvent => {
            const sameDay = new Date(existingEvent.start).toDateString() === new Date(newEvent.start).toDateString();
            return sameDay && doEventsOverlap(existingEvent, newEvent);
        });

        if (hasOverlap) {
            setError("Il y a déjà une disponibilité sur ce créneau");
            setTimeout(() => setError(null), 3000);
            selectInfo.view.calendar.unselect(); // Annule la sélection immédiatement
            return;
        }

        setEvents(prev => [...prev, newEvent]);

        const { weekKey, availability } = formatEventToAvailability(newEvent);
        const newAvailabilities = { ...availabilities };

        if (!newAvailabilities[weekKey]) {
            newAvailabilities[weekKey] = [];
        }
        newAvailabilities[weekKey].push(availability);
        setAvailabilities(newAvailabilities);
    }, [events, availabilities]);

    const handleEventClick = useCallback((clickInfo: any) => {
        setDeleteModal({ isOpen: true, event: clickInfo.event });
    }, []);

    const handleDeleteConfirm = useCallback(() => {
        if (!deleteModal.event) return;

        const eventToDelete = deleteModal.event;
        const { weekKey } = formatEventToAvailability(eventToDelete);

        // Supprimer l'événement de la liste des événements
        setEvents(prev => prev.filter(event =>
            event.start !== eventToDelete.startStr ||
            event.end !== eventToDelete.endStr
        ));

        // Mettre à jour les disponibilités
        const newAvailabilities = { ...availabilities };
        if (newAvailabilities[weekKey]) {
            const eventTime = new Date(eventToDelete.start).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
            });
            newAvailabilities[weekKey] = newAvailabilities[weekKey].filter(
                (a: any) => a.from !== eventTime
            );
            if (newAvailabilities[weekKey].length === 0) {
                delete newAvailabilities[weekKey];
            }
        }
        setAvailabilities(newAvailabilities);
        setDeleteModal({ isOpen: false, event: null });
    }, [deleteModal.event, availabilities]);

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                    {error}
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
                        dows: [1, 2, 3, 4, 5] // Lundi à vendredi
                    }}
                    selectMirror={true}
                    eventClick={handleEventClick}
                    unselectAuto={true}
                />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Disponibilités actuelles</h3>
                <textarea
                    value={JSON.stringify(availabilities, null, 2)}
                    readOnly
                    className="w-full h-64 font-mono text-sm p-4 border rounded-lg bg-white"
                    spellCheck={false}
                />
            </div>

            <DeleteModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, event: null })}
                onConfirm={handleDeleteConfirm}
            />
        </div>
    );
}
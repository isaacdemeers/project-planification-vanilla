'use client';

import { useEffect, useState, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import frLocale from '@fullcalendar/core/locales/fr';
import multiMonthPlugin from '@fullcalendar/multimonth';
import interactionPlugin from '@fullcalendar/interaction';

function DeleteEventModal({ isOpen, onClose, onConfirm }: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Supprimer le créneau</h3>
                <p className="text-gray-600 mb-6">
                    Êtes-vous sûr de vouloir supprimer ce créneau de disponibilité ?
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

function getWeekNumber(date: Date): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNumber = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNumber;
}

interface CalendarProps {
    events: any[];
    onAvailabilityChange?: (updateFn: (prev: any) => any) => void;
}

function WeekCalendar({ events, onAvailabilityChange }: CalendarProps) {
    const [currentWeek, setCurrentWeek] = useState<number>(getWeekNumber(new Date()));
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleDatesSet = useCallback((dateInfo: any) => {
        const weekNumber = getWeekNumber(dateInfo.start);
        setCurrentWeek(weekNumber);
    }, []);

    const handleEventClick = useCallback((clickInfo: any) => {
        setSelectedEvent(clickInfo.event);
        setIsDeleteModalOpen(true);
    }, []);

    const handleDeleteEvent = useCallback(() => {
        if (!onAvailabilityChange || !selectedEvent) return;

        const eventDate = new Date(selectedEvent.start);
        const weekNumber = getWeekNumber(eventDate);
        const weekKey = `S${weekNumber}`;

        onAvailabilityChange((prevAvailabilities: any) => {
            const updatedAvailabilities = { ...prevAvailabilities };

            if (updatedAvailabilities[weekKey]) {
                const eventTime = {
                    from: eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                    to: new Date(selectedEvent.end).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                    days: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][eventDate.getDay()]
                };

                updatedAvailabilities[weekKey] = updatedAvailabilities[weekKey].filter((slot: any) =>
                    !(slot.from === eventTime.from &&
                        slot.to === eventTime.to &&
                        slot.days === eventTime.days)
                );

                if (updatedAvailabilities[weekKey].length === 0) {
                    delete updatedAvailabilities[weekKey];
                }
            }

            return updatedAvailabilities;
        });

        setIsDeleteModalOpen(false);
        setSelectedEvent(null);
    }, [onAvailabilityChange, selectedEvent]);

    const handleSelect = useCallback((selectInfo: any) => {
        if (!onAvailabilityChange) return;

        const startDate = new Date(selectInfo.start);
        const endDate = new Date(selectInfo.end);
        const weekNumber = getWeekNumber(startDate);
        const weekKey = `S${weekNumber}`;

        const from = startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const to = endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

        const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
        const day = dayNames[startDate.getDay()];

        const newSlot = {
            days: day,
            from,
            to
        };

        onAvailabilityChange((prevAvailabilities: any) => {
            const updatedAvailabilities = { ...prevAvailabilities };

            if (updatedAvailabilities[weekKey]) {
                updatedAvailabilities[weekKey] = [...updatedAvailabilities[weekKey], newSlot];
            } else {
                updatedAvailabilities[weekKey] = [newSlot];
            }

            return updatedAvailabilities;
        });

        selectInfo.view.calendar.unselect();
    }, [onAvailabilityChange]);

    return (
        <>
            <div className="space-y-2">
                <div className="bg-blue-100 p-2 rounded text-center">
                    Semaine {currentWeek}
                </div>
                <div className="h-[600px] bg-white p-4 rounded-lg shadow">
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
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
                        datesSet={handleDatesSet}
                        selectable={true}
                        select={handleSelect}
                        selectMirror={true}
                        eventClick={handleEventClick}
                        selectConstraint={{
                            startTime: '08:00',
                            endTime: '19:30',
                        }}
                    />
                </div>
            </div>
            <DeleteEventModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedEvent(null);
                }}
                onConfirm={handleDeleteEvent}
            />
        </>
    );
}

function MonthCalendar({ events }: CalendarProps) {
    const currentDate = new Date();
    let academicYear = currentDate.getFullYear();

    if (currentDate.getMonth() < 8) {
        academicYear--;
    }

    const startDate = new Date(academicYear, 8, 1);
    const endDate = new Date(academicYear + 1, 5, 30);

    // Créer un mapping des jours avec leurs événements
    const dayEvents = events.reduce((acc: { [key: string]: string }, event: any) => {
        const eventStart = new Date(event.start);
        // Ajuster la date pour le fuseau horaire local
        const dateKey = new Date(eventStart.getTime() - eventStart.getTimezoneOffset() * 60000)
            .toISOString()
            .split('T')[0];

        // Si l'événement contient "Default", le jour est bleu
        // Sinon, le jour est rouge (événement spécifique)
        if (event.title.includes('Default')) {
            if (!acc[dateKey] || acc[dateKey] === 'white') {
                acc[dateKey] = 'blue';
            }
        } else {
            acc[dateKey] = 'red';
        }

        return acc;
    }, {});

    // Fonction pour colorer les jours
    const dayCellDidMount = (arg: any) => {
        const date = arg.date;
        // Ne pas colorer les weekends
        if (date.getDay() === 0 || date.getDay() === 6) return;

        // Ajuster la date pour le fuseau horaire local
        const dateKey = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
            .toISOString()
            .split('T')[0];

        // Appliquer la couleur selon le statut du jour
        if (dayEvents[dateKey] === 'blue') {
            arg.el.style.backgroundColor = '#93c5fd50'; // Bleu clair avec transparence
        } else if (dayEvents[dateKey] === 'red') {
            arg.el.style.backgroundColor = '#fca5a550'; // Rouge clair avec transparence
        } else {
            arg.el.style.backgroundColor = '#ffffff'; // Blanc pour les jours sans disponibilité
        }
    };

    return (
        <div className="mt-8 bg-white p-4 rounded-lg shadow">
            <FullCalendar
                plugins={[multiMonthPlugin, dayGridPlugin]}
                initialView="multiMonthYear"
                initialDate={startDate}
                multiMonthMaxColumns={1}
                headerToolbar={false}
                locale={frLocale}
                height="auto"
                weekends={false}
                firstDay={1}
                validRange={{
                    start: startDate,
                    end: endDate
                }}
                views={{
                    multiMonthYear: {
                        duration: { months: 10 }
                    }
                }}
                dayCellDidMount={dayCellDidMount}
            />
        </div>
    );
}

export { WeekCalendar as default, MonthCalendar };
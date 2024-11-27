'use client';

import { useEffect, useState, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import frLocale from '@fullcalendar/core/locales/fr';
import { useSearchParams } from 'next/navigation';
import { convertAvailabilitiesToEvents } from '@/lib/calendar-utils';

function getWeekNumber(date: Date): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNumber = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNumber;
}

export default function Calendar() {
    const [events, setEvents] = useState<any[]>([]);
    const [currentWeek, setCurrentWeek] = useState<number>(getWeekNumber(new Date()));
    const searchParams = useSearchParams();
    const key = searchParams.get('key');

    useEffect(() => {
        const fetchAvailabilities = async () => {
            if (!key) return;

            try {
                const response = await fetch(`/api/intervenant/${key}/availabilities`);
                const data = await response.json();

                if (data.availabilities) {
                    const calendarEvents = convertAvailabilitiesToEvents(data.availabilities);
                    setEvents(calendarEvents);
                }
            } catch (error) {
                console.error('Error fetching availabilities:', error);
            }
        };

        fetchAvailabilities();
    }, [key]);

    const handleDatesSet = useCallback((dateInfo: any) => {
        const weekNumber = getWeekNumber(dateInfo.start);
        setCurrentWeek(weekNumber);
    }, []);

    return (
        <div className="space-y-2">
            <div className="bg-blue-100 p-2 rounded text-center">
                Semaine {currentWeek}
            </div>
            <div className="h-[600px] bg-white p-4 rounded-lg shadow">
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin]}
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
                />
            </div>
        </div>
    );
}
'use client';

import { useEffect, useState, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import frLocale from '@fullcalendar/core/locales/fr';
import multiMonthPlugin from '@fullcalendar/multimonth';

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
}

function WeekCalendar({ events }: CalendarProps) {
    const [currentWeek, setCurrentWeek] = useState<number>(getWeekNumber(new Date()));

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

function MonthCalendar({ events }: CalendarProps) {
    const currentDate = new Date();
    let academicYear = currentDate.getFullYear();

    if (currentDate.getMonth() < 8) {
        academicYear--;
    }

    const startDate = new Date(academicYear, 8, 1);
    const endDate = new Date(academicYear + 1, 5, 30);

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
                events={events}
                weekends={false}
                validRange={{
                    start: startDate,
                    end: endDate
                }}
                views={{
                    multiMonthYear: {
                        duration: { months: 10 }
                    }
                }}
            />
        </div>
    );
}

export { WeekCalendar as default, MonthCalendar };
'use client';

import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';

export default function Calendar() {
    return (
        <div className="mt-8">
            <FullCalendar
                plugins={[timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                locale={frLocale}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                weekends={false}
                allDaySlot={false}
                slotMinTime="08:00:00"
                slotMaxTime="19:30:00"
                height="auto"
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'timeGridWeek,timeGridDay'
                }}
            />
        </div>
    );
}
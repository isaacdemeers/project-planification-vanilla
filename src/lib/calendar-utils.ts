export interface Availability {
    days: string;
    from: string;
    to: string;
}

export interface AvailabilityPeriod {
    [key: string]: Availability[];
}

interface CalendarEvent {
    title: string;
    start: string;
    end: string;
    backgroundColor: string;
    borderColor: string;
}

function getStartOfWeek(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
}

function getWeekNumber(date: Date): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

const DAYS_MAP: { [key: string]: number } = {
    'lundi': 0,
    'mardi': 1,
    'mercredi': 2,
    'jeudi': 3,
    'vendredi': 4,
    'samedi': 5,
    'dimanche': 6,
};

function createEventForSlot(slot: Availability, date: Date, title: string, color: string): CalendarEvent[] {
    const days = slot.days.split(',').map(day => day.trim().toLowerCase());
    const events: CalendarEvent[] = [];

    days.forEach(day => {
        const dayIndex = DAYS_MAP[day];
        if (dayIndex === undefined) return;

        const eventDate = new Date(date);
        eventDate.setDate(eventDate.getDate() + dayIndex);

        const [fromHours, fromMinutes] = slot.from.split(':').map(Number);
        const [toHours, toMinutes] = slot.to.split(':').map(Number);

        const start = new Date(eventDate);
        start.setHours(fromHours, fromMinutes, 0);

        const end = new Date(eventDate);
        end.setHours(toHours, toMinutes, 0);

        events.push({
            title,
            start: start.toISOString(),
            end: end.toISOString(),
            backgroundColor: color,
            borderColor: color,
        });
    });

    return events;
}

export function convertAvailabilitiesToEvents(availabilities: AvailabilityPeriod): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    if (!availabilities) return events;

    const currentDate = new Date();
    let academicYear = currentDate.getFullYear();

    if (currentDate.getMonth() < 8) {
        academicYear--;
    }

    const startDate = new Date(academicYear, 8, 1);
    const startOfFirstWeek = getStartOfWeek(startDate);

    const endDate = new Date(academicYear + 1, 5, 30);
    const weeksToGenerate = Math.ceil((endDate.getTime() - startOfFirstWeek.getTime()) / (7 * 24 * 60 * 60 * 1000));

    for (let weekOffset = 0; weekOffset < weeksToGenerate; weekOffset++) {
        const weekDate = new Date(startOfFirstWeek);
        weekDate.setDate(weekDate.getDate() + weekOffset * 7);

        const weekNumber = getWeekNumber(weekDate);
        const weekKey = `S${weekNumber}`;

        if (availabilities['default']) {
            availabilities['default'].forEach(slot => {
                events.push(...createEventForSlot(
                    slot,
                    weekDate,
                    'Default - Disponible',
                    '#93c5fd'
                ));
            });
        }

        if (availabilities[weekKey]) {
            availabilities[weekKey].forEach(slot => {
                events.push(...createEventForSlot(
                    slot,
                    weekDate,
                    `${weekKey} - Disponible`,
                    '#60a5fa'
                ));
            });
        }
    }

    events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    return events;
}

export function validateAndCleanAvailabilities(availabilities: AvailabilityPeriod): AvailabilityPeriod {
    const cleanedAvailabilities: AvailabilityPeriod = {};

    for (const [week, slots] of Object.entries(availabilities)) {
        if (Array.isArray(slots) && slots.length > 0) {
            cleanedAvailabilities[week] = slots.filter(slot =>
                slot.days && slot.from && slot.to &&
                typeof slot.days === 'string' &&
                typeof slot.from === 'string' &&
                typeof slot.to === 'string'
            );
        }
    }

    return cleanedAvailabilities;
}

// ... rest of the file ... 
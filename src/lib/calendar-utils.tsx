type Availability = {
    days: string;
    from: string;
    to: string;
};

export type AvailabilityPeriod = {
    [key: string]: Availability[];
} | Record<string, never>;

// Validation des horaires au format HH:mm
function isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
}

// Validation des jours de la semaine
function isValidDays(days: string): boolean {
    const validDays = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    const daysList = days.split(',').map(day => day.trim().toLowerCase());
    return daysList.every(day => validDays.includes(day));
}

// Validation d'une disponibilité individuelle
function isValidAvailability(availability: any): availability is Availability {
    if (!availability || typeof availability !== 'object') return false;

    return (
        typeof availability.days === 'string' &&
        typeof availability.from === 'string' &&
        typeof availability.to === 'string' &&
        isValidDays(availability.days) &&
        isValidTimeFormat(availability.from) &&
        isValidTimeFormat(availability.to)
    );
}

// Validation d'une période de disponibilité
function isValidAvailabilityPeriod(period: any): period is AvailabilityPeriod {
    if (!period || typeof period !== 'object') return false;

    // Vérifier chaque clé du period
    return Object.entries(period).every(([key, value]) => {
        // Vérifier que la clé est soit 'default' soit commence par 'S' suivi d'un nombre
        if (key !== 'default' && !/^S\d+$/.test(key)) return false;

        // Vérifier que la valeur est un tableau de disponibilités valides
        return Array.isArray(value) && value.every(isValidAvailability);
    });
}

// Fonction pour valider et nettoyer les disponibilités
export function validateAndCleanAvailabilities(availabilities: any): AvailabilityPeriod {
    if (!isValidAvailabilityPeriod(availabilities)) {
        console.error('Invalid availability format:', availabilities);
        throw new Error('Format des disponibilités invalide');
    }
    return availabilities;
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

function isInCurrentAcademicYear(date: Date): boolean {
    const currentDate = new Date();
    const academicYearStart = new Date(currentDate.getFullYear(), 8, 1); // September 1st
    const academicYearEnd = new Date(currentDate.getFullYear() + 1, 5, 30); // June 30th next year

    if (currentDate < academicYearStart) {
        // We're before September, use previous academic year
        academicYearStart.setFullYear(academicYearStart.getFullYear() - 1);
        academicYearEnd.setFullYear(academicYearEnd.getFullYear() - 1);
    }

    return date >= academicYearStart && date <= academicYearEnd;
}

function getWeekNumber(date: Date): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNumber = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNumber;
}

function getStartOfWeek(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
}

function createEventForSlot(slot: Availability, date: Date, title: string, color: string) {
    const days = slot.days.split(',').map(day => day.trim().toLowerCase());
    const events: any[] = [];

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

export function convertAvailabilitiesToEvents(availabilities: AvailabilityPeriod) {
    const events: any[] = [];
    if (!availabilities) return events;

    const currentDate = new Date();
    let academicYear = currentDate.getFullYear();

    // Si on est avant septembre, on est dans l'année académique précédente
    if (currentDate.getMonth() < 8) { // 8 = septembre (0-based)
        academicYear--;
    }

    // On commence au 1er septembre de l'année académique
    const startDate = new Date(academicYear, 8, 1);
    const startOfFirstWeek = getStartOfWeek(startDate);

    // Calculer le nombre de semaines jusqu'au 30 juin
    const endDate = new Date(academicYear + 1, 5, 30);
    const weeksToGenerate = Math.ceil((endDate.getTime() - startOfFirstWeek.getTime()) / (7 * 24 * 60 * 60 * 1000));

    // Générer les événements pour toute l'année académique
    for (let weekOffset = 0; weekOffset < weeksToGenerate; weekOffset++) {
        const weekDate = new Date(startOfFirstWeek);
        weekDate.setDate(weekDate.getDate() + weekOffset * 7);

        const weekNumber = getWeekNumber(weekDate);
        const weekKey = `S${weekNumber}`;

        // Vérifier les disponibilités spécifiques pour cette semaine
        if (availabilities[weekKey]) {
            availabilities[weekKey].forEach(slot => {
                events.push(...createEventForSlot(
                    slot,
                    weekDate,
                    `${weekKey} - Disponible`,
                    '#60a5fa'
                ));
            });
        } else if (availabilities['default']) {
            availabilities['default'].forEach(slot => {
                events.push(...createEventForSlot(
                    slot,
                    weekDate,
                    'Default - Disponible',
                    '#93c5fd'
                ));
            });
        }
    }

    return events;
} 
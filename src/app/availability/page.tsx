'use client';

import React, { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import Calendar, { MonthCalendar } from '@/components/cal/calendar';
import EditorWrapper from '@/components/availability/editor-wrapper';
import { convertAvailabilitiesToEvents } from '@/lib/calendar-utils';
import { useSearchParams } from 'next/navigation';

export default function AvailabilityPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [intervenant, setIntervenant] = useState<any>(null);
    const searchParams = useSearchParams();
    const key = searchParams.get('key');

    useEffect(() => {
        async function loadData() {
            if (!key) return;

            try {
                const response = await fetch(`/api/intervenant/${key}/availabilities`);
                const data = await response.json();

                if (response.ok) {
                    setIntervenant(data);
                    if (data.availabilities) {
                        const calendarEvents = convertAvailabilitiesToEvents(data.availabilities);
                        setEvents(calendarEvents);
                    }
                } else if (data.error === 'expired') {
                    return (
                        <div className="max-w-2xl mx-auto p-6">
                            <div className="bg-red-100 text-red-700 p-4 rounded">
                                Votre lien a expiré. Veuillez contacter l'administrateur pour obtenir un nouveau lien.
                            </div>
                        </div>
                    );
                }
            } catch (error) {
                console.error('Error loading availabilities:', error);
            }
        }

        loadData();
    }, [key]);

    if (!key) notFound();
    if (!intervenant) return null;

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">
                Bonjour {intervenant.name} {intervenant.lastname}
            </h1>
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h2 className="text-lg font-semibold mb-2">Vos disponibilités actuelles :</h2>
                <EditorWrapper
                    initialValue={intervenant.availabilities}
                    intervenantId={key}
                />
            </div>
            <Calendar events={events} />
            <MonthCalendar events={events} />
        </div>
    );
}
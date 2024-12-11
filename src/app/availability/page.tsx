'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import JsonEditor from '@/components/availability/json-editor';
import { notFound } from 'next/navigation';
import IntervenantCalendar from '@/components/calendar/intervenant-calendar';

export default function AvailabilityPage() {
    const [intervenant, setIntervenant] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const key = searchParams.get('key');

    useEffect(() => {
        if (!key) return;

        const fetchIntervenant = async () => {
            try {
                const response = await fetch(`/api/intervenant/${key}/availability`);
                if (!response.ok) throw new Error('Failed to fetch intervenant');

                const data = await response.json();
                setIntervenant(data);
            } catch (error) {
                console.error('Error:', error);
                setError('Erreur lors du chargement des informations');
            }
        };

        fetchIntervenant();
    }, [key]);

    const handleSave = async (newValue: object) => {
        if (!key) return;

        try {
            const response = await fetch(`/api/intervenant/${key}/availability`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ availabilities: newValue }),
            });

            if (!response.ok) throw new Error('Failed to update availabilities');

            const data = await response.json();
            setIntervenant(data);
        } catch (error) {
            console.error('Error:', error);
            setError('Erreur lors de la mise à jour des disponibilités');
        }
    };

    if (!key) return notFound();
    if (error) return <div className="text-red-500 p-4">{error}</div>;
    if (!intervenant) return <div>Chargement...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            {intervenant && (
                <>
                    <h1 className="text-2xl font-bold mb-2">
                        Disponibilités de {intervenant.name} {intervenant.lastname}
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Modifiez vos disponibilités directement dans la zone de texte ci-dessous.
                    </p>
                    <JsonEditor
                        initialValue={intervenant.availabilities}
                        onSave={handleSave}
                    />
                    <IntervenantCalendar intervenantId={intervenant.id} />
                </>
            )}
        </div>
    );
}
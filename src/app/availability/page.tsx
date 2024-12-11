'use client';

import { useEffect, useState } from 'react';
import IntervenantCalendar from '@/components/calendar/intervenant-calendar';

export default function AvailabilityPage() {
    const [intervenantId, setIntervenantId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const key = new URLSearchParams(window.location.search).get('key');
        if (!key) {
            setError("Clé d'accès manquante");
            setLoading(false);
            return;
        }

        fetch(`/api/intervenant/validate-key?key=${key}`)
            .then(res => res.json())
            .then(data => {
                if (data.id) {
                    setIntervenantId(data.id);
                } else {
                    setError("Clé d'accès invalide");
                }
            })
            .catch(() => {
                setError("Erreur lors de la validation de la clé");
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                    <div className="text-red-500 text-center">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h3 className="mt-4 text-lg font-medium">{error}</h3>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow-lg">
                    <div className="p-6 border-b">
                        <h1 className="text-2xl font-semibold text-gray-900">
                            Gestion de vos disponibilités
                        </h1>
                        <p className="mt-2 text-sm text-gray-600">
                            Sélectionnez vos créneaux de disponibilité sur le calendrier
                        </p>
                    </div>
                    <div className="p-6">
                        {intervenantId && <IntervenantCalendar intervenantId={intervenantId} />}
                    </div>
                </div>
            </div>
        </div>
    );
}
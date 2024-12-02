'use client';

import React, { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import Calendar, { MonthCalendar } from '@/components/cal/calendar';
import EditorWrapper from '@/components/availability/editor-wrapper';
import { convertAvailabilitiesToEvents } from '@/lib/calendar-utils';
import { useSearchParams } from 'next/navigation';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

function ExpiredKeyMessage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="max-w-md p-8 bg-white rounded-lg shadow-lg">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">
                        Clé de connexion expirée
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Votre clé de connexion n'est plus valide. Veuillez contacter l'administrateur
                        pour obtenir une nouvelle clé d'accès à vos disponibilités.
                    </p>
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-700">
                            Note : Les clés de connexion expirent automatiquement après une certaine période
                            pour des raisons de sécurité.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AvailabilityPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [intervenant, setIntervenant] = useState<any>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const key = searchParams.get('key');

    useEffect(() => {
        async function loadData() {
            if (!key) return;

            try {
                const response = await fetch(`/api/intervenant/${key}/availabilities`);
                const data = await response.json();

                if (!response.ok) {
                    if (data.error === 'expired' || data.error === 'not_found') {
                        setError(data.error);
                        return;
                    }
                    throw new Error('Failed to fetch data');
                }

                setIntervenant(data);
                if (data.availabilities) {
                    const calendarEvents = convertAvailabilitiesToEvents(data.availabilities);
                    setEvents(calendarEvents);
                }
            } catch (error) {
                console.error('Error loading availabilities:', error);
                setError('error');
            }
        }

        loadData();
    }, [key]);

    if (!key) notFound();
    if (error === 'expired' || error === 'not_found') return <ExpiredKeyMessage />;
    if (!intervenant) return null;

    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <div className={`relative ${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 ease-in-out overflow-hidden bg-white border-r`}>
                <div className="h-full">
                    <MonthCalendar events={events} />
                </div>
            </div>

            {/* Toggle Button */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="absolute left-0 top-4 p-2 bg-white rounded-r-lg shadow-md hover:bg-gray-50 transition-all duration-300 ease-in-out z-10"
                style={{ transform: `translateX(${sidebarOpen ? '320px' : '0px'})` }}
            >
                {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
            </button>

            {/* Main Content */}
            <div className={`flex-1 p-6 transition-all duration-300 ease-in-out ${sidebarOpen ? 'ml-0' : ''}`}>
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
            </div>
        </div>
    );
}
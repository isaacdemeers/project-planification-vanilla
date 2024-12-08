'use client';

import { useState, useEffect, useRef } from 'react';
import AddIntervenant from '@/components/crud/add';
import IntervenantsList from '@/components/crud/read';
import KeyValiditySettings from '@/components/settings/key-validity';
import Calendar, { WeekCalendarRef } from '@/components/cal/calendar';
import { convertAvailabilitiesToEvents, type AvailabilityPeriod } from '@/lib/calendar-utils';
import { updateAvailabilities } from '@/lib/requests';
import type { Intervenant } from '@/lib/requests';

function IntervenantSelector({ intervenants, selectedId, onSelect }: {
    intervenants: Intervenant[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}) {
    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionner un intervenant
            </label>
            <select
                value={selectedId || ''}
                onChange={(e) => onSelect(e.target.value)}
                className="w-full p-2 border rounded-md"
            >
                <option value="">Choisir un intervenant</option>
                {intervenants.map((intervenant) => (
                    <option key={intervenant.id} value={intervenant.id}>
                        {intervenant.name} {intervenant.lastname}
                    </option>
                ))}
            </select>
        </div>
    );
}

function AvailabilityManager() {
    const [selectedIntervenant, setSelectedIntervenant] = useState<Intervenant | null>(null);
    const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [displayMode, setDisplayMode] = useState<'default' | 'specific' | 'all'>('all');
    const weekCalendarRef = useRef<WeekCalendarRef>(null);

    // Charger la liste des intervenants
    useEffect(() => {
        fetch('/api/intervenant')
            .then(res => res.json())
            .then(data => setIntervenants(data))
            .catch(error => console.error('Error loading intervenants:', error));
    }, []);

    const handleIntervenantSelect = async (id: string) => {
        try {
            const response = await fetch(`/api/admin/intervenant/${id}/availabilities`);
            const data = await response.json();
            console.log('Loaded intervenant data:', data);

            setSelectedIntervenant(data);
            if (data.availabilities) {
                console.log('Raw availabilities:', data.availabilities);
                const calendarEvents = convertAvailabilitiesToEvents(data.availabilities as AvailabilityPeriod);
                console.log('Converted calendar events:', calendarEvents);
                setEvents(calendarEvents);
            } else {
                setEvents([]);
            }
        } catch (error) {
            console.error('Error loading intervenant availabilities:', error);
        }
    };

    const handleAvailabilityChange = async (updateFn: (prev: any) => any) => {
        if (!selectedIntervenant) return;

        try {
            const newAvailabilities = updateFn(selectedIntervenant.availabilities);
            console.log('New availabilities before update:', newAvailabilities);

            const response = await fetch(`/api/admin/intervenant/${selectedIntervenant.id}/availabilities`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ availabilities: newAvailabilities }),
            });

            if (!response.ok) {
                throw new Error('Failed to update availabilities');
            }

            const updatedIntervenant = await response.json();
            console.log('Updated intervenant data:', updatedIntervenant);

            setSelectedIntervenant(updatedIntervenant);
            const calendarEvents = convertAvailabilitiesToEvents(updatedIntervenant.availabilities as AvailabilityPeriod);
            console.log('Updated calendar events:', calendarEvents);
            setEvents(calendarEvents);
        } catch (error) {
            console.error('Error updating availabilities:', error);
            alert('Erreur lors de la mise à jour des disponibilités');
        }
    };

    return (
        <div className="mt-8 p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Gestion des disponibilités</h2>
            <IntervenantSelector
                intervenants={intervenants}
                selectedId={selectedIntervenant?.id || null}
                onSelect={handleIntervenantSelect}
            />
            {selectedIntervenant && (
                <div className="mt-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">
                            Disponibilités de {selectedIntervenant.name} {selectedIntervenant.lastname}
                        </h3>
                        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setDisplayMode('all')}
                                className={`px-3 py-1 rounded-lg transition-colors ${displayMode === 'all'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-800'
                                    }`}
                            >
                                Tout
                            </button>
                            <button
                                onClick={() => setDisplayMode('specific')}
                                className={`px-3 py-1 rounded-lg transition-colors ${displayMode === 'specific'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-800'
                                    }`}
                            >
                                Spécifique
                            </button>
                            <button
                                onClick={() => setDisplayMode('default')}
                                className={`px-3 py-1 rounded-lg transition-colors ${displayMode === 'default'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-800'
                                    }`}
                            >
                                Par défaut
                            </button>
                        </div>
                    </div>
                    <Calendar
                        ref={weekCalendarRef}
                        events={events}
                        onAvailabilityChange={handleAvailabilityChange}
                        displayMode={displayMode}
                    />
                </div>
            )}
        </div>
    );
}

export default function Dashboard() {
    return (
        <>
            <div className="flex flex-col gap-4">
                <KeyValiditySettings />
                <AddIntervenant onIntervenantAdded={() => { }} />
                <IntervenantsList />
                <AvailabilityManager />
            </div>
        </>
    );
}

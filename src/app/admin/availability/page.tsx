'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Calendar, { MonthCalendar } from '@/components/cal/calendar';
import type { WeekCalendarRef } from '@/components/cal/calendar';
import EditorWrapper from '@/components/availability/editor-wrapper';
import { convertAvailabilitiesToEvents, validateAndCleanAvailabilities, type AvailabilityPeriod } from '@/lib/calendar-utils';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { updateAvailabilities } from '@/lib/requests';
import type { Intervenant } from '@/lib/requests';

function IntervenantSelector({ intervenants, selectedId, onSelect }: {
    intervenants: Intervenant[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}) {
    return (
        <div className="mb-6">
            <label htmlFor="intervenant-select" className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionner un intervenant
            </label>
            <select
                id="intervenant-select"
                value={selectedId || ''}
                onChange={(e) => onSelect(e.target.value)}
                className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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

export default function AdminAvailabilityPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [intervenant, setIntervenant] = useState<Intervenant | null>(null);
    const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [displayMode, setDisplayMode] = useState<'default' | 'specific' | 'all'>('all');
    const weekCalendarRef = useRef<WeekCalendarRef>(null);

    // Charger la liste des intervenants
    useEffect(() => {
        async function loadIntervenants() {
            try {
                const response = await fetch('/api/intervenant');
                if (!response.ok) throw new Error('Failed to fetch intervenants');
                const data = await response.json();
                setIntervenants(data);
            } catch (error) {
                console.error('Error loading intervenants:', error);
                setError('Erreur lors du chargement des intervenants');
            }
        }
        loadIntervenants();
    }, []);

    const handleIntervenantSelect = useCallback(async (id: string) => {
        try {
            const response = await fetch(`/api/intervenant/${id}/availabilities`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }

            setIntervenant(data);
            if (data.availabilities) {
                const calendarEvents = convertAvailabilitiesToEvents(data.availabilities);
                setEvents(calendarEvents);
            }
        } catch (error) {
            console.error('Error loading availabilities:', error);
            setError('Erreur lors du chargement des disponibilités');
        }
    }, []);

    const handleAvailabilityChange = useCallback(async (updateFn: (prev: any) => any) => {
        if (!intervenant) return;

        try {
            const newAvailabilities = updateFn(intervenant.availabilities);
            const validatedAvailabilities = validateAndCleanAvailabilities(newAvailabilities);
            const updatedIntervenant = await updateAvailabilities(intervenant.id, validatedAvailabilities);
            setIntervenant(updatedIntervenant);
            const calendarEvents = convertAvailabilitiesToEvents(updatedIntervenant.availabilities as AvailabilityPeriod);
            setEvents(calendarEvents);
        } catch (error) {
            console.error('Error updating availabilities:', error);
            alert(error instanceof Error ? error.message : 'Erreur lors de la mise à jour des disponibilités');
        }
    }, [intervenant]);

    const handleDateSelect = useCallback((date: Date) => {
        if (weekCalendarRef.current?.goToDate) {
            weekCalendarRef.current.goToDate(date);
        }
    }, []);

    if (error) {
        return <div className="p-4 text-red-600">{error}</div>;
    }

    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <div className={`relative ${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 ease-in-out overflow-hidden bg-white border-r`}>
                <div className="h-full overflow-y-auto">
                    <MonthCalendar
                        events={events}
                        displayMode={displayMode}
                        onDateSelect={handleDateSelect}
                    />
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
                <IntervenantSelector
                    intervenants={intervenants}
                    selectedId={intervenant?.id || null}
                    onSelect={handleIntervenantSelect}
                />

                {intervenant ? (
                    <>
                        <div className="flex justify-between items-center mb-4">
                            <h1 className="text-2xl font-bold">
                                Disponibilités de {intervenant.name} {intervenant.lastname}
                            </h1>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                    <button
                                        onClick={() => setDisplayMode('all')}
                                        className={`px-4 py-2 rounded-lg transition-colors ${displayMode === 'all'
                                                ? 'bg-white text-blue-600 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-800'
                                            }`}
                                    >
                                        Tout
                                    </button>
                                    <button
                                        onClick={() => setDisplayMode('specific')}
                                        className={`px-4 py-2 rounded-lg transition-colors ${displayMode === 'specific'
                                                ? 'bg-white text-blue-600 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-800'
                                            }`}
                                    >
                                        Spécifique
                                    </button>
                                    <button
                                        onClick={() => setDisplayMode('default')}
                                        className={`px-4 py-2 rounded-lg transition-colors ${displayMode === 'default'
                                                ? 'bg-white text-blue-600 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-800'
                                            }`}
                                    >
                                        Par défaut
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <h2 className="text-lg font-semibold mb-2">Disponibilités actuelles :</h2>
                            <EditorWrapper
                                initialValue={intervenant.availabilities}
                                intervenantId={intervenant.id}
                            />
                        </div>
                        <Calendar
                            ref={weekCalendarRef}
                            events={events}
                            onAvailabilityChange={handleAvailabilityChange}
                            displayMode={displayMode}
                        />
                    </>
                ) : (
                    <div className="text-center text-gray-500 mt-8">
                        Sélectionnez un intervenant pour voir et modifier ses disponibilités
                    </div>
                )}
            </div>
        </div>
    );
} 
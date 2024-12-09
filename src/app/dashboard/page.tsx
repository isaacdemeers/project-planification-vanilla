'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import AddIntervenant from '@/components/crud/add';
import IntervenantsList from '@/components/crud/read';
import KeyValiditySettings from '@/components/settings/key-validity';
import Calendar from '@/components/cal/calendar';
import { convertAvailabilitiesToEvents, type AvailabilityPeriod } from '@/lib/calendar-utils';
import type { Intervenant } from '@/lib/requests';
import AdminEditorWrapper from '@/components/availability/admin-editor-wrapper';
import { type RefObject } from 'react';
import FullCalendar from '@fullcalendar/react';
import { WeekCalendar, type WeekCalendarRef } from '@/components/cal/calendar';

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

function AddAvailabilityModal({ isOpen, onClose, onTypeSelect }: {
    isOpen: boolean;
    onClose: () => void;
    onTypeSelect: (type: 'default' | 'specific') => void;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Ajouter des disponibilités</h3>
                <p className="text-gray-600 mb-6">
                    Choisissez le type de disponibilités à ajouter :
                </p>
                <div className="space-y-4">
                    <button
                        onClick={() => {
                            onTypeSelect('default');
                            onClose();
                        }}
                        className="w-full p-4 text-left border rounded-lg hover:bg-gray-50"
                    >
                        <div className="font-medium">Par défaut</div>
                        <div className="text-sm text-gray-500">S'applique à toutes les semaines</div>
                    </button>
                    <button
                        onClick={() => {
                            onTypeSelect('specific');
                            onClose();
                        }}
                        className="w-full p-4 text-left border rounded-lg hover:bg-gray-50"
                    >
                        <div className="font-medium">Spécifique</div>
                        <div className="text-sm text-gray-500">S'applique uniquement à la semaine sélectionnée</div>
                    </button>
                </div>
                <button
                    onClick={onClose}
                    className="mt-6 w-full px-4 py-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                >
                    Annuler
                </button>
            </div>
        </div>
    );
}

function AvailabilityManager() {
    const [selectedIntervenant, setSelectedIntervenant] = useState<Intervenant | null>(null);
    const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [displayMode, setDisplayMode] = useState<'default' | 'specific' | 'all'>('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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

            // Mettre à jour l'intervenant dans la liste
            setIntervenants(prevIntervenants =>
                prevIntervenants.map(int =>
                    int.id === updatedIntervenant.id ? updatedIntervenant : int
                )
            );

            setSelectedIntervenant(updatedIntervenant);
            const calendarEvents = convertAvailabilitiesToEvents(updatedIntervenant.availabilities as AvailabilityPeriod);
            console.log('Updated calendar events:', calendarEvents);
            setEvents(calendarEvents);
        } catch (error) {
            console.error('Error updating availabilities:', error);
            alert('Erreur lors de la mise à jour des disponibilités');
        }
    };

    const handleTypeSelect = (type: 'default' | 'specific') => {
        setDisplayMode(type);
        setIsAddModalOpen(false);
    };

    const handleDateSelect = useCallback((date: Date) => {
        if (weekCalendarRef.current?.goToDate) {
            weekCalendarRef.current.goToDate(date);
        }
    }, []);

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
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Ajouter une disponibilité
                        </button>
                    </div>
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <h2 className="text-lg font-semibold mb-2">Disponibilités actuelles :</h2>
                        <AdminEditorWrapper
                            initialValue={selectedIntervenant.availabilities}
                            intervenantId={selectedIntervenant.id}
                        />
                    </div>
                    <WeekCalendar
                        ref={weekCalendarRef}
                        events={events}
                        onAvailabilityChange={handleAvailabilityChange}
                    />
                </div>
            )}

            <AddAvailabilityModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onTypeSelect={handleTypeSelect}
            />
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

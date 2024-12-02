'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { notFound } from 'next/navigation';
import Calendar, { MonthCalendar } from '@/components/cal/calendar';
import EditorWrapper from '@/components/availability/editor-wrapper';
import { convertAvailabilitiesToEvents, type AvailabilityPeriod } from '@/lib/calendar-utils';
import { useSearchParams } from 'next/navigation';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { updateAvailabilities } from '@/lib/requests';

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
                    Choisissez le type de disponibilités  ajouter :
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
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [displayMode, setDisplayMode] = useState<'default' | 'specific' | 'all'>('all');
    const searchParams = useSearchParams();
    const key = searchParams.get('key');

    const handleAvailabilityChange = useCallback(async (updateFn: (prev: any) => any) => {
        if (!key || !intervenant) return;

        try {
            const newAvailabilities = updateFn(intervenant.availabilities);
            const updatedIntervenant = await updateAvailabilities(key, newAvailabilities);
            setIntervenant(updatedIntervenant);
            const calendarEvents = convertAvailabilitiesToEvents(updatedIntervenant.availabilities as AvailabilityPeriod);
            setEvents(calendarEvents);
        } catch (error) {
            console.error('Error updating availabilities:', error);
        }
    }, [key, intervenant]);

    const handleTypeSelect = (type: 'default' | 'specific') => {
        setDisplayMode(type);
        // Ici on pourrait ajouter la logique pour filtrer les événements selon le type
    };

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
                <div className="h-full overflow-y-auto">
                    <MonthCalendar events={events} displayMode={displayMode} />
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
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold">
                        Bonjour {intervenant.name} {intervenant.lastname}
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
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Ajouter des disponibilités
                        </button>
                    </div>
                </div>
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h2 className="text-lg font-semibold mb-2">Vos disponibilités actuelles :</h2>
                    <EditorWrapper
                        initialValue={intervenant.availabilities}
                        intervenantId={key}
                    />
                </div>
                <Calendar
                    events={events}
                    onAvailabilityChange={handleAvailabilityChange}
                    displayMode={displayMode}
                />
            </div>

            <AddAvailabilityModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onTypeSelect={handleTypeSelect}
            />
        </div>
    );
}
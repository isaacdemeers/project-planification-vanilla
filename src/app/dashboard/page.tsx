'use client';

import { useState } from 'react';
import AddIntervenant from '@/components/crud/add';
import IntervenantsList from '@/components/crud/read';
import KeyValiditySettings from '@/components/settings/key-validity';
import IntervenantCalendar from '@/components/calendar/intervenant-calendar';
import type { Intervenant } from '@/lib/requests';

export default function Dashboard() {
    const [selectedIntervenantId, setSelectedIntervenantId] = useState<string | null>(null);

    const handleShowCalendar = (id: string) => {
        setSelectedIntervenantId(id === selectedIntervenantId ? null : id);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Tableau de bord administrateur
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Gérez les intervenants et leurs disponibilités
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                            Paramètres généraux
                        </h2>
                        <KeyValiditySettings />
                    </div>

                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6 border-b">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Gestion des intervenants
                                </h2>
                                <AddIntervenant onIntervenantAdded={() => { }} />
                            </div>
                        </div>
                        <div className="p-6">
                            <IntervenantsList
                                selectedId={selectedIntervenantId}
                                onShowCalendar={handleShowCalendar}
                            />
                        </div>
                    </div>

                    {selectedIntervenantId && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Calendrier des disponibilités
                            </h2>
                            <div className="mt-4">
                                <IntervenantCalendar intervenantId={selectedIntervenantId} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

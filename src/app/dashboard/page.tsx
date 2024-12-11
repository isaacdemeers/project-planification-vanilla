'use client';

import { useState, useEffect } from 'react';
import AddIntervenant from '@/components/crud/add';
import IntervenantsList from '@/components/crud/read';
import KeyValiditySettings from '@/components/settings/key-validity';
import IntervenantCalendar from '@/components/calendar/intervenant-calendar';
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

export default function Dashboard() {
    const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
    const [selectedIntervenantId, setSelectedIntervenantId] = useState<string | null>(null);

    useEffect(() => {
        const fetchIntervenants = async () => {
            try {
                const response = await fetch('/api/admin/intervenant/list');
                if (!response.ok) throw new Error('Failed to fetch intervenants');
                const data = await response.json();
                setIntervenants(data);
            } catch (error) {
                console.error('Error:', error);
            }
        };

        fetchIntervenants();
    }, []);

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Colonne de gauche */}
                <div className="space-y-6">
                    <KeyValiditySettings />
                    <AddIntervenant onIntervenantAdded={() => { }} />
                    <IntervenantsList />
                </div>

                {/* Colonne de droite - Calendrier */}
                <div className="space-y-4">
                    <IntervenantSelector
                        intervenants={intervenants}
                        selectedId={selectedIntervenantId}
                        onSelect={setSelectedIntervenantId}
                    />
                    {selectedIntervenantId && (
                        <IntervenantCalendar intervenantId={selectedIntervenantId} />
                    )}
                </div>
            </div>
        </div>
    );
}

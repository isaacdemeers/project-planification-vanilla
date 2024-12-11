'use client';

import { useState, useEffect } from 'react';
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
        <div className="flex flex-col gap-6 p-6">
            <div className="space-y-6">
                <KeyValiditySettings />
                <AddIntervenant onIntervenantAdded={() => { }} />
                <IntervenantsList
                    selectedId={selectedIntervenantId}
                    onShowCalendar={handleShowCalendar}
                />
                {selectedIntervenantId && (
                    <div className="mt-4">
                        <IntervenantCalendar intervenantId={selectedIntervenantId} />
                    </div>
                )}
            </div>
        </div>
    );
}

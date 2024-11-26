'use client';

import { useState } from 'react';
import AddIntervenant from '@/components/crud/add';
import IntervenantsList from '@/components/crud/read';

export default function Dashboard() {
    const [refreshKey, setRefreshKey] = useState(0);

    const handleIntervenantAdded = () => {
        setRefreshKey(prev => prev + 1);  // Force le rechargement de la liste
    };

    return (
        <>
            <div className="flex flex-col gap-4">
                <AddIntervenant onIntervenantAdded={handleIntervenantAdded} />
                <IntervenantsList key={refreshKey} />
            </div>
            <div className="flex flex-col gap-4">
            </div>
        </>
    );
}

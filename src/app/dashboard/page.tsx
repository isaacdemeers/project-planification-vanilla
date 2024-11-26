'use client';

import { useState } from 'react';
import AddIntervenant from '@/components/crud/add';
import IntervenantsList from '@/components/crud/read';
import KeyValiditySettings from '@/components/settings/key-validity';

export default function Dashboard() {
    return (
        <>
            <div className="flex flex-col gap-4">
                <KeyValiditySettings />
                <AddIntervenant onIntervenantAdded={() => { }} />
                <IntervenantsList />
            </div>
        </>
    );
}

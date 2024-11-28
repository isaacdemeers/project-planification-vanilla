import React from 'react';
import { notFound } from 'next/navigation';
import { validateConnectKey } from '@/lib/auth-key';
import Calendar, { MonthCalendar } from '@/components/cal/calendar';
import EditorWrapper from '@/components/availability/editor-wrapper';

interface PageProps {
    searchParams: Promise<{ key?: string }>;
}

export default async function AvailabilityPage({
    searchParams,
}: PageProps) {
    const params = await searchParams;
    const key = params.key;

    if (!key) notFound();

    const result = await validateConnectKey(key);

    if (result.type === 'error') {
        if (result.code === 'expired') {
            return (
                <div className="max-w-2xl mx-auto p-6">
                    <div className="bg-red-100 text-red-700 p-4 rounded">
                        Votre lien a expiré. Veuillez contacter l'administrateur pour obtenir un nouveau lien.
                    </div>
                </div>
            );
        }
        notFound();
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">
                Bonjour {result.intervenant.name} {result.intervenant.lastname}
            </h1>
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h2 className="text-lg font-semibold mb-2">Vos disponibilités actuelles :</h2>
                <EditorWrapper
                    initialValue={result.intervenant.availabilities}
                    intervenantId={result.intervenant.id}
                />
            </div>
            <Calendar />

            <MonthCalendar events={[]} />
        </div>
    );
} 
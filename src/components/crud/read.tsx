'use client';

import { useEffect, useState } from 'react';
import { getIntervenants, type Intervenant } from '@/lib/requests';

interface IntervenantsListProps {
    refreshTrigger?: number;
}

export default function IntervenantsList({ refreshTrigger = 0 }: IntervenantsListProps) {
    const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchIntervenants = async () => {
            try {
                const data = await getIntervenants();
                setIntervenants(data);
                setError(null);
            } catch (err) {
                setError('Erreur lors du chargement des intervenants');
            } finally {
                setLoading(false);
            }
        };

        fetchIntervenants();
    }, [refreshTrigger]);

    if (loading) {
        return <div className="text-center p-4">Chargement...</div>;
    }

    if (error) {
        return <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>;
    }

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Liste des intervenants</h2>

            {intervenants.length === 0 ? (
                <p className="text-gray-500">Aucun intervenant trouvé</p>
            ) : (
                <div className="grid gap-4">
                    {intervenants.map((intervenant) => (
                        <div
                            key={intervenant.id}
                            className="border rounded-lg p-4 shadow-sm"
                        >
                            <h3 className="font-semibold">
                                {intervenant.name} {intervenant.lastname}
                            </h3>
                            <p className="text-gray-600">{intervenant.email}</p>
                            <p className="text-sm text-gray-500">
                                Créé le: {new Date(intervenant.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

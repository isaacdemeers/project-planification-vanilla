'use client';

import { useEffect, useState } from 'react';
import { getIntervenants, deleteIntervenant, type Intervenant } from '@/lib/requests';
import UpdateIntervenant from './update';
import DeleteConfirmation from './delete';

interface IntervenantsListProps {
    refreshTrigger?: number;
}

export default function IntervenantsList({ refreshTrigger = 0 }: IntervenantsListProps) {
    const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingIntervenant, setEditingIntervenant] = useState<Intervenant | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

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

    useEffect(() => {
        fetchIntervenants();
    }, [refreshTrigger]);

    const handleDelete = async (id: string) => {
        try {
            await deleteIntervenant(id);
            setDeletingId(null);
            fetchIntervenants();
        } catch (error) {
            console.error('Error deleting intervenant:', error);
            // Optionnel : ajouter un état pour gérer l'erreur de suppression
        }
    };

    if (loading) {
        return <div className="text-center p-4">Chargement...</div>;
    }

    if (error) {
        return <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>;
    }

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Liste des intervenants</h2>

            {editingIntervenant && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-md w-full">
                        <UpdateIntervenant
                            intervenant={editingIntervenant}
                            onIntervenantUpdated={() => {
                                setEditingIntervenant(null);
                                fetchIntervenants();
                            }}
                            onCancel={() => setEditingIntervenant(null)}
                        />
                    </div>
                </div>
            )}

            <DeleteConfirmation
                isOpen={deletingId !== null}
                onConfirm={() => deletingId && handleDelete(deletingId)}
                onCancel={() => setDeletingId(null)}
            />

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
                            <p className="text-sm text-gray-500 mt-1">
                                Créé le: {new Date(intervenant.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-sm font-mono bg-gray-100 p-2 rounded mt-2 break-all">
                                Clé de connexion: {intervenant.connect_key}
                            </p>
                            <div className="mt-2 flex gap-2">
                                <button
                                    onClick={() => setEditingIntervenant(intervenant)}
                                    className="text-blue-500 hover:text-blue-600"
                                >
                                    Modifier
                                </button>
                                <button
                                    onClick={() => setDeletingId(intervenant.id)}
                                    className="text-red-500 hover:text-red-600"
                                >
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

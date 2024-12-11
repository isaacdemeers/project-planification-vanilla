'use client';

import { useEffect, useState } from 'react';
import { getIntervenants, deleteIntervenant, regenerateConnectKey, regenerateAllKeys, type Intervenant } from '@/lib/requests';
import UpdateIntervenant from './update';
import DeleteConfirmation from './delete';
import CopyLinkButton from './copy-link-button';

interface IntervenantsListProps {
    selectedId: string | null;
    onShowCalendar: (id: string) => void;
}

function getRemainingDays(createdAt: Date, validityDays: number): number {
    const now = new Date();
    const expirationDate = new Date(createdAt);
    expirationDate.setDate(expirationDate.getDate() + validityDays);
    const remainingTime = expirationDate.getTime() - now.getTime();
    return Math.ceil(remainingTime / (1000 * 60 * 60 * 24));
}

function KeyValidityStatus({ createdAt, validityDays }: { createdAt: Date, validityDays: number }) {
    const remainingDays = getRemainingDays(createdAt, validityDays);
    const isExpired = remainingDays <= 0;

    return (
        <p className={`text-xs ${isExpired ? 'text-red-500' : 'text-gray-500'}`}>
            {isExpired
                ? 'Clé expirée'
                : `Expire dans ${remainingDays} jour${remainingDays > 1 ? 's' : ''}`
            }
        </p>
    );
}

export default function IntervenantsList({ selectedId, onShowCalendar }: IntervenantsListProps) {
    const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingIntervenant, setEditingIntervenant] = useState<Intervenant | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [regeneratingAll, setRegeneratingAll] = useState(false);

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
    }, []);

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

    const handleRegenerateKey = async (id: string) => {
        try {
            const updatedIntervenant = await regenerateConnectKey(id);
            fetchIntervenants();
        } catch (error) {
            console.error('Error regenerating key:', error);
        }
    };

    const handleRegenerateAllKeys = async () => {
        try {
            setRegeneratingAll(true);
            await regenerateAllKeys();
            await fetchIntervenants();
        } catch (error) {
            console.error('Error regenerating all keys:', error);
        } finally {
            setRegeneratingAll(false);
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
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Liste des intervenants</h2>
                {intervenants.length > 0 && (
                    <button
                        onClick={handleRegenerateAllKeys}
                        disabled={regeneratingAll}
                        className={`bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${regeneratingAll ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                    >
                        {regeneratingAll ? 'Régénération...' : 'Régénérer toutes les clés'}
                    </button>
                )}
            </div>

            <div className="grid gap-4">
                {intervenants.map((intervenant) => (
                    <div
                        key={intervenant.id}
                        className="border rounded-lg p-4 shadow-sm"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-semibold">
                                    {intervenant.name} {intervenant.lastname}
                                </h3>
                                <p className="text-gray-600">{intervenant.email}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => onShowCalendar(intervenant.id)}
                                    className={`px-3 py-1 rounded-md text-sm ${selectedId === intervenant.id
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                        }`}
                                >
                                    {selectedId === intervenant.id ? 'Masquer' : 'Voir'} le calendrier
                                </button>
                                <button
                                    onClick={() => setEditingIntervenant(intervenant)}
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    Modifier
                                </button>
                                <button
                                    onClick={() => setDeletingId(intervenant.id)}
                                    className="text-red-600 hover:text-red-800"
                                >
                                    Supprimer
                                </button>
                            </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4">
                                <CopyLinkButton connectKey={intervenant.connect_key} />
                                <button
                                    onClick={() => handleRegenerateKey(intervenant.id)}
                                    className="text-gray-600 hover:text-gray-800"
                                >
                                    Réinitialiser la clé
                                </button>
                            </div>
                            <KeyValidityStatus
                                createdAt={new Date(intervenant.connect_key_created_at)}
                                validityDays={intervenant.connect_key_validity_days}
                            />
                        </div>
                    </div>
                ))}
            </div>

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
        </div>
    );
}

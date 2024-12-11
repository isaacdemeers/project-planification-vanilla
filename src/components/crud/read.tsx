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
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Liste des intervenants</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {intervenants.map((intervenant) => (
                    <div key={intervenant.id} className="bg-white p-4 rounded-lg shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-semibold">
                                    {intervenant.name} {intervenant.lastname}
                                </h3>
                                <p className="text-sm text-gray-600">{intervenant.email}</p>
                            </div>
                            <div className="space-x-2">
                                <button
                                    onClick={() => handleEdit(intervenant)}
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    Modifier
                                </button>
                                <button
                                    onClick={() => handleDelete(intervenant.id)}
                                    className="text-red-600 hover:text-red-800"
                                >
                                    Supprimer
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <button
                                onClick={() => handleResetKey(intervenant.id)}
                                className="text-sm text-gray-600 hover:text-gray-800"
                            >
                                Réinitialiser la clé
                            </button>
                            <button
                                onClick={() => onShowCalendar(intervenant.id)}
                                className={`px-3 py-1 rounded-md text-sm ${selectedId === intervenant.id
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                    }`}
                            >
                                {selectedId === intervenant.id ? 'Masquer' : 'Voir'} le calendrier
                            </button>
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

                            <div className="mt-2 space-y-2">
                                <p className="text-sm font-mono bg-gray-100 p-2 rounded break-all">
                                    Clé de connexion: {intervenant.connect_key}
                                </p>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-gray-500">
                                        Clé générée le: {new Date(intervenant.connect_key_created_at).toLocaleString()}
                                    </p>
                                    <CopyLinkButton connectKey={intervenant.connect_key} />
                                </div>
                                <KeyValidityStatus
                                    createdAt={new Date(intervenant.connect_key_created_at)}
                                    validityDays={intervenant.connect_key_validity_days}
                                />
                                <button
                                    onClick={() => handleRegenerateKey(intervenant.id)}
                                    className="text-sm text-blue-500 hover:text-blue-600"
                                >
                                    Régénérer la clé
                                </button>
                            </div>
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

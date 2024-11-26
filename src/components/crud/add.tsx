'use client';

import { useState } from 'react';
import { createIntervenant } from '@/lib/requests';

interface ErrorBannerProps {
    message: string;
    onClose: () => void;
}

function ErrorBanner({ message, onClose }: ErrorBannerProps) {
    return (
        <div className="fixed top-4 right-4 left-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex justify-between items-center shadow-lg">
            <span>{message}</span>
            <button
                onClick={onClose}
                className="text-red-700 font-bold hover:text-red-900"
            >
                ×
            </button>
        </div>
    );
}

export default function AddIntervenant({ onIntervenantAdded }: { onIntervenantAdded: () => void }) {
    const [formData, setFormData] = useState({
        name: '',
        lastname: '',
        email: '',
        availabilities: {},
        connect_key: crypto.randomUUID(),
        connect_key_validity_days: 30
    });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createIntervenant(formData);
            setSuccess(true);
            setError(null);
            // Reset form
            setFormData({
                name: '',
                lastname: '',
                email: '',
                availabilities: {},
                connect_key: crypto.randomUUID(),
                connect_key_validity_days: 30
            });
            onIntervenantAdded();
        } catch (err: any) {
            // Extraire le message d'erreur de la réponse de l'API si disponible
            const errorMessage = err.message || 'Erreur lors de la création de l\'intervenant';
            setError(errorMessage);
            setSuccess(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="max-w-md mx-auto p-6 relative">
            {error && (
                <ErrorBanner
                    message={error}
                    onClose={() => setError(null)}
                />
            )}

            <h2 className="text-2xl font-bold mb-4">Ajouter un intervenant</h2>

            {success && (
                <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
                    Intervenant créé avec succès!
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium">
                        Prénom
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label htmlFor="lastname" className="block text-sm font-medium">
                        Nom
                    </label>
                    <input
                        type="text"
                        id="lastname"
                        name="lastname"
                        value={formData.lastname}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium">
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    Ajouter
                </button>
            </form>
        </div>
    );
}

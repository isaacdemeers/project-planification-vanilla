'use client';

import { useState, useEffect } from 'react';

export default function KeyValiditySettings() {
    const [days, setDays] = useState(30);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/settings');
            const data = await response.json();
            setDays(data.days);
        } catch (error) {
            setError('Erreur lors du chargement des paramètres');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation de la durée
        if (days <= 0) {
            setError('La durée doit être supérieure à 0');
            return;
        }

        try {
            const response = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ days }),
            });
            if (!response.ok) throw new Error('Erreur lors de la mise à jour');
            setSuccess(true);
            setError(null);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            setError('Erreur lors de la mise à jour');
        }
    };

    const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        // Empêcher les valeurs négatives ou nulles
        if (value > 0) {
            setDays(value);
            setError(null);
        } else {
            setError('La durée doit être supérieure à 0');
        }
    };

    if (loading) return <div>Chargement...</div>;

    return (
        <div className="max-w-md mx-auto p-4">
            <h3 className="text-lg font-semibold mb-4">Durée de validité des clés</h3>
            {error && (
                <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
                    Paramètres mis à jour avec succès
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium">
                        Durée par défaut (jours)
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="365"
                        value={days}
                        onChange={handleDaysChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
                <button
                    type="submit"
                    disabled={days <= 0}
                    className={`w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${days <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    Enregistrer
                </button>
            </form>
        </div>
    );
} 
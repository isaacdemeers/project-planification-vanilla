/* eslint-disable quotes */
/* eslint-disable jsx-quotes */

import { useState } from 'react';
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react';

interface WorkweekEntry {
    week: number;
    hours: number;
}

interface WorkweekData {
    intervenant: string;
    workweek: WorkweekEntry[];
}

const EXAMPLE_JSON = `[
    {
        "intervenant": "intervenant.A@unilim.fr",
        "workweek": [
            { "week": 37, "hours": 4 },
            { "week": 38, "hours": 8 },
            { "week": 39, "hours": 12 }
        ]
    },
    {
        "intervenant": "intervenant.B@unilim.fr",
        "workweek": [
            { "week": 4, "hours": 5 },
            { "week": 5, "hours": 8 }
        ]
    }
]`;

export default function ImportWorkweek() {
    const [isOpen, setIsOpen] = useState(false);
    const [jsonText, setJsonText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const validateWorkweek = (workweek: WorkweekEntry[]): boolean => {
        return workweek.every(w =>
            typeof w === 'object' &&
            w !== null &&
            typeof w.week === 'number' &&
            typeof w.hours === 'number' &&
            w.week > 0 &&
            w.week <= 53 &&
            w.hours > 0
        );
    };

    const handleImport = async () => {
        try {
            setIsLoading(true);
            setError(null);
            setSuccess(false);

            let data: WorkweekData[];
            try {
                data = JSON.parse(jsonText);
            } catch (e) {
                throw new Error('Format JSON invalide. Veuillez vérifier la syntaxe.');
                console.error('Error parsing JSON:', e);
            }

            if (!Array.isArray(data)) {
                throw new Error('Le format doit être un tableau d\'objets');
            }

            // Valider la structure
            data.forEach((item, index) => {
                if (!item || typeof item !== 'object') {
                    throw new Error(`L'élément à l'index ${index} doit être un objet`);
                }
                if (typeof item.intervenant !== 'string' || !item.intervenant.includes('@')) {
                    throw new Error(`Email invalide pour l'intervenant à l'index ${index}`);
                }
                if (!Array.isArray(item.workweek)) {
                    throw new Error(`Workweek doit être un tableau à l'index ${index}`);
                }
                if (!validateWorkweek(item.workweek)) {
                    throw new Error(`Format workweek invalide à l'index ${index}. Chaque semaine doit avoir un numéro (1-53) et un nombre d'heures positif.`);
                }
            });

            // Envoyer les données
            const response = await fetch('/api/admin/import/workweek', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: jsonText,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erreur lors de l\'import');
            }

            setSuccess(true);
            setJsonText('');
            setTimeout(() => setIsOpen(false), 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de l\'import');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
                <Upload size={20} />
                Importer Workweeks
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Importer les workweeks</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ×
                            </button>
                        </div>

                        <div className="mb-4">
                            <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Format attendu :</h3>
                                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                    <li>Un tableau d&apos;objets</li>
                                    <li>Chaque objet doit contenir :</li>
                                    <ul className="ml-6 list-circle">
                                        <li>&quot;intervenant&quot;: email de l&apos;intervenant</li>
                                        <li>&quot;workweek&quot;: tableau des semaines</li>
                                    </ul>
                                    <li>Chaque semaine doit avoir :</li>
                                    <ul className="ml-6 list-circle">
                                        <li>&quot;week&quot;: numéro de semaine (1-53)</li>
                                        <li>&quot;hours&quot;: nombre d&apos;heures (&gt; 0)</li>
                                    </ul>
                                </ul>
                                <button
                                    onClick={() => setJsonText(EXAMPLE_JSON)}
                                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                                >
                                    Utiliser l&apos;exemple
                                </button>
                            </div>
                            <textarea
                                value={jsonText}
                                onChange={(e) => setJsonText(e.target.value)}
                                className="w-full h-96 font-mono text-sm p-4 border rounded-lg"
                                placeholder="Collez votre JSON ici..."
                            />
                        </div>

                        {error && (
                            <div className="mb-4 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded">
                                <AlertCircle size={20} />
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="mb-4 flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded">
                                <CheckCircle2 size={20} />
                                Import réussi !
                            </div>
                        )}

                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={isLoading}
                                className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                        Import en cours...
                                    </>
                                ) : (
                                    'Importer'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
} 
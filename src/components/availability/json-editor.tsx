'use client';

import { useState, useEffect } from 'react';

interface JsonEditorProps {
    initialValue: object;
    onSave: (newValue: object) => Promise<void>;
}

export default function JsonEditor({ initialValue, onSave }: JsonEditorProps) {
    const [jsonText, setJsonText] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Formater le JSON avec une indentation de 2 espaces
        setJsonText(JSON.stringify(initialValue, null, 2));
    }, [initialValue]);

    const handleSave = async () => {
        try {
            const parsedJson = JSON.parse(jsonText);
            await onSave(parsedJson);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Format JSON invalide');
        }
    };

    return (
        <div className="space-y-4">
            <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                className="w-full h-96 font-mono text-sm p-4 border rounded-lg"
                spellCheck={false}
            />
            {error && (
                <p className="text-red-500 text-sm">{error}</p>
            )}
            <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
                Sauvegarder
            </button>
        </div>
    );
}
'use client';

import { useState } from 'react';

interface JsonEditorProps {
    initialValue: object;
    onSave: (newValue: object) => Promise<void>;
}

export default function JsonEditor({ initialValue, onSave }: JsonEditorProps) {
    const [jsonText, setJsonText] = useState(JSON.stringify(initialValue, null, 2));
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSave = async () => {
        try {
            const parsedJson = JSON.parse(jsonText);
            await onSave(parsedJson);
            setIsEditing(false);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Invalid JSON format');
        }
    };

    const handleCancel = () => {
        setJsonText(JSON.stringify(initialValue, null, 2));
        setIsEditing(false);
        setError(null);
    };

    return (
        <div className="mb-4">
            {isEditing ? (
                <>
                    <textarea
                        value={jsonText}
                        onChange={(e) => setJsonText(e.target.value)}
                        className="w-full h-48 p-2 font-mono text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {error && (
                        <p className="text-red-500 text-sm mt-1">{error}</p>
                    )}
                    <div className="mt-2 flex gap-2">
                        <button
                            onClick={handleSave}
                            className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        >
                            Sauvegarder
                        </button>
                        <button
                            onClick={handleCancel}
                            className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                        >
                            Annuler
                        </button>
                    </div>
                </>
            ) : (
                <button
                    onClick={handleEdit}
                    className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                    Modifier les disponibilités
                </button>
            )}
        </div>
    );
}
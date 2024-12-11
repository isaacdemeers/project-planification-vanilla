'use client';

import { useState } from 'react';
import JsonEditor from './json-editor';

interface AdminEditorWrapperProps {
    initialValue: object;
    intervenantId: string;
}

export default function AdminEditorWrapper({ initialValue, intervenantId }: AdminEditorWrapperProps) {
    const handleSave = async (newValue: object) => {
        try {
            const response = await fetch(`/api/admin/intervenant/${intervenantId}/availabilities`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ availabilities: newValue }),
            });

            if (!response.ok) {
                throw new Error('Failed to update availabilities');
            }
        } catch (error) {
            console.error('Error saving availabilities:', error);
            throw error;
        }
    };

    return (
        <JsonEditor
            initialValue={initialValue}
            onSave={handleSave}
        />
    );
} 
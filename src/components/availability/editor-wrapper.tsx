'use client';

import { useState } from 'react';
import JsonEditor from './json-editor';
import { updateAvailabilities } from '@/lib/requests';

interface EditorWrapperProps {
    initialValue: object;
    intervenantId: string;
}

export default function EditorWrapper({ initialValue, intervenantId }: EditorWrapperProps) {
    const handleSave = async (newValue: object) => {
        try {
            await updateAvailabilities(intervenantId, newValue);
        } catch (error) {
            console.error('Error saving availabilities:', error);
        }
    };

    return (
        <JsonEditor
            initialValue={initialValue}
            onSave={handleSave}
        />
    );
} 
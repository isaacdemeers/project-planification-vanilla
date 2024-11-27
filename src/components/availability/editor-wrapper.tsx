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
        await updateAvailabilities(intervenantId, newValue);
    };

    return (
        <JsonEditor
            initialValue={initialValue}
            onSave={handleSave}
        />
    );
} 
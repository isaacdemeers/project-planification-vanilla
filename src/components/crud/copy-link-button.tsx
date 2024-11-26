'use client';

import { useState } from 'react';

interface CopyLinkButtonProps {
    connectKey: string;
}

export default function CopyLinkButton({ connectKey }: CopyLinkButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        const baseUrl = window.location.origin;
        const link = `${baseUrl}/availability?key=${connectKey}`;

        try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className={`text-sm ${copied
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white px-3 py-1 rounded-md transition-colors`}
        >
            {copied ? 'Lien copié !' : 'Copier le lien'}
        </button>
    );
} 
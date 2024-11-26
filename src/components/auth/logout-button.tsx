'use client';

import { signOut } from 'next-auth/react';

export default function LogoutButton() {
    return (
        <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-red-500 hover:text-red-600"
        >
            Se déconnecter
        </button>
    );
} 
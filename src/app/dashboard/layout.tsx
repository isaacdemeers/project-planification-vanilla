import React from 'react';
import LogoutButton from '@/components/auth/logout-button';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div>
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <LogoutButton />
                </div>
            </header>
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    );
} 
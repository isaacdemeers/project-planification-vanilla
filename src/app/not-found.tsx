import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="text-center p-8 bg-white rounded-lg shadow-md">
                <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
                <h2 className="text-2xl font-semibold text-gray-600 mb-4">
                    Page non trouvée
                </h2>
                <p className="text-gray-500 mb-8">
                    Désolé, la page que vous recherchez n&apos;existe pas ou a été déplacée.
                </p>
                <div className="flex gap-4 w-full justify-center">
                    <Link
                        href="/"
                        className="inline-block bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-colors"
                    >
                        Retour à l&apos;accueil
                    </Link>
                    <Link
                        href="/dashboard"
                        className="inline-block bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-colors"
                    >
                        Retour au dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
} 
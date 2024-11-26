'use client';

interface DeleteConfirmationProps {
    onConfirm: () => void;
    onCancel: () => void;
    isOpen: boolean;
}

export default function DeleteConfirmation({
    onConfirm,
    onCancel,
    isOpen
}: DeleteConfirmationProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                <h2 className="text-xl font-bold mb-4">Confirmer la suppression</h2>
                <p className="text-gray-600 mb-6">
                    Êtes-vous sûr de vouloir supprimer cet intervenant ? Cette action est irréversible.
                </p>
                <div className="flex gap-4">
                    <button
                        onClick={onConfirm}
                        className="flex-1 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                        Supprimer
                    </button>
                    <button
                        onClick={onCancel}
                        className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                        Annuler
                    </button>
                </div>
            </div>
        </div>
    );
} 
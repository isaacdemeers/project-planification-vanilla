import { NextResponse } from 'next/server';
import db from '@/lib/db.server';

export async function GET() {
    try {
        const client = await db.connect();
        try {
            const result = await client.query(
                'SELECT name, lastname, availabilities FROM "Intervenant"'
            );

            // Formater les données selon le format demandé
            const formattedData = result.rows.reduce((acc: any, intervenant) => {
                const intervenantName = `${intervenant.name} ${intervenant.lastname}`;

                // Si les disponibilités sont vides, ne pas inclure l'intervenant
                if (!intervenant.availabilities || Object.keys(intervenant.availabilities).length === 0) {
                    return acc;
                }

                // Si les disponibilités ont une structure "default", garder la structure
                if (intervenant.availabilities.default) {
                    acc[intervenantName] = intervenant.availabilities;
                } else {
                    // Sinon, mettre les disponibilités directement dans un tableau
                    acc[intervenantName] = Object.values(intervenant.availabilities)
                        .flat()
                        .filter(Boolean);
                }

                return acc;
            }, {});

            return NextResponse.json(formattedData);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error exporting data:', error);
        return NextResponse.json(
            { error: 'Failed to export data' },
            { status: 500 }
        );
    }
} 
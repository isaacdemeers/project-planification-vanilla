import { NextResponse } from 'next/server';
import db from '@/lib/db.server';
import { AvailabilityPeriod, Availability } from '@/lib/calendar-utils';

interface ExportData {
    [intervenantName: string]: {
        availabilities: AvailabilityPeriod | Availability[];
        last_update: string;
    };
}

export async function GET() {
    try {
        const client = await db.connect();
        try {
            const result = await client.query(
                'SELECT name, lastname, availabilities, last_availability_update FROM "Intervenant"'
            );

            // Formater les données selon le format demandé
            const formattedData = {
                export_date: new Date().toISOString(),
                intervenants: result.rows.reduce((acc: ExportData, intervenant) => {
                    const intervenantName = `${intervenant.name} ${intervenant.lastname}`;

                    // Si les disponibilités sont vides, ne pas inclure l'intervenant
                    if (!intervenant.availabilities || Object.keys(intervenant.availabilities).length === 0) {
                        return acc;
                    }

                    acc[intervenantName] = {
                        availabilities: intervenant.availabilities.default
                            ? intervenant.availabilities
                            : Object.values(intervenant.availabilities).flat().filter(Boolean),
                        last_update: intervenant.last_availability_update
                    };

                    return acc;
                }, {})
            };

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
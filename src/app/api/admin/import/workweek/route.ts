import { NextResponse } from 'next/server';
import db from '@/lib/db.server';

interface WorkWeek {
    week: number;
    hours: number;
}

interface WorkloadImport {
    intervenant: string;
    workweek: WorkWeek[];
}

export async function POST(request: Request) {
    try {
        const workloads: WorkloadImport[] = await request.json();
        const client = await db.connect();

        try {
            // Commencer une transaction
            await client.query('BEGIN');

            for (const workload of workloads) {
                // Mettre à jour le workweek pour chaque intervenant
                const result = await client.query(
                    `UPDATE "Intervenant"
                     SET workweek = $1
                     WHERE email = $2
                     RETURNING id, name, lastname, email`,
                    [JSON.stringify(workload.workweek), workload.intervenant]
                );

                if (result.rowCount === 0) {
                    // Si l'intervenant n'est pas trouvé, on continue avec le suivant
                    console.warn(`Intervenant non trouvé: ${workload.intervenant}`);
                    continue;
                }
            }

            // Valider la transaction
            await client.query('COMMIT');

            return NextResponse.json({
                message: 'Import réussi',
                success: true
            });
        } catch (error) {
            // En cas d'erreur, annuler la transaction
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error importing workweeks:', error);
        return NextResponse.json(
            {
                error: 'Failed to import workweeks',
                success: false,
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 
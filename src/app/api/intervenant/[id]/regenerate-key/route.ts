import { NextResponse } from 'next/server';
import db from '@/lib/db.server';
import { randomBytes } from 'crypto';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    let client;
    try {
        client = await db.connect();

        // Récupérer la durée de validité par défaut des paramètres
        const settingsResult = await client.query(
            'SELECT value FROM "Settings" WHERE key = $1',
            ['default_key_validity']
        );
        const validityDays = settingsResult.rows[0]?.value?.days || 30;

        // Générer une nouvelle clé unique et mettre à jour l'intervenant
        const result = await client.query(`
            UPDATE "Intervenant"
            SET 
                connect_key = gen_random_uuid(),
                connect_key_created_at = CURRENT_TIMESTAMP,
                connect_key_validity_days = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `, [params.id, validityDays]);

        if (result.rowCount === 0) {
            return NextResponse.json(
                { error: 'Intervenant not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Error regenerating key:', error);
        return NextResponse.json(
            { error: 'Failed to regenerate key', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    } finally {
        if (client) client.release();
    }
} 
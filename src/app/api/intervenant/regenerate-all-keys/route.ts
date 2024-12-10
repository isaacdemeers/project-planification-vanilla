import { NextResponse } from 'next/server';
import db from '@/lib/db.server';

export async function POST() {
    let client;
    try {
        client = await db.connect();

        // Récupérer la durée de validité par défaut
        const settingsResult = await client.query(
            'SELECT value FROM "Settings" WHERE key = $1',
            ['default_key_validity']
        );
        const validityDays = settingsResult.rows[0]?.value?.days || 30;

        // Mettre à jour toutes les clés
        const result = await client.query(`
            UPDATE "Intervenant"
            SET 
                connect_key = gen_random_uuid(),
                connect_key_created_at = CURRENT_TIMESTAMP,
                connect_key_validity_days = $1,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `, [validityDays]);

        return NextResponse.json({
            message: 'All keys regenerated successfully',
            intervenants: result.rows,
            validityDays
        });
    } catch (error) {
        console.error('Error regenerating all keys:', error);
        return NextResponse.json(
            { error: 'Failed to regenerate keys', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    } finally {
        if (client) client.release();
    }
} 
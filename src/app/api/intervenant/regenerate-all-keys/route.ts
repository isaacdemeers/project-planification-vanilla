import { NextResponse } from 'next/server';
import db from '@/lib/db.server';

export async function POST() {
    try {
        const client = await db.connect();
        try {
            const settingsResult = await client.query(
                'SELECT value FROM "Settings" WHERE key = $1',
                ['default_key_validity']
            );
            const defaultValidity = settingsResult.rows[0]?.value?.days || 30;

            const result = await client.query(
                `UPDATE "Intervenant"
                 SET connect_key = gen_random_uuid(),
                     connect_key_created_at = CURRENT_TIMESTAMP,
                     connect_key_validity_days = $1
                 RETURNING *`,
                [defaultValidity]
            );

            return NextResponse.json(result.rows);
        } catch (error) {
            console.error('Database error:', error);
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error in POST:', error);
        return NextResponse.json(
            { error: 'Failed to regenerate all keys', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
} 
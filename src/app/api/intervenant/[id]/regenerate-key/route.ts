import { NextResponse } from 'next/server';
import db from '@/lib/db.server';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
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
                     connect_key_validity_days = $2
                 WHERE id = $1
                 RETURNING *`,
                [id, defaultValidity]
            );

            if (result.rowCount === 0) {
                return NextResponse.json(
                    { error: 'Intervenant not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json(result.rows[0]);
        } catch (error: any) {
            console.error('Database error:', error);
            throw error;
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Error in POST:', error);
        return NextResponse.json(
            { error: 'Failed to regenerate connect key', details: error.message },
            { status: 500 }
        );
    }
} 
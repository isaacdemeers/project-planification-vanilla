import { NextResponse } from 'next/server';
import db from '@/lib/db.server';
import { randomBytes } from 'crypto';

export async function POST(request: Request) {
    let client;
    try {
        const { validityDays } = await request.json();
        client = await db.connect();

        // Générer de nouvelles clés pour tous les intervenants
        const result = await client.query(`
            UPDATE "Intervenant"
            SET connect_key = $1,
                connect_key_created_at = CURRENT_TIMESTAMP,
                connect_key_validity_days = $2
            RETURNING *
        `, [randomBytes(32).toString('hex'), validityDays]);

        return NextResponse.json({
            message: 'All keys regenerated successfully',
            validityDays,
            intervenants: result.rows
        });
    } catch (error) {
        console.error('Error regenerating keys:', error);
        return NextResponse.json(
            { error: 'Failed to regenerate keys', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    } finally {
        if (client) client.release();
    }
} 
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
            const result = await client.query(
                `UPDATE "Intervenant"
                 SET connect_key = gen_random_uuid(),
                     connect_key_created_at = CURRENT_TIMESTAMP
                 WHERE id = $1
                 RETURNING *`,
                [id]
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
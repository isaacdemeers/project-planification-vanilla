import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db.server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params; // Attendre la résolution de la promesse pour obtenir l'ID
        const client = await db.connect();
        try {
            const result = await client.query(
                'SELECT * FROM "Intervenant" WHERE id = $1',
                [id]
            );

            if (result.rows.length === 0) {
                return NextResponse.json(
                    { error: 'Intervenant not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json(result.rows[0]);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error fetching availabilities:', error);
        return NextResponse.json(
            { error: 'Failed to fetch availabilities' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params; // Attendre la résolution de la promesse pour obtenir l'ID
        const { availabilities } = await request.json();
        const client = await db.connect();

        try {
            const columnExists = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'Intervenant' 
                    AND column_name = 'last_availability_update'
                );
            `);

            const updateQuery = columnExists.rows[0].exists
                ? `UPDATE "Intervenant"
                   SET availabilities = $1,
                       last_availability_update = CURRENT_TIMESTAMP
                   WHERE id = $2
                   RETURNING *`
                : `UPDATE "Intervenant"
                   SET availabilities = $1
                   WHERE id = $2
                   RETURNING *`;

            const result = await client.query(updateQuery, [availabilities, id]);

            if (result.rowCount === 0) {
                return NextResponse.json(
                    { error: 'Intervenant not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json(result.rows[0]);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error in PUT:', error);
        return NextResponse.json(
            { error: 'Failed to update availabilities', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

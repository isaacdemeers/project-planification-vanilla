import { NextResponse } from 'next/server';
import db from '@/lib/db.server';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const client = await db.connect();
        try {
            const result = await client.query(
                'SELECT * FROM "Intervenant" WHERE id = $1',
                [params.id]
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
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { availabilities } = await request.json();
        const client = await db.connect();

        try {
            const result = await client.query(
                `UPDATE "Intervenant"
                 SET availabilities = $1
                 WHERE id = $2
                 RETURNING *`,
                [availabilities, params.id]
            );

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
    } catch (error: any) {
        console.error('Error in PUT:', error);
        return NextResponse.json(
            { error: 'Failed to update availabilities', details: error.message },
            { status: 500 }
        );
    }
} 
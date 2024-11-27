import { NextResponse } from 'next/server';
import { validateConnectKey } from '@/lib/auth-key';
import db from '@/lib/db.server';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const result = await validateConnectKey(params.id);

        if (result.type === 'error') {
            return NextResponse.json({ error: result.code }, { status: 401 });
        }

        return NextResponse.json({
            availabilities: result.intervenant.availabilities
        });
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
        const id = params.id;
        const { availabilities } = await request.json();

        const client = await db.connect();
        try {
            const result = await client.query(
                `UPDATE "Intervenant"
                 SET availabilities = $1
                 WHERE id = $2
                 RETURNING *`,
                [availabilities, id]
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
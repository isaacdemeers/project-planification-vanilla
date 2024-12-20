import { NextResponse } from 'next/server';
import { validateConnectKey } from '@/lib/auth-key';
import db from '@/lib/db.server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params; // Attendre la résolution de la promesse pour obtenir l'ID
        const result = await validateConnectKey(id);

        if (result.type === 'error') {
            return NextResponse.json({ error: result.code }, { status: 401 });
        }

        return NextResponse.json(result.intervenant);
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
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params; // Attendre la résolution de la promesse pour obtenir l'ID
        const { availabilities } = await request.json();

        const validationResult = await validateConnectKey(id);
        if (validationResult.type === 'error') {
            return NextResponse.json({ error: validationResult.code }, { status: 401 });
        }

        const client = await db.connect();
        try {
            const result = await client.query(
                `UPDATE "Intervenant"
                 SET availabilities = $1
                 WHERE id = $2
                 RETURNING *`,
                [availabilities, validationResult.intervenant.id]
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
    } catch (error) {
        console.error('Error in PUT:', error);
        return NextResponse.json(
            { error: 'Failed to update availabilities', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

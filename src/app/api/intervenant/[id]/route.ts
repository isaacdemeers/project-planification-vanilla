import { NextResponse } from 'next/server';
import db from '@/lib/db.server';

interface DatabaseError extends Error {
    code?: string;
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const body = await request.json();
        console.log('Update body:', body);

        const updateFields = [];
        const values = [];
        let valueIndex = 1;

        // Construire dynamiquement la requête UPDATE
        if (body.name !== undefined) {
            updateFields.push(`name = $${valueIndex}`);
            values.push(body.name);
            valueIndex++;
        }
        if (body.lastname !== undefined) {
            updateFields.push(`lastname = $${valueIndex}`);
            values.push(body.lastname);
            valueIndex++;
        }
        if (body.email !== undefined) {
            updateFields.push(`email = $${valueIndex}`);
            values.push(body.email);
            valueIndex++;
        }
        if (body.availabilities !== undefined) {
            updateFields.push(`availabilities = $${valueIndex}`);
            values.push(body.availabilities);
            valueIndex++;
        }

        // Ajouter automatiquement updated_at
        updateFields.push('updated_at = CURRENT_TIMESTAMP');

        if (updateFields.length === 0) {
            return NextResponse.json(
                { error: 'No fields to update' },
                { status: 400 }
            );
        }

        const client = await db.connect();
        try {
            const result = await client.query(
                `UPDATE "Intervenant"
                 SET ${updateFields.join(', ')}
                 WHERE id = $${valueIndex}
                 RETURNING *`,
                [...values, id]
            );

            if (result.rowCount === 0) {
                return NextResponse.json(
                    { error: 'Intervenant not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json(result.rows[0]);
        } catch (error) {
            console.error('Database error:', error);
            if (error instanceof Error && 'code' in error && (error as DatabaseError).code === '23505') {
                return NextResponse.json(
                    { error: 'Email already exists' },
                    { status: 400 }
                );
            }
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error in PUT:', error);
        return NextResponse.json(
            { error: 'Failed to update intervenant', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const client = await db.connect();
        try {
            const result = await client.query(
                'DELETE FROM "Intervenant" WHERE id = $1 RETURNING *',
                [id]
            );

            if (result.rowCount === 0) {
                return NextResponse.json(
                    { error: 'Intervenant not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json(result.rows[0]);
        } catch (error: Error | unknown) {
            console.error('Database error:', error);
            throw error;
        } finally {
            client.release();
        }
    } catch (error: Error | unknown) {
        console.error('Error in DELETE:', error);
        return NextResponse.json(
            { error: 'Failed to delete intervenant', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
} 
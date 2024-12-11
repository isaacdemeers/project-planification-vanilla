import { NextResponse } from 'next/server';
import db from '@/lib/db.server';

// GET - Récupérer les disponibilités
export async function GET(request: Request, { params }: { params: { id: string } }) {
    const client = await db.connect();
    try {
        const result = await client.query(
            'SELECT id, name, lastname, availabilities FROM "Intervenant" WHERE connect_key = $1',
            [params.id]
        );
        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Intervenant not found' }, { status: 404 });
        }
        return NextResponse.json(result.rows[0]);
    } finally {
        client.release();
    }
}

// POST - Ajouter une disponibilité
export async function POST(request: Request, { params }: { params: { id: string } }) {
    const { weekKey, availability } = await request.json();
    const client = await db.connect();

    try {
        const currentResult = await client.query(
            'SELECT availabilities FROM "Intervenant" WHERE connect_key = $1',
            [params.id]
        );

        const currentAvailabilities = currentResult.rows[0]?.availabilities || {};
        if (!currentAvailabilities[weekKey]) {
            currentAvailabilities[weekKey] = [];
        }
        currentAvailabilities[weekKey].push(availability);

        const result = await client.query(
            `UPDATE "Intervenant"
             SET availabilities = $1
             WHERE connect_key = $2
             RETURNING availabilities`,
            [currentAvailabilities, params.id]
        );

        return NextResponse.json(result.rows[0].availabilities);
    } finally {
        client.release();
    }
}

// PUT - Mettre à jour toutes les disponibilités
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const { availabilities } = await request.json();
    const client = await db.connect();

    try {
        const result = await client.query(
            `UPDATE "Intervenant"
             SET availabilities = $1
             WHERE connect_key = $2
             RETURNING id, name, lastname, availabilities`,
            [availabilities, params.id]
        );

        if (result.rowCount === 0) {
            return NextResponse.json({ error: 'Intervenant not found' }, { status: 404 });
        }

        return NextResponse.json(result.rows[0]);
    } finally {
        client.release();
    }
}

// DELETE - Supprimer une disponibilité
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const { weekKey, index } = await request.json();
    const client = await db.connect();

    try {
        const currentResult = await client.query(
            'SELECT availabilities FROM "Intervenant" WHERE connect_key = $1',
            [params.id]
        );

        const currentAvailabilities = currentResult.rows[0]?.availabilities || {};
        if (currentAvailabilities[weekKey]) {
            currentAvailabilities[weekKey].splice(index, 1);
            if (currentAvailabilities[weekKey].length === 0) {
                delete currentAvailabilities[weekKey];
            }
        }

        const result = await client.query(
            `UPDATE "Intervenant"
             SET availabilities = $1
             WHERE connect_key = $2
             RETURNING availabilities`,
            [currentAvailabilities, params.id]
        );

        return NextResponse.json(result.rows[0].availabilities);
    } finally {
        client.release();
    }
} 
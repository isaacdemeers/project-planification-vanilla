import { NextResponse } from 'next/server';
import db from '@/lib/db.server';

export async function GET() {
    try {
        const client = await db.connect();
        const result = await client.query(
            'SELECT value FROM "Settings" WHERE key = $1',
            ['default_key_validity']
        );
        client.release();

        return NextResponse.json({ days: result.rows[0]?.value?.days || 30 });
    } catch (error) {
        console.error('Error getting key validity:', error);
        return NextResponse.json(
            { error: 'Failed to get key validity' },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    let client;
    try {
        const { days } = await request.json();

        if (!days || days <= 0) {
            return NextResponse.json(
                { error: 'Invalid validity days' },
                { status: 400 }
            );
        }

        client = await db.connect();

        // Mettre à jour le paramètre de validité par défaut
        await client.query(
            `INSERT INTO "Settings" (key, value)
             VALUES ($1, $2)
             ON CONFLICT (key) DO UPDATE
             SET value = $2`,
            ['default_key_validity', { days }]
        );

        return NextResponse.json({ days });
    } catch (error) {
        console.error('Error updating key validity:', error);
        return NextResponse.json(
            { error: 'Failed to update key validity' },
            { status: 500 }
        );
    } finally {
        if (client) client.release();
    }
} 
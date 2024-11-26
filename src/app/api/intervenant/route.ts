import { NextResponse } from 'next/server';
import db from '@/lib/db.server';
import { Intervenant } from '@/lib/requests';

export async function GET() {
    try {
        const client = await db.connect();
        const result = await client.query('SELECT * FROM "Intervenant"');
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Failed to fetch intervenants' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const client = await db.connect();
        const result = await client.query(
            `INSERT INTO "Intervenant" (name, lastname, availabilities, email)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [body.name, body.lastname, body.availabilities, body.email]
        );
        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Failed to create intervenant' }, { status: 500 });
    }
} 
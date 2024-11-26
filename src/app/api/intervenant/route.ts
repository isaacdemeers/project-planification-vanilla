import { NextResponse } from 'next/server';
import db from '@/lib/db.server';
import { Intervenant } from '@/lib/requests';

async function ensureTableExists() {
    try {
        const client = await db.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS "Intervenant" (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                lastname VARCHAR(255) NOT NULL,
                availabilities JSONB NOT NULL DEFAULT '{}',
                email VARCHAR(255) NOT NULL UNIQUE,
                connect_key UUID NOT NULL DEFAULT gen_random_uuid(),
                connect_key_created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                connect_key_validity_days INTEGER NOT NULL DEFAULT 30,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        client.release();
    } catch (error) {
        console.error('Error ensuring table exists:', error);
        throw error;
    }
}

export async function GET() {
    try {
        await ensureTableExists();
        const client = await db.connect();
        const result = await client.query('SELECT * FROM "Intervenant"');
        client.release();
        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error('Error in GET:', error);
        return NextResponse.json({ error: 'Failed to fetch intervenants', details: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await ensureTableExists();
        const body = await request.json();
        console.log('Received body:', body);

        if (!body.name || !body.lastname || !body.email) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const client = await db.connect();
        try {
            const result = await client.query(
                `INSERT INTO "Intervenant" (name, lastname, availabilities, email)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [body.name, body.lastname, body.availabilities || {}, body.email]
            );
            return NextResponse.json(result.rows[0]);
        } catch (error: any) {
            console.error('Database error:', error);
            if (error.code === '23505') {
                return NextResponse.json(
                    { error: 'Email already exists' },
                    { status: 400 }
                );
            }
            throw error;
        } finally {
            client.release();
        }
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Failed to create intervenant', details: error.message },
            { status: 500 }
        );
    }
} 
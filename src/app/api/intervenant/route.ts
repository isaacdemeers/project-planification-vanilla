import { NextResponse } from 'next/server';
import db from '@/lib/db.server';
import { Intervenant } from '@/lib/requests';

async function ensureTableExists() {
    try {
        const client = await db.connect();
        await client.query(`
            -- Créer la table si elle n'existe pas
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

            -- Ajouter la colonne last_availability_update si elle n'existe pas
            DO $$ 
            BEGIN 
                BEGIN
                    ALTER TABLE "Intervenant" 
                    ADD COLUMN last_availability_update TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
                EXCEPTION 
                    WHEN duplicate_column THEN 
                        NULL;
                END;
            END $$;

            -- Mettre à jour les enregistrements existants qui n'ont pas de date de dernière modification
            UPDATE "Intervenant"
            SET last_availability_update = CURRENT_TIMESTAMP
            WHERE last_availability_update IS NULL;
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
            const settingsResult = await client.query(
                'SELECT value FROM "Settings" WHERE key = $1',
                ['default_key_validity']
            );
            const defaultValidity = settingsResult.rows[0]?.value?.days || 30;

            const result = await client.query(
                `INSERT INTO "Intervenant" (
                    name, lastname, availabilities, email, connect_key_validity_days
                )
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *`,
                [body.name, body.lastname, body.availabilities || {}, body.email, defaultValidity]
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
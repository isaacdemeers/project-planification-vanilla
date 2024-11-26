import { NextResponse } from 'next/server';
import db from '@/lib/db.server';

async function ensureSettingsTableExists() {
    try {
        const client = await db.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS "Settings" (
                key VARCHAR(255) PRIMARY KEY,
                value JSONB NOT NULL
            );
            INSERT INTO "Settings" (key, value)
            VALUES ('default_key_validity', '{"days": 30}')
            ON CONFLICT (key) DO NOTHING;
        `);
        client.release();
    } catch (error) {
        console.error('Error ensuring settings table exists:', error);
        throw error;
    }
}

export async function GET() {
    try {
        await ensureSettingsTableExists();
        const client = await db.connect();
        const result = await client.query(
            'SELECT value FROM "Settings" WHERE key = $1',
            ['default_key_validity']
        );
        client.release();
        return NextResponse.json(result.rows[0]?.value || { days: 30 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const client = await db.connect();
        await client.query(
            'UPDATE "Settings" SET value = $1 WHERE key = $2',
            [{ days: body.days }, 'default_key_validity']
        );
        client.release();
        return NextResponse.json({ days: body.days });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
} 
import { NextResponse } from 'next/server';
import db from '@/lib/db.server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
        return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 });
    }

    const client = await db.connect();
    try {
        const result = await client.query(
            `SELECT id, name, lastname 
             FROM "Intervenant" 
             WHERE connect_key = $1 
             AND connect_key_created_at + (connect_key_validity_days || ' days')::interval > NOW()`,
            [key]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Invalid or expired key' }, { status: 401 });
        }

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            { error: 'Failed to validate key' },
            { status: 500 }
        );
    } finally {
        client.release();
    }
} 
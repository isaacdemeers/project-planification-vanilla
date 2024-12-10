import { NextResponse } from 'next/server';
import db from '@/lib/db.server';

export async function DELETE(request: Request) {
    let client;
    try {
        client = await db.connect();
        await client.query('DELETE FROM admin');
        return NextResponse.json({ message: 'Admin account deleted successfully' });
    } catch (error) {
        console.error('Delete admin error:', error);
        return NextResponse.json(
            { error: 'Failed to delete admin account', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    } finally {
        if (client) client.release();
    }
} 
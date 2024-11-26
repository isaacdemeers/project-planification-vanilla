import { NextResponse } from 'next/server';
import { hashPassword, generateSalt } from '@/lib/password';
import db from '@/lib/db.server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, password } = body;

        // Vérifier si l'email existe déjà
        const existingUser = await db.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return NextResponse.json(
                { error: 'Cet email est déjà utilisé' },
                { status: 400 }
            );
        }

        // Créer le nouvel utilisateur
        const salt = generateSalt();
        const hash = await hashPassword(password, salt);

        const result = await db.query(
            `INSERT INTO users (name, email, password_hash, password_salt)
             VALUES ($1, $2, $3, $4)
             RETURNING id, name, email`,
            [name, email, hash, salt]
        );

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Erreur lors de l\'inscription' },
            { status: 500 }
        );
    }
} 
import { Pool } from 'pg';

const db = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
});

async function initAuthTables() {
    try {
        const client = await db.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS verification_token (
                identifier TEXT NOT NULL,
                expires TIMESTAMPTZ NOT NULL,
                token TEXT NOT NULL,
                PRIMARY KEY (identifier, token)
            );

            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255),
                email VARCHAR(255) UNIQUE,
                "emailVerified" TIMESTAMPTZ,
                image TEXT,
                password_hash TEXT,
                password_salt TEXT
            );

            CREATE TABLE IF NOT EXISTS accounts (
                id SERIAL PRIMARY KEY,
                "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                type VARCHAR(255) NOT NULL,
                provider VARCHAR(255) NOT NULL,
                "providerAccountId" VARCHAR(255) NOT NULL,
                refresh_token TEXT,
                access_token TEXT,
                expires_at BIGINT,
                id_token TEXT,
                scope TEXT,
                session_state TEXT,
                token_type TEXT,
                UNIQUE(provider, "providerAccountId")
            );

            CREATE TABLE IF NOT EXISTS sessions (
                id SERIAL PRIMARY KEY,
                "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                expires TIMESTAMPTZ NOT NULL,
                "sessionToken" VARCHAR(255) NOT NULL UNIQUE
            );
        `);
        client.release();
        console.log('Auth tables initialized successfully');
    } catch (error) {
        console.error('Error initializing auth tables:', error);
        throw error;
    }
}

// Initialiser les tables au démarrage
initAuthTables().catch(console.error);

export default db; 
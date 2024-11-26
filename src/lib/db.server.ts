import { Pool } from 'pg';

// Cette configuration ne sera utilisée que côté serveur
const db = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
});

export default db; 
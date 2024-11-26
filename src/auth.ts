import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { hashPassword, verifyPassword, generateSalt } from "@/lib/password"
import { signInSchema } from "./lib/zod"
import PostgresAdapter from "@auth/pg-adapter"
import db from "@/lib/db.server"

export const config = {
    runtime: 'nodejs',
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: PostgresAdapter(db),
    providers: [
        Credentials({
            credentials: {
                email: {},
                password: {},
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const { email, password } = await signInSchema.parseAsync(credentials)

                // Vérifier l'utilisateur existant
                const user = await db.query(
                    'SELECT * FROM users WHERE email = $1',
                    [email]
                ).then(res => res.rows[0]);

                if (!user) return null;

                // Vérifier le mot de passe
                const isValid = await verifyPassword(
                    password,
                    user.password_salt,
                    user.password_hash
                );

                if (!isValid) return null;

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name
                };
            },
        }),
    ],
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: 'jwt'
    }
})
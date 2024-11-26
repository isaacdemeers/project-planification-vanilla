import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { hashPassword, verifyPassword, generateSalt } from "@/lib/password"
import { signInSchema } from "./lib/zod"
import { authConfig } from "./app/api/auth/[...nextauth]/config"
import db from "@/lib/db.server"

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const { email, password } = await signInSchema.parseAsync(credentials)

                const user = await db.query(
                    'SELECT * FROM users WHERE email = $1',
                    [email]
                ).then(res => res.rows[0]);

                if (!user) return null;

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
})
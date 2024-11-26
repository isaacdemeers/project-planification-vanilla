import NextAuth from "next-auth";
import { authConfig } from "./app/api/auth/[...nextauth]/config";

export const { auth: middleware } = NextAuth(authConfig);

// Configurer les routes à protéger
export const config = {
    matcher: ['/dashboard/:path*']
}; 
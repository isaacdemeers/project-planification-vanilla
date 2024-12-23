import NextAuth from "next-auth";
import { authConfig } from "./app/api/auth/[...nextauth]/config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/api/admin/:path*"
    ]
}; 
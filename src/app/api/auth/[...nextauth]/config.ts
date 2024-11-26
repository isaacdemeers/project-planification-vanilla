import { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isAuthPage = nextUrl.pathname.startsWith('/login') ||
                nextUrl.pathname.startsWith('/register');

            if (isAuthPage) {
                if (isLoggedIn) return Response.redirect(new URL('/dashboard', nextUrl));
                return true;
            }

            if (!isLoggedIn && nextUrl.pathname.startsWith('/dashboard')) {
                return false;
            }

            return true;
        },
    },
    providers: [], // sera configuré dans auth.ts
}; 
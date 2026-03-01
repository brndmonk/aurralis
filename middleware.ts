import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
    if (!req.auth) {
        const { pathname } = req.nextUrl;

        // API routes → return 401 JSON (not an HTML redirect)
        if (pathname.startsWith("/api/")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Dashboard pages → redirect to login
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
});

export const config = {
    // Protect dashboard routes and admin API routes.
    // Excludes /api/auth (NextAuth handlers) and /api/mobile (mobile app routes
    // secured by their own token-based auth).
    matcher: ["/dashboard/:path*", "/api/((?!auth|mobile).*)"],
};

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                if (!credentials?.email || !credentials?.password) return null;

                const adminEmail = process.env.ADMIN_EMAIL;
                const adminHash = process.env.ADMIN_PASSWORD_HASH;

                if (!adminEmail || !adminHash) return null;

                if (
                    (credentials.email as string).toLowerCase() !==
                    adminEmail.toLowerCase()
                )
                    return null;

                const valid = await compare(
                    credentials.password as string,
                    adminHash
                );
                if (!valid) return null;

                return { id: "admin", email: adminEmail, name: "Administrator" };
            },
        }),
    ],
    pages: { signIn: "/login" },
    session: { strategy: "jwt" },
});

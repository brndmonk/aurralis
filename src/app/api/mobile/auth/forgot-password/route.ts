import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend, FROM_EMAIL } from "@/lib/resend";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "aurralismontessori@gmail.com";

// Generic success message — never reveal whether the email exists
const GENERIC_RESPONSE = {
    message: "If this email is registered, the school admin will contact you shortly.",
};

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email || typeof email !== "string") {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Look up the parent — silently do nothing if not found
        const student = await prisma.student.findFirst({
            where: { parentEmail: { equals: normalizedEmail, mode: "insensitive" } },
            select: { parentName: true, parentEmail: true, name: true },
        });

        if (student) {
            // Notify admin to manually reset the password
            await resend.emails.send({
                from: FROM_EMAIL,
                to: ADMIN_EMAIL,
                subject: "Password Reset Request — Aurralis Mobile App",
                html: `
                    <p>A parent has requested a password reset via the mobile app.</p>
                    <p><strong>Parent name:</strong> ${student.parentName || "N/A"}</p>
                    <p><strong>Parent email:</strong> ${student.parentEmail || normalizedEmail}</p>
                    <p><strong>Child name:</strong> ${student.name}</p>
                    <p>Please log in to the admin panel and send them new credentials.</p>
                    <p><a href="https://admin.aurralismontessori.com/dashboard/students">Go to Dashboard</a></p>
                `,
            });
        }

        // Always return the same response to prevent email enumeration
        return NextResponse.json(GENERIC_RESPONSE);
    } catch (error) {
        console.error("Forgot password error:", error);
        // Still return generic response to avoid leaking errors
        return NextResponse.json(GENERIC_RESPONSE);
    }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

/**
 * POST /api/mobile/teacher/login
 * Body: { email, password }
 * Authenticates a teacher (User with role=TEACHER) and returns session data
 * including all classes they teach.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        const normalizedEmail = email.toLowerCase().trim();

        const user = await prisma.user.findFirst({
            where: {
                email: { equals: normalizedEmail, mode: "insensitive" },
                role: "TEACHER",
            },
            select: {
                id: true,
                name: true,
                email: true,
                passwordHash: true,
                classes: {
                    include: {
                        _count: { select: { students: true } },
                    },
                    orderBy: { name: "asc" },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        if (!user.passwordHash) {
            return NextResponse.json({ error: "Account not activated. Please contact the administrator." }, { status: 401 });
        }
        const valid = await compare(password, user.passwordHash);
        if (!valid) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const primaryClass = user.classes[0] ?? null;

        return NextResponse.json({
            userId: user.id,
            name: user.name,
            email: user.email,
            role: "teacher",
            classId: primaryClass?.id ?? null,
            className: primaryClass
                ? (primaryClass.section
                    ? `${primaryClass.name} ${primaryClass.section}`
                    : primaryClass.name)
                : null,
            classes: user.classes.map((c) => ({
                id: c.id,
                name: c.name,
                section: c.section,
                displayName: c.section ? `${c.name} ${c.section}` : c.name,
                studentCount: c._count.students,
            })),
        });
    } catch (error) {
        console.error("Teacher login error:", error);
        return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
    }
}

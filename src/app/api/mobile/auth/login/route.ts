import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Find student by parent email
        const student = await prisma.student.findFirst({
            where: {
                parentEmail: { equals: normalizedEmail, mode: "insensitive" },
            },
            include: {
                class: {
                    select: {
                        name: true,
                        section: true,
                        teacher: { select: { name: true, phone: true, email: true } },
                    },
                },
                attendances: { orderBy: { date: "desc" }, take: 60 },
                fees: {
                    where: { status: { in: ["PENDING", "OVERDUE"] } },
                    select: { amount: true, status: true },
                },
            },
        });

        if (!student) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        // Verify password against stored bcrypt hash.
        // If no hash is set yet, reject — admin must set a password via the dashboard.
        if (!student.parentPassword) {
            return NextResponse.json({ error: "Account not activated. Please contact the school." }, { status: 401 });
        }
        const valid = await compare(password, student.parentPassword);
        if (!valid) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const totalDays = student.attendances.length;
        const presentDays = student.attendances.filter(
            (a) => a.status === "PRESENT" || a.status === "LATE"
        ).length;
        const attendanceRate =
            totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

        const pendingFees = student.fees.reduce((sum, f) => sum + f.amount, 0);

        const className = student.class
            ? `${student.class.name}${student.class.section ? ` ${student.class.section}` : ""}`
            : "Unassigned";

        return NextResponse.json({
            studentId: student.id,
            parentName: student.parentName,
            parentEmail: student.parentEmail || normalizedEmail,
            parentPhone: student.parentPhone,
            role: "parent",
            childName: student.name,
            childClass: className,
            childEnrollmentId: student.enrollmentId,
            childGender: student.gender,
            childDob: student.dateOfBirth,
            teacherName: student.class?.teacher?.name || null,
            teacherPhone: student.class?.teacher?.phone || null,
            teacherEmail: student.class?.teacher?.email || null,
            attendanceRate,
            pendingFees,
        });
    } catch (error) {
        console.error("Mobile auth login error:", error);
        return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { studentId, currentPassword, newPassword } = body;

        if (!studentId) {
            return NextResponse.json({ error: "studentId is required" }, { status: 400 });
        }
        if (!newPassword || newPassword.length < 6) {
            return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
        }

        const student = await prisma.student.findUnique({
            where: { id: studentId },
            select: { id: true, parentPassword: true },
        });

        if (!student) {
            return NextResponse.json({ error: "Student not found" }, { status: 404 });
        }

        // If a password has already been set, validate the current one
        if (student.parentPassword) {
            if (!currentPassword) {
                return NextResponse.json({ error: "Current password is required" }, { status: 400 });
            }
            const valid = await compare(currentPassword, student.parentPassword);
            if (!valid) {
                return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
            }
        }

        const newHash = await hash(newPassword, 12);
        await prisma.student.update({
            where: { id: studentId },
            data: { parentPassword: newHash },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Change password error:", error);
        return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
    }
}

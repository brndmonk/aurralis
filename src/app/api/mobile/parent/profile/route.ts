import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPresignedUrl } from "@/lib/minio";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get("studentId");

        if (!studentId) {
            return NextResponse.json({ error: "studentId is required" }, { status: 400 });
        }

        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: {
                class: {
                    select: {
                        name: true,
                        section: true,
                        teacher: { select: { name: true, phone: true, email: true } },
                    },
                },
                attendances: { orderBy: { date: "desc" }, take: 60 },
                fees: { orderBy: { createdAt: "desc" }, take: 20 },
            },
        });

        if (!student) {
            return NextResponse.json({ error: "Student not found" }, { status: 404 });
        }

        const totalDays = student.attendances.length;
        const presentDays = student.attendances.filter(
            (a) => a.status === "PRESENT" || a.status === "LATE"
        ).length;
        const attendanceRate =
            totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

        const pendingFees = student.fees
            .filter((f) => f.status === "PENDING" || f.status === "OVERDUE")
            .reduce((sum, f) => sum + f.amount, 0);

        const paidFees = student.fees
            .filter((f) => f.status === "PAID")
            .reduce((sum, f) => sum + f.amount, 0);

        const className = student.class
            ? `${student.class.name}${student.class.section ? ` ${student.class.section}` : ""}`
            : "Unassigned";

        let avatarUrl: string | null = null;
        if (student.avatar) {
            try {
                avatarUrl = await getPresignedUrl(student.avatar, 60 * 60 * 6); // 6 hours
            } catch {
                // MinIO unavailable — no avatar
            }
        }

        return NextResponse.json({
            studentId: student.id,
            childName: student.name,
            childEnrollmentId: student.enrollmentId,
            childClass: className,
            childGender: student.gender,
            childDob: student.dateOfBirth,
            childStatus: student.status,
            parentName: student.parentName,
            parentEmail: student.parentEmail,
            parentPhone: student.parentPhone,
            teacherName: student.class?.teacher?.name || null,
            teacherPhone: student.class?.teacher?.phone || null,
            teacherEmail: student.class?.teacher?.email || null,
            avatarUrl,
            attendanceRate,
            pendingFees,
            paidFees,
            recentFees: student.fees.slice(0, 5).map((f) => ({
                id: f.id,
                amount: f.amount,
                status: f.status,
                dueDate: f.dueDate,
                description: f.description,
            })),
        });
    } catch (error) {
        console.error("Parent profile GET error:", error);
        return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get("studentId");

        if (!studentId) {
            return NextResponse.json({ error: "studentId is required" }, { status: 400 });
        }

        const body = await request.json();
        const { parentName, parentPhone, parentEmail } = body;

        if (!parentName?.trim()) {
            return NextResponse.json({ error: "Parent name is required" }, { status: 400 });
        }

        const updated = await prisma.student.update({
            where: { id: studentId },
            data: {
                parentName: parentName.trim(),
                ...(parentPhone !== undefined && { parentPhone: parentPhone.trim() }),
                ...(parentEmail !== undefined && { parentEmail: parentEmail.trim() || null }),
            },
        });

        return NextResponse.json({
            parentName: updated.parentName,
            parentPhone: updated.parentPhone,
            parentEmail: updated.parentEmail,
        });
    } catch (error) {
        console.error("Parent profile PUT error:", error);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}

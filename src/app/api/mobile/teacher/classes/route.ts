import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/mobile/teacher/classes?userId=<id>
 * Returns classes assigned to a teacher along with their students.
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }

        const classes = await prisma.class.findMany({
            where: { teacherId: userId },
            include: {
                students: {
                    select: {
                        id: true,
                        name: true,
                        enrollmentId: true,
                        gender: true,
                        avatar: true,
                        attendances: {
                            orderBy: { date: "desc" },
                            take: 60,
                            select: { status: true, date: true },
                        },
                    },
                },
                _count: { select: { students: true } },
            },
            orderBy: { name: "asc" },
        });

        const result = classes.map((cls) => {
            const avgAttendance = cls.students.length > 0
                ? Math.round(
                    cls.students.reduce((sum, s) => {
                        const present = s.attendances.filter(
                            (a) => a.status === "PRESENT" || a.status === "LATE"
                        ).length;
                        return sum + (s.attendances.length > 0 ? (present / s.attendances.length) * 100 : 0);
                    }, 0) / cls.students.length
                )
                : 0;

            return {
                id: cls.id,
                name: cls.name,
                section: cls.section,
                displayName: cls.section ? `${cls.name} ${cls.section}` : cls.name,
                capacity: cls.capacity,
                studentCount: cls._count.students,
                avgAttendance,
                students: cls.students.map((s) => {
                    const present = s.attendances.filter(
                        (a) => a.status === "PRESENT" || a.status === "LATE"
                    ).length;
                    const rate = s.attendances.length > 0
                        ? Math.round((present / s.attendances.length) * 100)
                        : 0;
                    return {
                        id: s.id,
                        name: s.name,
                        enrollmentId: s.enrollmentId,
                        gender: s.gender,
                        avatar: s.avatar,
                        attendanceRate: rate,
                    };
                }),
            };
        });

        return NextResponse.json({ classes: result });
    } catch (error) {
        console.error("Teacher classes error:", error);
        return NextResponse.json({ error: "Failed to fetch classes" }, { status: 500 });
    }
}

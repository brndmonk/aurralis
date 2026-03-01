import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/mobile/teacher/attendance?classId=<id>&date=<ISO>
 * Returns today's attendance records for a class.
 *
 * POST /api/mobile/teacher/attendance
 * Body: { classId, date, records: [{ studentId, status }] }
 * Bulk-upserts attendance (creates or updates for the given date).
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const classId = searchParams.get("classId");
        const dateStr = searchParams.get("date");

        if (!classId) {
            return NextResponse.json({ error: "classId is required" }, { status: 400 });
        }

        const date = dateStr ? new Date(dateStr) : new Date();
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        const records = await prisma.attendance.findMany({
            where: {
                student: { classId },
                date: { gte: start, lte: end },
            },
            select: {
                studentId: true,
                status: true,
                date: true,
            },
        });

        return NextResponse.json({ records });
    } catch (error) {
        console.error("Teacher attendance GET error:", error);
        return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { classId, date, records } = body as {
            classId: string;
            date: string;
            records: { studentId: string; status: string }[];
        };

        if (!classId || !date || !Array.isArray(records)) {
            return NextResponse.json({ error: "classId, date and records are required" }, { status: 400 });
        }

        const attendanceDate = new Date(date);
        attendanceDate.setHours(12, 0, 0, 0); // noon to avoid timezone issues

        // Upsert each record
        const results = await Promise.all(
            records.map(({ studentId, status }) =>
                prisma.attendance.upsert({
                    where: {
                        studentId_date: {
                            studentId,
                            date: attendanceDate,
                        },
                    },
                    update: { status: status.toUpperCase() as "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" },
                    create: {
                        studentId,
                        date: attendanceDate,
                        status: status.toUpperCase() as "PRESENT" | "ABSENT" | "LATE" | "EXCUSED",
                    },
                })
            )
        );

        return NextResponse.json({ saved: results.length });
    } catch (error) {
        console.error("Teacher attendance POST error:", error);
        return NextResponse.json({ error: "Failed to save attendance" }, { status: 500 });
    }
}

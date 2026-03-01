import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const attendanceRecordSchema = z.object({
    studentId: z.string().min(1),
    date: z.string().min(1),
    status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
    note: z.string().max(500).optional(),
});

const createAttendanceSchema = z.object({
    records: z.array(attendanceRecordSchema).min(1),
});

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const classId = searchParams.get("classId");
        const month = searchParams.get("month"); // 0-indexed
        const year = searchParams.get("year");

        const where: Record<string, unknown> = {};

        if (classId) {
            where.student = { classId };
        }

        if (month !== null && year) {
            const m = parseInt(month);
            const y = parseInt(year);
            where.date = {
                gte: new Date(y, m, 1),
                lt: new Date(y, m + 1, 1),
            };
        }

        const records = await prisma.attendance.findMany({
            where,
            include: {
                student: { select: { id: true, name: true, enrollmentId: true, classId: true } },
            },
            orderBy: { date: "asc" },
        });

        // Aggregate stats
        const total = records.length;
        const present = records.filter((r) => r.status === "PRESENT").length;
        const absent = records.filter((r) => r.status === "ABSENT").length;
        const late = records.filter((r) => r.status === "LATE").length;
        const excused = records.filter((r) => r.status === "EXCUSED").length;

        return NextResponse.json({
            records,
            stats: {
                total,
                present,
                absent,
                late,
                excused,
                rate: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
            },
        });
    } catch (error) {
        console.error("Attendance fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parsed = createAttendanceSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid input", details: parsed.error.issues },
                { status: 400 }
            );
        }

        const results = await Promise.all(
            parsed.data.records.map(({ studentId, date, status, note }) =>
                prisma.attendance.upsert({
                    where: { studentId_date: { studentId, date: new Date(date) } },
                    update: { status, note: note ?? null },
                    create: { studentId, date: new Date(date), status, note: note ?? null },
                })
            )
        );

        return NextResponse.json({ count: results.length });
    } catch (error) {
        console.error("Attendance POST error:", error);
        return NextResponse.json({ error: "Failed to record attendance" }, { status: 500 });
    }
}

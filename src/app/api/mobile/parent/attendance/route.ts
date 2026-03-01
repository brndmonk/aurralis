import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get("studentId");

        if (!studentId) {
            return NextResponse.json({ error: "studentId is required" }, { status: 400 });
        }

        const records = await prisma.attendance.findMany({
            where: { studentId },
            orderBy: { date: "desc" },
            take: 60,
            select: { date: true, status: true, note: true },
        });

        const total = records.length;
        const present = records.filter(r => r.status === "PRESENT").length;
        const absent = records.filter(r => r.status === "ABSENT").length;
        const late = records.filter(r => r.status === "LATE").length;
        const excused = records.filter(r => r.status === "EXCUSED").length;
        const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

        return NextResponse.json({
            records: records.map(r => ({
                date: r.date.toISOString(),
                status: r.status.toLowerCase(),
                note: r.note ?? null,
            })),
            stats: { total, present, absent, late, excused, rate },
        });
    } catch (error) {
        console.error("Attendance GET error:", error);
        return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
    }
}

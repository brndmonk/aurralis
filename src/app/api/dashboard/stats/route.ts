import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

        // ─── Stat Cards ────────────────────────────────────
        const [
            totalStudents, todayPresent, todayTotal, monthlyFees, pendingFees, newLeadsCount,
            yesterdayPresent, yesterdayTotal, prevMonthRevenue, prevMonthStudents,
        ] = await Promise.all([
            prisma.student.count({ where: { status: "ACTIVE" } }),
            prisma.attendance.count({
                where: { date: { gte: startOfToday, lte: endOfToday }, status: { in: ["PRESENT", "LATE"] } },
            }),
            prisma.attendance.count({
                where: { date: { gte: startOfToday, lte: endOfToday } },
            }),
            prisma.fee.aggregate({
                where: { status: "PAID", paidDate: { gte: startOfMonth } },
                _sum: { amount: true },
            }),
            prisma.fee.aggregate({
                where: { status: { in: ["PENDING", "OVERDUE"] } },
                _sum: { amount: true },
            }),
            prisma.lead.count({ where: { status: "NEW" } }),
            prisma.attendance.count({
                where: { date: { gte: startOfYesterday, lte: endOfYesterday }, status: { in: ["PRESENT", "LATE"] } },
            }),
            prisma.attendance.count({
                where: { date: { gte: startOfYesterday, lte: endOfYesterday } },
            }),
            prisma.fee.aggregate({
                where: { status: "PAID", paidDate: { gte: startOfLastMonth, lte: endOfLastMonth } },
                _sum: { amount: true },
            }),
            prisma.student.count({
                where: { status: "ACTIVE", enrolledAt: { lte: endOfLastMonth } },
            }),
        ]);

        const attendanceRate = todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 100) : 0;
        const yesterdayAttendanceRate = yesterdayTotal > 0 ? Math.round((yesterdayPresent / yesterdayTotal) * 100) : 0;

        // ─── Enrollment Chart (monthly counts, last 6 months) ─
        const enrollmentData = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const count = await prisma.student.count({
                where: {
                    enrolledAt: { lte: new Date(d.getFullYear(), d.getMonth() + 1, 0) },
                    status: "ACTIVE",
                },
            });
            enrollmentData.push({
                month: d.toLocaleDateString("en-US", { month: "short" }),
                students: count,
            });
        }

        // ─── Upcoming Events ────────────────────────────────
        const upcomingEvents = await prisma.event.findMany({
            where: { startDate: { gte: startOfToday } },
            orderBy: { startDate: "asc" },
            take: 5,
        });

        // ─── Recent Enrollments ─────────────────────────────
        const recentEnrollments = await prisma.student.findMany({
            orderBy: { enrolledAt: "desc" },
            take: 5,
            include: {
                class: { select: { name: true, section: true } },
            },
        });

        // ─── Recent Fees ────────────────────────────────────
        const recentFees = await prisma.fee.findMany({
            include: {
                student: { select: { id: true, name: true, enrollmentId: true, class: { select: { name: true } } } },
            },
            orderBy: { updatedAt: "desc" },
            take: 8,
        });

        return NextResponse.json({
            stats: {
                totalStudents,
                attendanceRate,
                monthlyRevenue: monthlyFees._sum.amount || 0,
                pendingDues: pendingFees._sum.amount || 0,
                newLeadsCount,
                prevMonthStudents,
                prevMonthRevenue: prevMonthRevenue._sum.amount || 0,
                yesterdayAttendanceRate,
            },
            enrollmentData,
            upcomingEvents: upcomingEvents.map((e) => ({
                id: e.id,
                title: e.title,
                date: e.startDate,
                endDate: e.endDate,
                location: e.location,
                type: e.type,
            })),
            recentFees: recentFees.map((f) => ({
                id: f.id,
                studentName: f.student.name,
                studentId: f.student.enrollmentId,
                className: f.student.class?.name || "N/A",
                amount: f.amount,
                dueDate: f.dueDate,
                paidDate: f.paidDate,
                status: f.status,
                description: f.description,
            })),
            recentEnrollments: recentEnrollments.map((s) => ({
                id: s.id,
                name: s.name,
                enrollmentId: s.enrollmentId,
                className: s.class
                    ? `${s.class.name}${s.class.section ? ` ${s.class.section}` : ""}`
                    : "Unassigned",
                enrolledAt: s.enrolledAt,
                status: s.status,
                gender: s.gender,
            })),
        });
    } catch (error) {
        console.error("Dashboard stats error:", error);
        return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createFeeSchema = z.object({
    studentId: z.string().min(1),
    amount: z.number().positive(),
    dueDate: z.string().min(1),
    description: z.string().max(500).optional(),
    status: z.enum(["PAID", "PENDING", "OVERDUE"]).optional(),
});

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const search = searchParams.get("search");
        const limit = parseInt(searchParams.get("limit") || "20");

        const where: Record<string, unknown> = {};
        if (status) where.status = status;
        if (search) {
            where.student = {
                name: { contains: search, mode: "insensitive" },
            };
        }

        const [fees, totalCollected, totalPending, totalOverdue, allFees] = await Promise.all([
            prisma.fee.findMany({
                where,
                include: {
                    student: {
                        include: { class: { select: { name: true } } },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: limit,
            }),
            prisma.fee.aggregate({
                where: { status: "PAID" },
                _sum: { amount: true },
                _count: true,
            }),
            prisma.fee.aggregate({
                where: { status: "PENDING" },
                _sum: { amount: true },
                _count: true,
            }),
            prisma.fee.aggregate({
                where: { status: "OVERDUE" },
                _sum: { amount: true },
                _count: true,
            }),
            prisma.fee.aggregate({
                _sum: { amount: true },
                _count: true,
            }),
        ]);

        // Defaulters — students with OVERDUE fees
        const defaulters = await prisma.fee.findMany({
            where: { status: "OVERDUE" },
            include: {
                student: {
                    select: { id: true, name: true, enrollmentId: true, class: { select: { name: true } } },
                },
            },
            orderBy: { dueDate: "asc" },
        });

        return NextResponse.json({
            fees: fees.map((f) => ({
                id: f.id,
                studentName: f.student.name,
                studentId: f.student.enrollmentId,
                className: f.student.class?.name || "N/A",
                amount: f.amount,
                dueDate: f.dueDate,
                paidDate: f.paidDate,
                status: f.status,
                description: f.description,
                createdAt: f.createdAt,
            })),
            aggregations: {
                totalReceivable: allFees._sum.amount || 0,
                totalCollected: totalCollected._sum.amount || 0,
                pendingDues: totalPending._sum.amount || 0,
                overdueDues: totalOverdue._sum.amount || 0,
                totalCount: allFees._count,
                paidCount: totalCollected._count,
                pendingCount: totalPending._count,
                overdueCount: totalOverdue._count,
            },
            defaulters: defaulters.map((d) => ({
                id: d.id,
                studentName: d.student.name,
                studentId: d.student.enrollmentId,
                className: d.student.class?.name || "N/A",
                amount: d.amount,
                dueDate: d.dueDate,
                description: d.description,
            })),
        });
    } catch (error) {
        console.error("Fees fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch fees" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parsed = createFeeSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid input", details: parsed.error.issues },
                { status: 400 }
            );
        }
        const d = parsed.data;
        const fee = await prisma.fee.create({
            data: {
                studentId: d.studentId,
                amount: d.amount,
                dueDate: new Date(d.dueDate),
                description: d.description,
                status: d.status ?? "PENDING",
            },
        });

        return NextResponse.json(fee, { status: 201 });
    } catch (error) {
        console.error("Fee create error:", error);
        return NextResponse.json({ error: "Failed to create fee" }, { status: 500 });
    }
}

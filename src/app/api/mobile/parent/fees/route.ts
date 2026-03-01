import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get("studentId");

        if (!studentId) {
            return NextResponse.json({ error: "studentId is required" }, { status: 400 });
        }

        const fees = await prisma.fee.findMany({
            where: { studentId },
            orderBy: { dueDate: "desc" },
        });

        const totalAmount = fees.reduce((s, f) => s + f.amount, 0);
        const paidAmount = fees.filter(f => f.status === "PAID").reduce((s, f) => s + f.amount, 0);
        const pendingAmount = fees.filter(f => f.status !== "PAID").reduce((s, f) => s + f.amount, 0);
        const pendingCount = fees.filter(f => f.status === "PENDING" || f.status === "OVERDUE").length;

        return NextResponse.json({
            fees: fees.map(f => ({
                id: f.id,
                description: f.description ?? "School Fee",
                amount: f.amount,
                dueDate: f.dueDate.toISOString(),
                paidDate: f.paidDate?.toISOString() ?? null,
                status: f.status.toLowerCase(),
                receiptUrl: f.receiptUrl ?? null,
            })),
            summary: {
                totalAmount,
                paidAmount,
                pendingAmount,
                pendingCount,
                totalCount: fees.length,
                paidCount: fees.filter(f => f.status === "PAID").length,
            },
        });
    } catch (error) {
        console.error("Fees GET error:", error);
        return NextResponse.json({ error: "Failed to fetch fees" }, { status: 500 });
    }
}

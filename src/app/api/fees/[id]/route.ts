import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
    try {
        const { id } = await params;
        const fee = await prisma.fee.findUnique({
            where: { id },
            include: {
                student: {
                    include: { class: { select: { name: true } } },
                },
            },
        });
        if (!fee) return NextResponse.json({ error: "Fee not found" }, { status: 404 });
        return NextResponse.json(fee);
    } catch (error) {
        console.error("Fee GET error:", error);
        return NextResponse.json({ error: "Failed to fetch fee" }, { status: 500 });
    }
}

export async function PATCH(request: Request, { params }: Params) {
    try {
        const { id } = await params;
        const body = await request.json();

        const data: Record<string, unknown> = {};
        if (body.amount !== undefined) data.amount = Number(body.amount);
        if (body.dueDate !== undefined) data.dueDate = new Date(body.dueDate);
        if (body.description !== undefined) data.description = body.description;
        if (body.status !== undefined) {
            data.status = body.status;
            // Automatically set paidDate when marking PAID
            if (body.status === "PAID") {
                data.paidDate = body.paidDate ? new Date(body.paidDate) : new Date();
            } else {
                data.paidDate = null;
            }
        }

        const fee = await prisma.fee.update({
            where: { id },
            data,
            include: {
                student: {
                    include: { class: { select: { name: true } } },
                },
            },
        });

        return NextResponse.json({
            id: fee.id,
            studentName: fee.student.name,
            studentId: fee.student.enrollmentId,
            className: fee.student.class?.name || "N/A",
            amount: fee.amount,
            dueDate: fee.dueDate,
            paidDate: fee.paidDate,
            status: fee.status,
            description: fee.description,
            createdAt: fee.createdAt,
        });
    } catch (error) {
        console.error("Fee PATCH error:", error);
        return NextResponse.json({ error: "Failed to update fee" }, { status: 500 });
    }
}

export async function DELETE(_req: Request, { params }: Params) {
    try {
        const { id } = await params;
        await prisma.fee.delete({ where: { id } });
        return NextResponse.json({ message: "Fee deleted" });
    } catch (error) {
        console.error("Fee DELETE error:", error);
        return NextResponse.json({ error: "Failed to delete fee" }, { status: 500 });
    }
}

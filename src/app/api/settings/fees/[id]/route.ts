import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
    try {
        const { id } = await params;
        const body = await request.json();

        let frequencyColor = body.frequencyColor;
        if (!frequencyColor) {
            if (body.frequency === "Monthly") frequencyColor = "text-accent";
            else if (body.frequency === "One-time") frequencyColor = "text-text-muted";
            else frequencyColor = "text-text-secondary";
        }

        const updated = await prisma.feeTemplate.update({
            where: { id },
            data: {
                type: body.type,
                frequency: body.frequency,
                frequencyColor,
                amount: parseFloat(body.amount),
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Fee template PATCH error:", error);
        return NextResponse.json({ error: "Failed to update fee template" }, { status: 500 });
    }
}

export async function DELETE(_req: Request, { params }: Params) {
    try {
        const { id } = await params;
        await prisma.feeTemplate.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Fee template DELETE error:", error);
        return NextResponse.json({ error: "Failed to delete fee template" }, { status: 500 });
    }
}

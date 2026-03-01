import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createFeeTemplateSchema = z.object({
    type: z.string().min(1).max(100),
    frequency: z.string().min(1).max(50),
    frequencyColor: z.string().max(100).optional(),
    amount: z.number().positive(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = createFeeTemplateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid input", details: parsed.error.issues },
                { status: 400 }
            );
        }
        const d = parsed.data;

        const newFeeTemplate = await prisma.feeTemplate.create({
            data: {
                type: d.type,
                frequency: d.frequency,
                frequencyColor: d.frequencyColor ?? "text-text-secondary",
                amount: d.amount,
                isDefault: false,
            },
        });

        return NextResponse.json(newFeeTemplate, { status: 201 });
    } catch (error) {
        console.error("Failed to create fee template:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }

        await prisma.feeTemplate.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete fee template:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSettingsSchema = z.object({
    academicYear: z.string().min(1).max(20).optional(),
    currentTerm: z.string().min(1).max(50).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    stripeEnabled: z.boolean().optional(),
    razorpayEnabled: z.boolean().optional(),
    twilioEnabled: z.boolean().optional(),
    resendEnabled: z.boolean().optional(),
    webhooksEnabled: z.boolean().optional(),
});

export async function GET() {
    try {
        const settings = await prisma.systemSettings.findFirst();
        const feeTemplates = await prisma.feeTemplate.findMany({
            orderBy: { createdAt: "asc" },
        });

        return NextResponse.json({
            settings,
            feeTemplates,
        });
    } catch (error) {
        console.error("Failed to fetch settings:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const parsed = updateSettingsSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid input", details: parsed.error.issues },
                { status: 400 }
            );
        }

        const { startDate, endDate, ...rest } = parsed.data;
        const data = {
            ...rest,
            ...(startDate ? { startDate: new Date(startDate) } : {}),
            ...(endDate ? { endDate: new Date(endDate) } : {}),
        };

        const existingSettings = await prisma.systemSettings.findFirst();
        if (existingSettings) {
            const updated = await prisma.systemSettings.update({
                where: { id: existingSettings.id },
                data,
            });
            return NextResponse.json(updated);
        } else {
            const created = await prisma.systemSettings.create({ data });
            return NextResponse.json(created);
        }
    } catch (error) {
        console.error("Failed to update settings:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

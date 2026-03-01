import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ActivityType } from "@prisma/client";
import { z } from "zod";

const createActivitySchema = z.object({
    type: z.enum(["CALL", "EMAIL", "TOUR", "NOTE", "SYSTEM"]),
    text: z.string().min(1).max(2000),
    scheduledFor: z.string().optional(),
    createdById: z.string().optional(),
});

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const activities = await prisma.leadActivity.findMany({
            where: { leadId: id },
            include: {
                createdBy: {
                    select: { name: true, role: true }
                }
            },
            orderBy: { date: 'desc' }
        });

        return NextResponse.json(activities);
    } catch (error) {
        console.error("Activities fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch activities" },
            { status: 500 }
        );
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const parsed = createActivitySchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid input", details: parsed.error.issues },
                { status: 400 }
            );
        }
        const d = parsed.data;
        const activity = await prisma.leadActivity.create({
            data: {
                leadId: id,
                type: d.type as ActivityType,
                text: d.text,
                scheduledFor: d.scheduledFor ? new Date(d.scheduledFor) : undefined,
                createdById: d.createdById,
            },
            include: {
                createdBy: {
                    select: { name: true, role: true }
                }
            }
        });

        if (d.type === ActivityType.TOUR && d.scheduledFor) {
            await prisma.lead.update({
                where: { id },
                data: { status: 'TOUR_SCHEDULED' }
            });
        }

        return NextResponse.json(activity, { status: 201 });
    } catch (error) {
        console.error("Activity create error:", error);
        return NextResponse.json(
            { error: "Failed to create activity" },
            { status: 500 }
        );
    }
}

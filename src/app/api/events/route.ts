import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createEventSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    startDate: z.string().min(1),
    endDate: z.string().optional(),
    location: z.string().max(200).optional(),
    type: z.enum(["MEETING", "EXHIBITION", "HOLIDAY", "ACTIVITY", "OTHER"]).optional(),
});

export async function GET() {
    try {
        const events = await prisma.event.findMany({
            orderBy: { startDate: "asc" },
        });

        return NextResponse.json(events);
    } catch (error) {
        console.error("Events fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch events" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parsed = createEventSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid input", details: parsed.error.issues },
                { status: 400 }
            );
        }
        const d = parsed.data;
        const event = await prisma.event.create({
            data: {
                title: d.title,
                description: d.description,
                startDate: new Date(d.startDate),
                endDate: d.endDate ? new Date(d.endDate) : undefined,
                location: d.location,
                type: d.type ?? "OTHER",
            },
        });

        return NextResponse.json(event, { status: 201 });
    } catch (error) {
        console.error("Event create error:", error);
        return NextResponse.json(
            { error: "Failed to create event" },
            { status: 500 }
        );
    }
}

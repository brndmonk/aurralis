import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const events = await prisma.event.findMany({
            orderBy: { startDate: "desc" },
            take: 20,
            select: {
                id: true,
                title: true,
                description: true,
                startDate: true,
                endDate: true,
                location: true,
                type: true,
            },
        });

        return NextResponse.json({
            events: events.map(e => ({
                id: e.id,
                title: e.title,
                description: e.description ?? "",
                startDate: e.startDate.toISOString(),
                endDate: e.endDate?.toISOString() ?? null,
                location: e.location ?? null,
                type: e.type.toLowerCase(),
            })),
        });
    } catch (error) {
        console.error("Events GET error:", error);
        return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
    try {
        const { id } = await params;
        const event = await prisma.event.findUnique({ where: { id } });
        if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
        return NextResponse.json(event);
    } catch (error) {
        console.error("Event GET error:", error);
        return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
    }
}

export async function PATCH(request: Request, { params }: Params) {
    try {
        const { id } = await params;
        const body = await request.json();

        const data: Record<string, unknown> = {};
        if (body.title !== undefined) data.title = body.title;
        if (body.description !== undefined) data.description = body.description;
        if (body.startDate !== undefined) data.startDate = new Date(body.startDate);
        if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null;
        if (body.location !== undefined) data.location = body.location;
        if (body.type !== undefined) data.type = body.type;

        const event = await prisma.event.update({ where: { id }, data });
        return NextResponse.json(event);
    } catch (error) {
        console.error("Event PATCH error:", error);
        return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
    }
}

export async function DELETE(_req: Request, { params }: Params) {
    try {
        const { id } = await params;
        await prisma.event.delete({ where: { id } });
        return NextResponse.json({ message: "Event deleted" });
    } catch (error) {
        console.error("Event DELETE error:", error);
        return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
    }
}

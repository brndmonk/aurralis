import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const cls = await prisma.class.update({
            where: { id },
            data: {
                ...(body.teacherId !== undefined && { teacherId: body.teacherId }),
                ...(body.name !== undefined && { name: body.name }),
                ...(body.section !== undefined && { section: body.section }),
                ...(body.capacity !== undefined && { capacity: Number(body.capacity) }),
            },
            include: {
                teacher: { select: { id: true, name: true, email: true } },
                _count: { select: { students: true } },
            },
        });

        return NextResponse.json({
            id: cls.id,
            name: cls.name,
            section: cls.section,
            capacity: cls.capacity,
            enrolled: cls._count.students,
            teacher: cls.teacher,
            createdAt: cls.createdAt,
        });
    } catch (error) {
        console.error("Class update error:", error);
        return NextResponse.json({ error: "Failed to update class" }, { status: 500 });
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const cls = await prisma.class.findUnique({
            where: { id },
            include: { _count: { select: { students: true } } },
        });

        if (!cls) {
            return NextResponse.json({ error: "Class not found" }, { status: 404 });
        }
        if (cls._count.students > 0) {
            return NextResponse.json(
                { error: `Cannot delete: ${cls._count.students} student(s) are still in this class. Reassign them first.` },
                { status: 400 }
            );
        }

        await prisma.class.delete({ where: { id } });
        return NextResponse.json({ message: "Class deleted" });
    } catch (error) {
        console.error("Class delete error:", error);
        return NextResponse.json({ error: "Failed to delete class" }, { status: 500 });
    }
}

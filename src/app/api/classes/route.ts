import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const classes = await prisma.class.findMany({
            include: {
                teacher: { select: { id: true, name: true, email: true } },
                _count: { select: { students: true } },
            },
            orderBy: { name: "asc" },
        });

        const formatted = classes.map((cls) => ({
            id: cls.id,
            name: cls.name,
            section: cls.section,
            capacity: cls.capacity,
            enrolled: cls._count.students,
            teacher: cls.teacher
                ? { id: cls.teacher.id, name: cls.teacher.name, email: cls.teacher.email }
                : null,
            createdAt: cls.createdAt,
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Classes fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch classes" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const cls = await prisma.class.create({
            data: {
                name: body.name,
                section: body.section,
                teacherId: body.teacherId,
                capacity: body.capacity || 30,
            },
            include: {
                teacher: { select: { id: true, name: true } },
            },
        });

        return NextResponse.json(cls, { status: 201 });
    } catch (error) {
        console.error("Class create error:", error);
        return NextResponse.json({ error: "Failed to create class" }, { status: 500 });
    }
}

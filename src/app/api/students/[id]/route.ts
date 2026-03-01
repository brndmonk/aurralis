import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const student = await prisma.student.findUnique({
            where: { id },
            include: {
                class: true,
                fees: { orderBy: { createdAt: "desc" } },
                attendances: { orderBy: { date: "desc" }, take: 30 },
            },
        });

        if (!student) {
            return NextResponse.json({ error: "Student not found" }, { status: 404 });
        }

        return NextResponse.json(student);
    } catch (error) {
        console.error("Student fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch student" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const student = await prisma.student.update({
            where: { id },
            data: {
                name: body.name,
                classId: body.classId,
                parentName: body.parentName,
                parentPhone: body.parentPhone,
                parentEmail: body.parentEmail,
                dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
                gender: body.gender,
                status: body.status,
            },
        });

        return NextResponse.json(student);
    } catch (error) {
        console.error("Student update error:", error);
        return NextResponse.json(
            { error: "Failed to update student" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.student.delete({ where: { id } });
        return NextResponse.json({ message: "Student deleted" });
    } catch (error) {
        console.error("Student delete error:", error);
        return NextResponse.json(
            { error: "Failed to delete student" },
            { status: 500 }
        );
    }
}

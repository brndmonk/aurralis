import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const emailOrEmpty = z.union([
    z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/).nullable(),
    z.literal(""),
    z.null(),
    z.undefined(),
]);

const createStudentSchema = z.object({
    name: z.string().min(1).max(100),
    enrollmentId: z.string().min(1).max(50),
    classId: z.string().nullable().optional(),
    parentName: z.string().max(100).nullable().optional(),
    parentPhone: z.string().max(20).nullable().optional(),
    parentEmail: emailOrEmpty,
    dateOfBirth: z.string().nullable().optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "GRADUATED", "TRANSFERRED"]).optional(),
});

export async function GET() {
    try {
        const students = await prisma.student.findMany({
            include: {
                class: true,
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(students);
    } catch (error) {
        console.error("Students fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch students" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parsed = createStudentSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid input", details: parsed.error.issues },
                { status: 400 }
            );
        }
        const d = parsed.data;
        const student = await prisma.student.create({
            data: {
                name: d.name,
                enrollmentId: d.enrollmentId,
                classId: d.classId ?? null,
                parentName: d.parentName ?? "",
                parentPhone: d.parentPhone ?? "",
                parentEmail: d.parentEmail || null,
                dateOfBirth: d.dateOfBirth ? new Date(d.dateOfBirth) : undefined,
                gender: d.gender,
                status: d.status,
            },
        });

        return NextResponse.json(student, { status: 201 });
    } catch (error) {
        console.error("Student create error:", error);
        return NextResponse.json(
            { error: "Failed to create student" },
            { status: 500 }
        );
    }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadFile, getPresignedUrl, deleteFile } from "@/lib/minio";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const studentId = formData.get("studentId") as string | null;
        const file = formData.get("file") as File | null;

        if (!studentId) {
            return NextResponse.json({ error: "studentId is required" }, { status: 400 });
        }
        if (!file) {
            return NextResponse.json({ error: "file is required" }, { status: 400 });
        }

        const student = await prisma.student.findUnique({
            where: { id: studentId },
            select: { id: true, avatar: true },
        });
        if (!student) {
            return NextResponse.json({ error: "Student not found" }, { status: 404 });
        }

        // Delete old avatar if present
        if (student.avatar) {
            try { await deleteFile(student.avatar); } catch { /* ignore */ }
        }

        const ext = file.name.split(".").pop() ?? "jpg";
        const objectName = await uploadFile(
            `avatars/parent-${studentId}.${ext}`,
            Buffer.from(await file.arrayBuffer()),
            file.type || "image/jpeg"
        );

        await prisma.student.update({
            where: { id: studentId },
            data: { avatar: objectName },
        });

        const avatarUrl = await getPresignedUrl(objectName, 60 * 60 * 6);
        return NextResponse.json({ avatarUrl });
    } catch (error) {
        console.error("Avatar upload error:", error);
        return NextResponse.json({ error: "Failed to upload avatar" }, { status: 500 });
    }
}

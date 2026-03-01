import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPresignedUrl } from "@/lib/minio";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get("studentId");

        if (!studentId) {
            return NextResponse.json({ error: "studentId is required" }, { status: 400 });
        }

        // Fetch image documents for this student
        const docs = await prisma.document.findMany({
            where: {
                studentId,
                OR: [
                    { mimeType: { startsWith: "image/" } },
                    { name: { endsWith: ".jpg" } },
                    { name: { endsWith: ".jpeg" } },
                    { name: { endsWith: ".png" } },
                    { name: { endsWith: ".webp" } },
                ],
            },
            orderBy: { createdAt: "desc" },
            take: 50,
            include: {
                uploadedBy: { select: { name: true } },
            },
        });

        const photos = await Promise.all(
            docs.map(async (doc) => {
                let url = doc.url;
                // If it looks like a MinIO object name (no http), get a presigned URL
                if (!url.startsWith("http")) {
                    try {
                        url = await getPresignedUrl(doc.url, 60 * 60 * 6);
                    } catch {
                        url = "";
                    }
                }
                return {
                    id: doc.id,
                    name: doc.name,
                    url,
                    uploadedBy: doc.uploadedBy?.name ?? null,
                    createdAt: doc.createdAt.toISOString(),
                };
            })
        );

        return NextResponse.json({ photos: photos.filter((p) => p.url) });
    } catch (error) {
        console.error("Photos GET error:", error);
        return NextResponse.json({ error: "Failed to fetch photos" }, { status: 500 });
    }
}

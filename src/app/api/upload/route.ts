import { NextResponse } from "next/server";
import { uploadFile } from "@/lib/minio";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const objectName = await uploadFile(file.name, buffer, file.type);

        return NextResponse.json({
            objectName,
            fileName: file.name,
            size: file.size,
            mimeType: file.type,
        }, { status: 201 });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Failed to upload file" },
            { status: 500 }
        );
    }
}

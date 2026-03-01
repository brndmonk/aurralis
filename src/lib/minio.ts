import * as Minio from "minio";

const globalForMinio = globalThis as unknown as {
    minio: Minio.Client | undefined;
};

export const minioClient =
    globalForMinio.minio ??
    new Minio.Client({
        endPoint: process.env.MINIO_ENDPOINT || "localhost",
        port: parseInt(process.env.MINIO_PORT || "9000"),
        useSSL: process.env.MINIO_USE_SSL === "true",
        accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
        secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
    });

if (process.env.NODE_ENV !== "production") globalForMinio.minio = minioClient;

const BUCKET = process.env.MINIO_BUCKET || "aurralis";

export async function ensureBucket() {
    const exists = await minioClient.bucketExists(BUCKET);
    if (!exists) {
        await minioClient.makeBucket(BUCKET);
    }
}

export async function uploadFile(
    fileName: string,
    buffer: Buffer,
    contentType: string
): Promise<string> {
    await ensureBucket();
    const objectName = `${Date.now()}-${fileName}`;
    await minioClient.putObject(BUCKET, objectName, buffer, buffer.length, {
        "Content-Type": contentType,
    });
    return objectName;
}

export async function getPresignedUrl(
    objectName: string,
    expiry: number = 60 * 60 // 1 hour
): Promise<string> {
    return minioClient.presignedGetObject(BUCKET, objectName, expiry);
}

export async function deleteFile(objectName: string): Promise<void> {
    await minioClient.removeObject(BUCKET, objectName);
}

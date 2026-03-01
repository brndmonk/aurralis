import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    try {
        const users = await prisma.user.findMany({
            where: role ? { role: role.toUpperCase() as "ADMIN" | "TEACHER" | "STAFF" } : undefined,
            orderBy: { name: "asc" },
            select: { id: true, name: true, email: true, role: true },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error("Users fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}

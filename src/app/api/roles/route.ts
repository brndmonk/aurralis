import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const rolePermissions = await prisma.rolePermission.findMany();
        return NextResponse.json(rolePermissions);
    } catch (error) {
        console.error("Failed to fetch role permissions:", error);
        return NextResponse.json(
            { error: "Failed to fetch role permissions" },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { roleName, permissionCategories } = body;

        if (!roleName || !permissionCategories) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const rolePermission = await prisma.rolePermission.upsert({
            where: { roleName },
            update: { permissions: permissionCategories },
            create: { roleName, permissions: permissionCategories },
        });

        return NextResponse.json(rolePermission);
    } catch (error) {
        console.error("Failed to update role permissions:", error);
        return NextResponse.json(
            { error: "Failed to update role permissions" },
            { status: 500 }
        );
    }
}

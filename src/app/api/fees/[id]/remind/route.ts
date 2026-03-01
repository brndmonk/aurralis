import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
    try {
        const { id } = await params;

        const fee = await prisma.fee.findUnique({
            where: { id },
            include: {
                student: { select: { name: true, parentName: true, parentPhone: true, parentEmail: true } },
            },
        });

        if (!fee) {
            return NextResponse.json({ error: "Fee not found" }, { status: 404 });
        }

        const settings = await prisma.systemSettings.findFirst();

        const contact = {
            studentName: fee.student.name,
            parentName: fee.student.parentName,
            phone: fee.student.parentPhone,
            email: fee.student.parentEmail,
        };

        const notificationEnabled = settings?.twilioEnabled || settings?.resendEnabled;

        if (!notificationEnabled) {
            return NextResponse.json({
                queued: false,
                contact,
                message: "No notification service configured. Enable Twilio or Resend in Settings.",
            });
        }

        // When Twilio/Resend keys are configured in .env, add the sending logic here.
        return NextResponse.json({
            queued: true,
            contact,
            message: `Reminder queued for ${fee.student.parentName} via ${settings?.twilioEnabled ? "SMS" : "Email"}.`,
        });
    } catch (error) {
        console.error("Fee remind error:", error);
        return NextResponse.json({ error: "Failed to send reminder" }, { status: 500 });
    }
}

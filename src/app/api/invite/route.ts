import { NextResponse } from "next/server";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { name, email, className } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Upsert User dynamically assigning teacher role matching invite intention
    await prisma.user.upsert({
      where: { email },
      update: {
        name,
        role: "TEACHER",
      },
      create: {
        name,
        email,
        role: "TEACHER",
      },
    });

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `You're Invited to Join Aurralis Montessori!`,
      html: `
        <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 560px; margin: 0 auto; padding: 0;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1a1f36 0%, #252b48 100%); padding: 40px 32px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: #22c55e; font-size: 24px; font-weight: 800; margin: 0 0 4px 0;">Aurralis</h1>
            <p style="color: rgba(255,255,255,0.6); font-size: 12px; margin: 0; letter-spacing: 0.5px;">MONTESSORI ADMIN</p>
          </div>

          <!-- Body -->
          <div style="background: #ffffff; padding: 40px 32px; border: 1px solid #e2e8f0; border-top: none;">
            <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin: 0 0 8px 0;">
              Welcome to the Team! 🎉
            </h2>
            <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
              Hi <strong style="color: #0f172a;">${name}</strong>,
            </p>
            <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
              You've been invited to join <strong style="color: #0f172a;">Aurralis Montessori</strong> as a <strong style="color: #22c55e;">Teacher</strong>${className ? ` for <strong style="color: #0f172a;">${className}</strong>` : ""}.
            </p>

            <!-- Details Card -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 0 0 28px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding: 4px 0;">Role</td>
                  <td style="color: #0f172a; font-size: 14px; font-weight: 600; text-align: right; padding: 4px 0;">Teacher</td>
                </tr>
                ${className ? `
                <tr>
                  <td style="color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding: 4px 0;">Class</td>
                  <td style="color: #0f172a; font-size: 14px; font-weight: 600; text-align: right; padding: 4px 0;">${className}</td>
                </tr>
                ` : ""}
                <tr>
                  <td style="color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding: 4px 0;">Email</td>
                  <td style="color: #0f172a; font-size: 14px; font-weight: 600; text-align: right; padding: 4px 0;">${email}</td>
                </tr>
              </table>
            </div>

            <!-- CTA Button -->
            <a href="#" style="display: block; background: #22c55e; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 0; border-radius: 12px; text-align: center;">
              Accept Invitation →
            </a>

            <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 20px 0 0 0; text-align: center;">
              If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; padding: 24px 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 16px 16px; text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} Aurralis Montessori · Sent with ❤️
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also send a notification to the admin
    await resend.emails.send({
      from: FROM_EMAIL,
      to: "aurralismontessori@gmail.com",
      subject: `New Teacher Invited: ${name}`,
      html: `
        <div style="font-family: 'Inter', sans-serif; padding: 24px;">
          <h2 style="color: #0f172a;">New Teacher Invitation Sent</h2>
          <p style="color: #64748b;">A new teacher invitation has been sent:</p>
          <ul style="color: #0f172a;">
            <li><strong>Name:</strong> ${name}</li>
            <li><strong>Email:</strong> ${email}</li>
            ${className ? `<li><strong>Class:</strong> ${className}</li>` : ""}
          </ul>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      messageId: data?.id,
    });
  } catch (error) {
    console.error("Invitation error:", error);
    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 }
    );
  }
}

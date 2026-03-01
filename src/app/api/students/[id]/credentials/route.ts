import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { hash } from "bcryptjs";

/** Generates a readable random password — avoids ambiguous chars (0,O,l,1,I). */
function generatePassword(length = 10): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let pw = "";
    for (let i = 0; i < length; i++) {
        pw += chars[Math.floor(Math.random() * chars.length)];
    }
    return pw;
}

export async function POST(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const student = await prisma.student.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                parentName: true,
                parentEmail: true,
                enrollmentId: true,
                class: { select: { name: true, section: true } },
            },
        });

        if (!student) {
            return NextResponse.json({ error: "Student not found" }, { status: 404 });
        }

        if (!student.parentEmail) {
            return NextResponse.json(
                { error: "No parent email on record. Add an email first." },
                { status: 400 }
            );
        }

        // Generate a fresh plain-text password and hash it
        const plainPassword = generatePassword();
        const passwordHash = await hash(plainPassword, 12);

        // Persist the hash
        await prisma.student.update({
            where: { id },
            data: { parentPassword: passwordHash },
        });

        const className = student.class
            ? (student.class.section
                ? `${student.class.name} ${student.class.section}`
                : student.class.name)
            : null;

        const { error: emailError } = await resend.emails.send({
            from: FROM_EMAIL,
            to: student.parentEmail,
            subject: "Your Aurralis Montessori App Login Credentials",
            html: `
<div style="font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;max-width:560px;margin:0 auto;padding:0;">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#5B3FA0 0%,#7C5FC4 100%);padding:40px 32px;border-radius:16px 16px 0 0;text-align:center;">
    <h1 style="color:#ffffff;font-size:26px;font-weight:800;margin:0 0 4px 0;">Aurralis</h1>
    <p style="color:rgba(255,255,255,0.65);font-size:12px;margin:0;letter-spacing:1px;text-transform:uppercase;">Montessori · Parent Portal</p>
  </div>

  <!-- Body -->
  <div style="background:#ffffff;padding:40px 32px;border:1px solid #e8e4f0;border-top:none;">
    <h2 style="color:#1A1035;font-size:20px;font-weight:700;margin:0 0 8px 0;">Welcome to the Aurralis App! 🌿</h2>
    <p style="color:#6B6080;font-size:15px;line-height:1.6;margin:0 0 24px 0;">
      Hi <strong style="color:#1A1035;">${student.parentName || "Parent"}</strong>,
      your account is now active. Use the credentials below to sign in to the
      <strong style="color:#1A1035;">Aurralis Montessori</strong> parent app and stay
      connected with ${student.name}&apos;s progress.
    </p>

    <!-- Credentials Card -->
    <div style="background:#F3EFFC;border:1px solid #d4c9f0;border-radius:14px;padding:24px;margin:0 0 28px 0;">
      <p style="color:#5B3FA0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;margin:0 0 16px 0;">Your Login Details</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr style="border-bottom:1px solid #e0d8f4;">
          <td style="color:#6B6080;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;padding:10px 0;">Email</td>
          <td style="color:#1A1035;font-size:15px;font-weight:700;text-align:right;padding:10px 0;font-family:monospace;">
            ${student.parentEmail}
          </td>
        </tr>
        <tr style="border-bottom:1px solid #e0d8f4;">
          <td style="color:#6B6080;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;padding:10px 0;">Password</td>
          <td style="color:#1A1035;font-size:15px;font-weight:700;text-align:right;padding:10px 0;font-family:monospace;letter-spacing:1px;">
            ${plainPassword}
          </td>
        </tr>
        <tr>
          <td style="color:#6B6080;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;padding:10px 0 0;">Child</td>
          <td style="color:#1A1035;font-size:15px;font-weight:700;text-align:right;padding:10px 0 0;">
            ${student.name}${className ? ` &middot; ${className}` : ""}
          </td>
        </tr>
      </table>
    </div>

    <!-- Security note -->
    <div style="background:#FFF7ED;border:1px solid #fed7aa;border-radius:12px;padding:14px 16px;margin:0 0 28px 0;display:flex;align-items:flex-start;gap:10px;">
      <span style="font-size:18px;line-height:1;">🔒</span>
      <p style="color:#92400e;font-size:13px;line-height:1.5;margin:0;">
        <strong>Keep your password safe.</strong> The school will never ask for it.
        You can change it anytime inside the app under Profile → Change Password.
      </p>
    </div>

    <p style="color:#6B6080;font-size:13px;line-height:1.5;margin:0 0 4px 0;text-align:center;">
      Download the <strong style="color:#1A1035;">Aurralis</strong> app and sign in with the credentials above.
    </p>
  </div>

  <!-- Footer -->
  <div style="background:#F7F5FB;padding:20px 32px;border:1px solid #e8e4f0;border-top:none;border-radius:0 0 16px 16px;text-align:center;">
    <p style="color:#B8AED0;font-size:12px;margin:0;">
      © ${new Date().getFullYear()} Aurralis Montessori &nbsp;·&nbsp; Inspired by Nature 🌿
    </p>
  </div>

</div>
      `,
        });

        if (emailError) {
            console.error("Credential email error:", emailError);
            // Password was saved — notify caller but don't block
            return NextResponse.json(
                { error: "Credentials set but email failed to deliver. Check the parent email address." },
                { status: 502 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Send credentials error:", error);
        return NextResponse.json({ error: "Failed to send credentials" }, { status: 500 });
    }
}

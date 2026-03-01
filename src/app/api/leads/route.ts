import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LeadStatus } from "@prisma/client";
import { z } from "zod";

const createLeadSchema = z.object({
    parentName: z.string().min(1).max(100),
    childName: z.string().min(1).max(100),
    childAge: z.number().positive().max(18),
    childProgram: z.string().min(1).max(100),
    email: z.string().max(200).optional(),
    phone: z.string().max(20).optional(),
    intentLevel: z.enum(["Hot", "Warm", "Cold"]).optional(),
    notes: z.string().max(2000).optional(),
});

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search");
        const status = searchParams.get("status");

        const where: Record<string, unknown> = {};

        if (search) {
            where.OR = [
                { parentName: { contains: search, mode: 'insensitive' } },
                { childName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (status && status !== "ALL") {
            where.status = status as LeadStatus;
        }

        const leads = await prisma.lead.findMany({
            where,
            include: {
                activities: {
                    orderBy: { date: 'desc' },
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const formattedLeads = leads.map((lead) => {
            const lastActivity = lead.activities[0] ?? null;
            // Find the most recent upcoming TOUR activity for Next Action
            const now = new Date();
            const nextTour = lead.activities.find(
                (a) => a.type === 'TOUR' && a.scheduledFor && new Date(a.scheduledFor) >= now
            ) ?? lead.activities.find((a) => a.type === 'TOUR' && a.scheduledFor) ?? null;

            return {
                id: lead.id,
                parentName: lead.parentName,
                childName: lead.childName,
                childAge: lead.childAge,
                childProgram: lead.childProgram,
                email: lead.email,
                phone: lead.phone,
                status: lead.status,
                leadScore: lead.leadScore,
                intentLevel: lead.intentLevel,
                createdAt: lead.createdAt,
                lastActivity: lastActivity ? {
                    type: lastActivity.type,
                    text: lastActivity.text,
                    date: lastActivity.date,
                    scheduledFor: lastActivity.scheduledFor,
                } : null,
                nextTourDate: nextTour?.scheduledFor ?? null,
            };
        });

        return NextResponse.json(formattedLeads);
    } catch (error) {
        console.error("Leads fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch leads" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parsed = createLeadSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid input", details: parsed.error.issues },
                { status: 400 }
            );
        }
        const d = parsed.data;

        let leadScore = 50;
        if (d.intentLevel === "Hot") leadScore = 90;
        else if (d.intentLevel === "Warm") leadScore = 60;
        else if (d.intentLevel === "Cold") leadScore = 30;

        const newLead = await prisma.lead.create({
            data: {
                parentName: d.parentName,
                childName: d.childName,
                childAge: d.childAge,
                childProgram: d.childProgram,
                email: d.email || null,
                phone: d.phone || null,
                status: 'NEW',
                leadScore,
                intentLevel: d.intentLevel ?? "Warm",
            },
        });

        await prisma.leadActivity.create({
            data: {
                leadId: newLead.id,
                type: 'SYSTEM',
                text: 'Lead created via Admin Dashboard',
            },
        });

        if (d.notes) {
            await prisma.leadActivity.create({
                data: {
                    leadId: newLead.id,
                    type: 'NOTE',
                    text: d.notes,
                }
            });
        }

        return NextResponse.json(newLead, { status: 201 });
    } catch (error) {
        console.error("Failed to create lead:", error);
        return NextResponse.json(
            { error: "Failed to create lead" },
            { status: 500 }
        );
    }
}

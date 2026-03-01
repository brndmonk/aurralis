import { PrismaClient, Role, Gender, StudentStatus, FeeStatus, AttendanceStatus, EventType, LeadStatus, ActivityType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database...");

    // Clean existing data
    await prisma.leadActivity.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.document.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.fee.deleteMany();
    await prisma.student.deleteMany();
    await prisma.event.deleteMany();
    await prisma.class.deleteMany();
    await prisma.user.deleteMany();

    // ─── Users ──────────────────────────────────────────────
    const admin = await prisma.user.create({
        data: {
            name: "Sarah Jenkins",
            email: "sarah.jenkins@aurralis.edu",
            role: Role.ADMIN,
            phone: "+65 9123 4567",
        },
    });

    const teachers = await Promise.all([
        prisma.user.create({
            data: { name: "Eleanor Rigby", email: "eleanor.rigby@aurralis.edu", role: Role.TEACHER, phone: "+65 9234 5678" },
        }),
        prisma.user.create({
            data: { name: "Martha Steward", email: "martha.steward@aurralis.edu", role: Role.TEACHER, phone: "+65 9345 6789" },
        }),
        prisma.user.create({
            data: { name: "John Doe", email: "john.doe@aurralis.edu", role: Role.TEACHER, phone: "+65 9456 7890" },
        }),
        prisma.user.create({
            data: { name: "Sarah Connor", email: "sarah.connor@aurralis.edu", role: Role.TEACHER, phone: "+65 9567 8901" },
        }),
        prisma.user.create({
            data: { name: "Lisa Chen", email: "lisa.chen@aurralis.edu", role: Role.TEACHER, phone: "+65 9678 9012" },
        }),
    ]);

    // ─── Classes ────────────────────────────────────────────
    const classes = await Promise.all([
        prisma.class.create({ data: { name: "Toddler A", section: "Toddler Program", teacherId: teachers[0].id, capacity: 20 } }),
        prisma.class.create({ data: { name: "Toddler B", section: "Toddler Program", teacherId: teachers[3].id, capacity: 20 } }),
        prisma.class.create({ data: { name: "Kindergarten B", section: "Kindergarten", teacherId: teachers[1].id, capacity: 15 } }),
        prisma.class.create({ data: { name: "Grade 1 - C", section: "Primary School", teacherId: teachers[2].id, capacity: 25 } }),
        prisma.class.create({ data: { name: "Grade 2 - A", section: "Primary School", teacherId: teachers[4].id, capacity: 30 } }),
        prisma.class.create({ data: { name: "Grade 3 - A", section: "Primary School", teacherId: teachers[0].id, capacity: 30 } }),
    ]);

    // ─── Students (assigned to classes) ─────────────────────
    const studentNames = [
        "Alice Freeman", "Jason Bourne", "Sophia Martinez", "Liam Johnson",
        "Olivia Williams", "Noah Brown", "Emma Davis", "Ava Wilson",
        "Lucas Miller", "Mia Anderson", "Ethan Taylor", "Isabella Thomas",
        "Aiden Jackson", "Charlotte White", "Mason Harris", "Amelia Martin",
        "Logan Thompson", "Harper Garcia", "James Robinson", "Evelyn Clark",
        "Benjamin Lewis", "Abigail Walker", "Alexander Hall", "Emily Allen",
        "Henry Young", "Ella King", "Sebastian Wright", "Avery Scott",
        "Jack Green", "Sofia Adams", "Owen Baker", "Chloe Nelson",
        "Daniel Hill", "Aria Campbell", "Matthew Mitchell", "Luna Roberts",
        "Samuel Carter", "Penelope Phillips", "Joseph Evans", "Riley Turner",
        "David Collins", "Layla Edwards", "Carter Stewart", "Zoey Sanchez",
        "Wyatt Morris", "Nora Rogers", "Luke Reed", "Hannah Cook",
    ];

    const students = [];
    for (let i = 0; i < studentNames.length; i++) {
        const classIndex = i % classes.length;
        const genders: Gender[] = [Gender.MALE, Gender.FEMALE];
        const student = await prisma.student.create({
            data: {
                name: studentNames[i],
                enrollmentId: `ST-2023-${String(i + 1).padStart(3, "0")}`,
                classId: classes[classIndex].id,
                parentName: `Parent of ${studentNames[i]}`,
                parentPhone: `+65 ${9000 + i} ${1000 + i}`,
                parentEmail: `parent${i + 1}@email.com`,
                gender: genders[i % 2],
                dateOfBirth: new Date(2017 - classIndex, 3, (i % 28) + 1),
                enrolledAt: new Date(2023, i % 6, (i % 28) + 1),
                status: StudentStatus.ACTIVE,
            },
        });
        students.push(student);
    }

    // More students to fill up classes (~100 total assigned)
    for (let i = studentNames.length; i < 100; i++) {
        const classIndex = i % classes.length;
        const genders: Gender[] = [Gender.MALE, Gender.FEMALE];
        const student = await prisma.student.create({
            data: {
                name: `Student ${i + 1}`,
                enrollmentId: `ST-2023-${String(i + 1).padStart(3, "0")}`,
                classId: classes[classIndex].id,
                parentName: `Parent ${i + 1}`,
                parentPhone: `+65 ${8000 + i} ${2000 + i}`,
                gender: genders[i % 2],
                dateOfBirth: new Date(2017 - classIndex, i % 12, (i % 28) + 1),
                enrolledAt: new Date(2023, i % 6, (i % 28) + 1),
                status: StudentStatus.ACTIVE,
            },
        });
        students.push(student);
    }

    // ─── Unassigned Students (for Quick Allocation panel) ───
    const unassignedNames = [
        "James Smith", "Emma Lee", "Olivia Anderson", "Lucas Brown",
        "Sophia Martinez Jr", "Noah Garcia", "Mia Johnson", "Ethan White",
    ];
    for (let i = 0; i < unassignedNames.length; i++) {
        await prisma.student.create({
            data: {
                name: unassignedNames[i],
                enrollmentId: `ST-2024-U${String(i + 1).padStart(3, "0")}`,
                classId: null, // unassigned
                parentName: `Parent of ${unassignedNames[i]}`,
                parentPhone: `+65 7${i}00 ${i}000`,
                gender: i % 2 === 0 ? Gender.MALE : Gender.FEMALE,
                dateOfBirth: new Date(2019, i % 12, (i % 28) + 1),
                enrolledAt: new Date(2024, 0, 15),
                status: StudentStatus.ACTIVE,
            },
        });
    }

    // ─── Attendance (past 30 days) ──────────────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
        const date = new Date(today);
        date.setDate(date.getDate() - dayOffset);
        const dayOfWeek = date.getDay();

        // Skip weekends
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;

        for (const student of students) {
            const rand = Math.random();
            let status: AttendanceStatus;
            if (rand < 0.88) status = AttendanceStatus.PRESENT;
            else if (rand < 0.93) status = AttendanceStatus.LATE;
            else if (rand < 0.97) status = AttendanceStatus.EXCUSED;
            else status = AttendanceStatus.ABSENT;

            await prisma.attendance.create({
                data: {
                    studentId: student.id,
                    date,
                    status,
                    markedById: admin.id,
                },
            });
        }
    }

    // ─── Fees ───────────────────────────────────────────────
    const feeTypes = [
        { desc: "Tuition Fee - Term 1", amount: 1200 },
        { desc: "Transport (Zone A)", amount: 150 },
        { desc: "Activity Fee", amount: 320 },
        { desc: "Material Fee", amount: 280 },
        { desc: "Uniform Kit", amount: 85 },
        { desc: "Field Trip Fee", amount: 150 },
        { desc: "Tuition Fee - Term 2", amount: 1200 },
        { desc: "Exam Fee", amount: 100 },
    ];

    for (let i = 0; i < students.length; i++) {
        // Each student gets 2-3 fee records
        const numFees = 2 + (i % 2);
        for (let f = 0; f < numFees; f++) {
            const feeType = feeTypes[(i + f) % feeTypes.length];
            const isPaid = Math.random() > 0.35;
            const isOverdue = !isPaid && Math.random() > 0.5;
            const dueDate = new Date(2024, f, 14 - (i % 7));
            const paidDate = isPaid ? new Date(dueDate.getTime() - Math.random() * 7 * 86400000) : null;

            await prisma.fee.create({
                data: {
                    studentId: students[i].id,
                    amount: feeType.amount,
                    dueDate,
                    paidDate,
                    status: isPaid ? FeeStatus.PAID : (isOverdue ? FeeStatus.OVERDUE : FeeStatus.PENDING),
                    description: feeType.desc,
                },
            });
        }
    }

    // ─── Events ─────────────────────────────────────────────
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    await prisma.event.createMany({
        data: [
            {
                title: "Morning Assembly",
                description: "Weekly school-wide assembly",
                startDate: new Date(thisYear, thisMonth, now.getDate(), 9, 0),
                endDate: new Date(thisYear, thisMonth, now.getDate(), 9, 30),
                location: "Main Hall",
                type: EventType.ACTIVITY,
            },
            {
                title: "Parent-Teacher Meeting",
                description: "Annual parent-teacher conference",
                startDate: new Date(thisYear, thisMonth, now.getDate(), 14, 30),
                endDate: new Date(thisYear, thisMonth, now.getDate(), 16, 0),
                location: "Room 102",
                type: EventType.MEETING,
            },
            {
                title: "Math Olympiad Prep",
                description: "Preparation session for math olympiad",
                startDate: new Date(thisYear, thisMonth, now.getDate() + 1, 10, 0),
                endDate: new Date(thisYear, thisMonth, now.getDate() + 1, 12, 0),
                location: "Library",
                type: EventType.ACTIVITY,
            },
            {
                title: "Staff Meeting",
                description: "Monthly staff coordination meeting",
                startDate: new Date(thisYear, thisMonth, 2, 9, 0),
                endDate: new Date(thisYear, thisMonth, 2, 10, 0),
                location: "Conference Room",
                type: EventType.MEETING,
            },
            {
                title: "Science Fair",
                description: "Annual science fair for all grades",
                startDate: new Date(thisYear, thisMonth, 4, 10, 0),
                endDate: new Date(thisYear, thisMonth, 4, 15, 0),
                location: "Auditorium",
                type: EventType.EXHIBITION,
            },
            {
                title: "Fall Break",
                description: "Fall break period",
                startDate: new Date(thisYear, thisMonth, 10),
                endDate: new Date(thisYear, thisMonth, 12),
                location: "Campus Closed",
                type: EventType.HOLIDAY,
            },
            {
                title: "Field Trip: City Zoo",
                description: "Educational field trip to the city zoo",
                startDate: new Date(thisYear, thisMonth, now.getDate() + 3, 8, 0),
                endDate: new Date(thisYear, thisMonth, now.getDate() + 3, 16, 0),
                location: "City Zoo",
                type: EventType.ACTIVITY,
            },
            {
                title: "Mid-term Exams",
                description: "Mid-term examination period",
                startDate: new Date(thisYear, thisMonth, 22),
                endDate: new Date(thisYear, thisMonth, 24),
                location: "Classrooms",
                type: EventType.ACTIVITY,
            },
            {
                title: "PTA Meeting",
                description: "Parent Teacher Association monthly meeting",
                startDate: new Date(thisYear, thisMonth, 14, 14, 30),
                endDate: new Date(thisYear, thisMonth, 14, 16, 0),
                location: "Room 102",
                type: EventType.MEETING,
            },
            {
                title: "Review Day",
                description: "Academic review and preparation day",
                startDate: new Date(thisYear, thisMonth, 29, 9, 0),
                endDate: new Date(thisYear, thisMonth, 29, 15, 0),
                location: "Classrooms",
                type: EventType.ACTIVITY,
            },
            {
                title: "Spring Celebration",
                description: "End of season celebration with performances",
                startDate: new Date(thisYear, thisMonth + 1, 5, 10, 0),
                endDate: new Date(thisYear, thisMonth + 1, 5, 14, 0),
                location: "Auditorium",
                type: EventType.ACTIVITY,
            },
        ],
    });

    // ─── Leads & Activities ─────────────────────────────────
    const leadsData = [
        {
            parentName: "Sarah Jenkins",
            childName: "Noah",
            childAge: 3,
            childProgram: "Toddler Program",
            email: "sarah.j@example.com",
            phone: "+65 9111 2222",
            status: LeadStatus.TOUR_SCHEDULED,
            leadScore: 85,
            intentLevel: "High Intent",
        },
        {
            parentName: "Michael Ross",
            childName: "Emma",
            childAge: 4,
            childProgram: "Primary",
            email: "m.ross88@gmail.com",
            phone: "+65 9333 4444",
            status: LeadStatus.NEW,
            leadScore: 50,
        },
        {
            parentName: "Emily Chen",
            childName: "Leo",
            childAge: 2.5,
            childProgram: "Toddler",
            email: "chen.emily@work.com",
            phone: "+65 9555 6666",
            status: LeadStatus.APPLICATION_SENT,
            leadScore: 90,
            intentLevel: "High Intent",
        },
        {
            parentName: "David Miller",
            childName: "Sophie",
            childAge: 5,
            childProgram: "Primary",
            email: "david.miller@mail.com",
            phone: "+65 9777 8888",
            status: LeadStatus.WAITLIST,
            leadScore: 20,
        },
        {
            parentName: "Jessica White",
            childName: "Oliver",
            childAge: 3,
            childProgram: "Toddler",
            email: "j.white@design.net",
            phone: "+65 9999 0000",
            status: LeadStatus.TOUR_COMPLETED,
            leadScore: 65,
        }
    ];

    const createdLeads = [];
    for (const data of leadsData) {
        const lead = await prisma.lead.create({ data });
        createdLeads.push(lead);
    }

    // Add activities to Sarah Jenkins
    await prisma.leadActivity.createMany({
        data: [
            {
                leadId: createdLeads[0].id,
                type: ActivityType.SYSTEM,
                text: "Lead Created",
                date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2),
            },
            {
                leadId: createdLeads[0].id,
                type: ActivityType.EMAIL,
                text: "Email Sent: Brochure_2024.pdf",
                date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 9, 15),
                createdById: admin.id,
            },
            {
                leadId: createdLeads[0].id,
                type: ActivityType.CALL,
                text: "Phone Call Outbound: Discussed dietary requirements for Noah. Confirmed peanut allergy policy. Parent seemed satisfied.",
                date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 14, 30),
                createdById: admin.id,
            },
            {
                leadId: createdLeads[0].id,
                type: ActivityType.TOUR,
                text: "School Tour scheduled with Ms. Thompson",
                date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0),
                scheduledFor: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0),
                createdById: teachers[0].id,
            },
        ]
    });

    console.log("✅ Seeding complete!");

    // --- Create Default System Settings ---
    const settings = await prisma.systemSettings.create({
        data: {
            academicYear: "2023 - 2024",
            currentTerm: "Term 1 (Autumn)",
            startDate: new Date("2023-09-01"),
            endDate: new Date("2024-06-30"),
            stripeEnabled: true,
            razorpayEnabled: false,
            twilioEnabled: false,
            resendEnabled: true,
            webhooksEnabled: false,
        }
    });

    console.log(`Created System Settings.`);

    // --- Create Fee Templates ---
    const feeTemplates = await prisma.feeTemplate.createMany({
        data: [
            { type: "Primary Tuition", frequency: "Per Term", frequencyColor: "text-text-secondary", amount: 120000, isDefault: true },
            { type: "Transport (Zone A)", frequency: "Monthly", frequencyColor: "text-accent", amount: 15000, isDefault: true },
            { type: "Uniform Kit (Starter)", frequency: "One-time", frequencyColor: "text-text-muted", amount: 8500, isDefault: true },
        ]
    });

    console.log(`Created ${feeTemplates.count} fee templates.`);

    console.log('Seeding finished.');
    console.log(`   Created ${await prisma.user.count()} users`);
    console.log(`   Created ${await prisma.class.count()} classes`);
    console.log(`   Created ${await prisma.student.count()} students (${unassignedNames.length} unassigned)`);
    console.log(`   Created ${await prisma.attendance.count()} attendance records`);
    console.log(`   Created ${await prisma.fee.count()} fee records`);
    console.log(`   Created ${await prisma.event.count()} events`);
    console.log(`   Created ${await prisma.lead.count()} leads`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Header from "@/components/header";
import StatCard from "@/components/dashboard/stat-card";
import EnrollmentChart, { EnrollmentData } from "@/components/dashboard/enrollment-chart";
import UpcomingEvents, { EventItem } from "@/components/dashboard/upcoming-events";
import FeeTable, { FeeRecord } from "@/components/dashboard/fee-table";
import {
    GraduationCap,
    ClipboardCheck,
    DollarSign,
    AlertTriangle,
    Plus,
    X,
    Loader2,
    UserCheck,
    ArrowRight,
    Sparkles,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────

interface RecentEnrollment {
    id: string;
    name: string;
    enrollmentId: string;
    className: string;
    enrolledAt: string;
    status: string;
    gender: string | null;
}

interface ApiClass {
    id: string;
    name: string;
    section: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────

const getInitials = (name: string) =>
    name.split(" ").map(n => n.charAt(0)).join("").substring(0, 2).toUpperCase();

const AVATAR_COLORS = [
    "from-pink-400 to-rose-500",
    "from-blue-400 to-indigo-500",
    "from-amber-400 to-orange-500",
    "from-purple-400 to-violet-500",
    "from-cyan-400 to-teal-500",
    "from-emerald-400 to-green-500",
];

function getAvatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

const eventColors: Record<string, string> = {
    MEETING: "#3b82f6",
    HOLIDAY: "#22c55e",
    ACTIVITY: "#ef4444",
    EXHIBITION: "#8b5cf6",
    OTHER: "#8b5cf6",
};

// ─── New Enrollment Modal ────────────────────────────────────

function NewEnrollmentModal({
    classes,
    onClose,
    onEnrolled,
}: {
    classes: ApiClass[];
    onClose: () => void;
    onEnrolled: (name: string) => void;
}) {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        name: "",
        enrollmentId: "",
        classId: "",
        parentName: "",
        parentPhone: "",
        parentEmail: "",
        dateOfBirth: "",
        gender: "MALE",
    });
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

    const handleSubmit = async (e: { preventDefault: () => void }) => {
        e.preventDefault();
        if (!form.name.trim() || !form.enrollmentId.trim()) {
            setErr("Student name and enrollment ID are required.");
            return;
        }
        setSaving(true);
        setErr(null);
        try {
            const res = await fetch("/api/students", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name,
                    enrollmentId: form.enrollmentId,
                    classId: form.classId || null,
                    parentName: form.parentName || null,
                    parentPhone: form.parentPhone || null,
                    parentEmail: form.parentEmail || null,
                    dateOfBirth: form.dateOfBirth || null,
                    gender: form.gender,
                }),
            });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error(d.error || "Failed to enroll student");
            }
            onEnrolled(form.name);
            onClose();
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : "Enrollment failed. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const inputClass =
        "w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-text-muted";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                            <UserCheck className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-text-primary">New Student Enrollment</h2>
                            <p className="text-xs text-text-muted">
                                Step {step} of 2 — {step === 1 ? "Student Details" : "Parent & Class Info"}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-surface-alt text-text-muted transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Step Progress Bar */}
                <div className="flex px-6 pt-4 pb-1 gap-2">
                    {[1, 2].map(s => (
                        <div
                            key={s}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${s <= step ? "bg-accent" : "bg-surface-alt"}`}
                        />
                    ))}
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                        {step === 1 ? (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                                            Full Name <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            value={form.name}
                                            onChange={e => set("name", e.target.value)}
                                            placeholder="Emma Thompson"
                                            className={inputClass}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                                            Enrollment ID <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            value={form.enrollmentId}
                                            onChange={e => set("enrollmentId", e.target.value)}
                                            placeholder="STD-2025-001"
                                            className={inputClass}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-text-secondary mb-1.5">Date of Birth</label>
                                        <input
                                            type="date"
                                            value={form.dateOfBirth}
                                            onChange={e => set("dateOfBirth", e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-text-secondary mb-1.5">Gender</label>
                                        <select
                                            value={form.gender}
                                            onChange={e => set("gender", e.target.value)}
                                            className={inputClass}>
                                            <option value="MALE">Male</option>
                                            <option value="FEMALE">Female</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">Assign to Class</label>
                                    <select
                                        value={form.classId}
                                        onChange={e => set("classId", e.target.value)}
                                        className={inputClass}>
                                        <option value="">— Assign Later —</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}{c.section ? ` ${c.section}` : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                                        Parent / Guardian Name
                                    </label>
                                    <input
                                        value={form.parentName}
                                        onChange={e => set("parentName", e.target.value)}
                                        placeholder="Sarah Thompson"
                                        className={inputClass}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-text-secondary mb-1.5">Parent Phone</label>
                                        <input
                                            value={form.parentPhone}
                                            onChange={e => set("parentPhone", e.target.value)}
                                            placeholder="+91 98765 43210"
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-text-secondary mb-1.5">Parent Email</label>
                                        <input
                                            type="email"
                                            value={form.parentEmail}
                                            onChange={e => set("parentEmail", e.target.value)}
                                            placeholder="parent@email.com"
                                            className={inputClass}
                                        />
                                    </div>
                                </div>

                                {/* Enrollment Summary */}
                                {form.name && (
                                    <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
                                        <p className="text-xs font-bold text-accent mb-3 uppercase tracking-wider flex items-center gap-1.5">
                                            <Sparkles className="w-3.5 h-3.5" />
                                            Enrollment Summary
                                        </p>
                                        <div className="space-y-2">
                                            {[
                                                { label: "Student", value: form.name },
                                                { label: "ID", value: `#${form.enrollmentId}` },
                                                {
                                                    label: "Class",
                                                    value: form.classId
                                                        ? (classes.find(c => c.id === form.classId)?.name || "—")
                                                        : "To be assigned",
                                                },
                                                ...(form.parentName ? [{ label: "Parent", value: form.parentName }] : []),
                                            ].map(row => (
                                                <div key={row.label} className="flex items-center justify-between">
                                                    <span className="text-xs text-text-muted">{row.label}</span>
                                                    <span className="text-xs font-semibold text-text-primary">{row.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {err && (
                            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{err}</p>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center gap-3 px-6 py-4 border-t border-border bg-surface-alt/30">
                        {step === 2 && (
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-text-secondary hover:bg-surface-alt transition-all">
                                Back
                            </button>
                        )}
                        {step === 1 ? (
                            <button
                                type="button"
                                onClick={() => {
                                    if (!form.name.trim() || !form.enrollmentId.trim()) {
                                        setErr("Name and Enrollment ID are required before continuing.");
                                        return;
                                    }
                                    setErr(null);
                                    setStep(2);
                                }}
                                className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-dark text-white font-bold text-sm rounded-xl shadow-md shadow-accent/25 transition-all active:scale-[0.98]">
                                Continue
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={saving}
                                className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-dark text-white font-bold text-sm rounded-xl shadow-md shadow-accent/25 transition-all active:scale-[0.98] disabled:opacity-70">
                                {saving
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <Sparkles className="w-4 h-4" />
                                }
                                {saving ? "Enrolling..." : "Complete Enrollment"}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Page Component ─────────────────────────────────────────

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalStudents: 0,
        attendanceRate: 0,
        monthlyRevenue: 0,
        pendingDues: 0,
        newLeadsCount: 0,
        prevMonthStudents: 0,
        prevMonthRevenue: 0,
        yesterdayAttendanceRate: 0,
    });
    const [enrollmentData, setEnrollmentData] = useState<EnrollmentData[]>([]);
    const [events, setEvents] = useState<EventItem[]>([]);
    const [fees, setFees] = useState<FeeRecord[]>([]);
    const [recentEnrollments, setRecentEnrollments] = useState<RecentEnrollment[]>([]);
    const [classes, setClasses] = useState<ApiClass[]>([]);
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [successBanner, setSuccessBanner] = useState<string | null>(null);

    const fetchAll = useCallback(async () => {
        try {
            const [statsRes, classRes] = await Promise.all([
                fetch("/api/dashboard/stats"),
                fetch("/api/classes"),
            ]);
            const data = await statsRes.json();
            const classData = await classRes.json();

            setStats(data.stats);
            setEnrollmentData(data.enrollmentData);
            setRecentEnrollments(data.recentEnrollments || []);

            if (Array.isArray(classData)) setClasses(classData);

            setEvents((data.upcomingEvents || []).map((e: { date: string; endDate?: string; title: string; location?: string; type: string }) => {
                const d = new Date(e.date);
                const end = e.endDate ? new Date(e.endDate) : null;
                const fmt = (dt: Date) =>
                    dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
                return {
                    month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
                    day: d.getDate().toString().padStart(2, "0"),
                    title: e.title,
                    time: end ? `${fmt(d)} – ${fmt(end)}` : fmt(d),
                    location: e.location || "TBA",
                    color: eventColors[e.type] || eventColors["OTHER"],
                };
            }));

            setFees((data.recentFees || []).map((f: { studentName: string; studentId: string; className: string; paidDate?: string; dueDate: string; amount: number; status: string }) => ({
                studentName: f.studentName,
                id: f.studentId,
                class: f.className,
                date: new Date(f.paidDate || f.dueDate).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                }),
                amount: formatCurrency(f.amount),
                status: f.status === "PAID" ? "Paid" : f.status === "PENDING" ? "Pending" : "Overdue",
                avatar: getInitials(f.studentName),
            })));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleEnrolled = (name: string) => {
        setSuccessBanner(`${name} has been successfully enrolled!`);
        fetchAll();
        setTimeout(() => setSuccessBanner(null), 4000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] text-text-muted">
                <Loader2 className="w-8 h-8 animate-spin mr-3" />
                <span className="text-sm font-medium">Loading dashboard...</span>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {showEnrollModal && (
                <NewEnrollmentModal
                    classes={classes}
                    onClose={() => setShowEnrollModal(false)}
                    onEnrolled={handleEnrolled}
                />
            )}

            {/* Success Banner */}
            {successBanner && (
                <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-emerald-500 text-white px-5 py-3.5 rounded-xl shadow-2xl shadow-emerald-500/30 animate-fade-in">
                    <UserCheck className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-semibold">{successBanner}</span>
                    <button onClick={() => setSuccessBanner(null)} className="ml-1 opacity-80 hover:opacity-100 transition-opacity">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* ─── Header ─── */}
            <div className="flex items-start justify-between mb-8">
                <Header
                    title="Dashboard Overview"
                    subtitle="Welcome back — here's what's happening at your school today."
                />
                <button
                    onClick={() => setShowEnrollModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-dark text-white font-bold text-sm rounded-xl shadow-md shadow-accent/25 transition-all active:scale-[0.98] flex-shrink-0 mt-1">
                    <Plus className="w-4 h-4" />
                    New Enrollment
                </button>
            </div>

            {/* ─── Stat Cards ─── */}
            {(() => {
                const studentDiff = stats.totalStudents - stats.prevMonthStudents;
                const studentTrend = studentDiff >= 0 ? `+${studentDiff}` : `${studentDiff}`;

                const attendanceDiff = stats.attendanceRate - stats.yesterdayAttendanceRate;
                const attendanceTrend = attendanceDiff >= 0 ? `+${attendanceDiff}%` : `${attendanceDiff}%`;

                const revenuePct = stats.prevMonthRevenue > 0
                    ? Math.round(((stats.monthlyRevenue - stats.prevMonthRevenue) / stats.prevMonthRevenue) * 100)
                    : 0;
                const revenueTrend = revenuePct >= 0 ? `+${revenuePct}%` : `${revenuePct}%`;

                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 stagger-children">
                        <StatCard
                            title="Total Students"
                            value={stats.totalStudents.toString()}
                            trend={{ value: studentTrend, isPositive: studentDiff >= 0, label: "vs last month" }}
                            icon={GraduationCap}
                            iconBg="#dbeafe"
                            iconColor="#3b82f6"
                        />
                        <StatCard
                            title="Today's Attendance"
                            value={`${stats.attendanceRate}%`}
                            trend={{ value: attendanceTrend, isPositive: attendanceDiff >= 0, label: "vs yesterday" }}
                            icon={ClipboardCheck}
                            iconBg="#dcfce7"
                            iconColor="#22c55e"
                        />
                        <StatCard
                            title="Monthly Revenue"
                            value={formatCurrency(stats.monthlyRevenue)}
                            trend={{ value: revenueTrend, isPositive: revenuePct >= 0, label: "vs last month" }}
                            icon={DollarSign}
                            iconBg="#fef3c7"
                            iconColor="#f59e0b"
                        />
                        <StatCard
                            title="Pending Dues"
                            value={formatCurrency(stats.pendingDues)}
                            trend={{ value: `${stats.newLeadsCount} leads`, isPositive: false, label: "in pipeline" }}
                            icon={AlertTriangle}
                            iconBg="#fee2e2"
                            iconColor="#ef4444"
                        />
                    </div>
                );
            })()}

            {/* ─── Chart & Events Row ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2">
                    <EnrollmentChart data={enrollmentData} />
                </div>
                <div>
                    <UpcomingEvents data={events} />
                </div>
            </div>

            {/* ─── Recent Enrollments + Fee Table ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Enrollments */}
                <div className="card p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="text-lg font-bold text-text-primary">Recent Enrollments</h3>
                            <p className="text-xs text-text-muted mt-0.5">Latest students added</p>
                        </div>
                        <Link
                            href="/dashboard/students"
                            className="text-xs font-bold text-accent hover:text-accent-dark transition-colors flex items-center gap-1">
                            View All
                            <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>

                    <div className="flex-1 space-y-2">
                        {recentEnrollments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <div className="w-12 h-12 rounded-2xl bg-surface-alt flex items-center justify-center mb-3">
                                    <GraduationCap className="w-6 h-6 text-text-muted" />
                                </div>
                                <p className="text-sm text-text-muted mb-4">No enrollments yet.</p>
                                <button
                                    onClick={() => setShowEnrollModal(true)}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-accent/10 text-accent text-xs font-bold rounded-xl hover:bg-accent/20 transition-all">
                                    <Plus className="w-3.5 h-3.5" />
                                    Enroll First Student
                                </button>
                            </div>
                        ) : (
                            recentEnrollments.map(student => (
                                <div
                                    key={student.id}
                                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-alt/70 transition-colors">
                                    <div
                                        className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(student.name)} flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0`}>
                                        {getInitials(student.name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-text-primary truncate">{student.name}</p>
                                        <p className="text-[11px] text-text-muted truncate">
                                            {student.className} · #{student.enrollmentId}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${student.status === "ACTIVE" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                                            {student.status === "ACTIVE" ? "Active" : student.status}
                                        </span>
                                        <p className="text-[10px] text-text-muted mt-0.5">{timeAgo(student.enrolledAt)}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <button
                        onClick={() => setShowEnrollModal(true)}
                        className="mt-4 w-full py-2.5 rounded-xl border border-dashed border-accent/30 text-accent text-sm font-semibold hover:bg-accent/5 hover:border-accent/50 transition-all flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" />
                        New Enrollment
                    </button>
                </div>

                {/* Fee Table */}
                <div className="lg:col-span-2">
                    <FeeTable data={fees} />
                </div>
            </div>
        </div>
    );
}

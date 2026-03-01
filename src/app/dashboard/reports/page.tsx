"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    FileText,
    FileSpreadsheet,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    Calendar,
    UserX,
    Loader2,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────

type AttendanceStatus = "present" | "absent" | "leave" | "weekend" | "none";

interface ApiAttendanceRecord {
    id: string;
    studentId: string;
    date: string;
    status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
    student: { id: string; name: string; enrollmentId: string; classId: string };
}

interface ApiClass {
    id: string;
    name: string;
    section: string | null;
}

interface StudentAttendance {
    id: string;
    name: string;
    days: AttendanceStatus[];
}

// ─── Helpers ─────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function getDayOfWeek(year: number, month: number, day: number) {
    return new Date(year, month, day).getDay();
}

function mapStatus(status: string): AttendanceStatus {
    if (status === "PRESENT") return "present";
    if (status === "ABSENT") return "absent";
    if (status === "LATE" || status === "EXCUSED") return "leave";
    return "none";
}

const AVATAR_COLORS = [
    "from-blue-400 to-blue-600", "from-purple-400 to-purple-600",
    "from-amber-400 to-amber-600", "from-rose-400 to-rose-600",
    "from-emerald-400 to-emerald-600", "from-cyan-400 to-cyan-600",
    "from-pink-400 to-pink-600", "from-indigo-400 to-indigo-600",
];

function getAvatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
    return name.split(" ").map(n => n[0] ?? "").join("").substring(0, 2).toUpperCase();
}

const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

const statusDot: Record<AttendanceStatus, string> = {
    present: "bg-accent",
    absent: "bg-red-400",
    leave: "bg-amber-400",
    weekend: "bg-gray-200",
    none: "bg-transparent border border-gray-200",
};

const statusLegend = [
    { label: "Present", color: "bg-accent" },
    { label: "Absent", color: "bg-red-400" },
    { label: "Leave/Late", color: "bg-amber-400" },
    { label: "Weekend", color: "bg-gray-300" },
];

// ─── Page Component ─────────────────────────────────────────

export default function ReportsPage() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Derive default academic year (July–June)
    const defaultAcYear = currentMonth >= 6
        ? `${currentYear}-${currentYear + 1}`
        : `${currentYear - 1}-${currentYear}`;

    const [academicYear, setAcademicYear] = useState(defaultAcYear);
    const [classes, setClasses] = useState<ApiClass[]>([]);
    const [selectedClassId, setSelectedClassId] = useState("");
    const [selectedMonth, setSelectedMonth] = useState(String(currentMonth));
    const [attendanceData, setAttendanceData] = useState<StudentAttendance[]>([]);
    const [loading, setLoading] = useState(false);
    const [classesLoading, setClassesLoading] = useState(true);
    const [page, setPage] = useState(0);
    const perPage = 5;

    // Derive month/year from filters
    const yearStart = parseInt(academicYear.split("-")[0]);
    const monthIndex = parseInt(selectedMonth);
    const reportYear = monthIndex >= 6 ? yearStart : yearStart + 1;
    const totalDays = getDaysInMonth(reportYear, monthIndex);
    const monthName = new Date(reportYear, monthIndex).toLocaleString("default", { month: "long", year: "numeric" });

    // Fetch classes on mount
    useEffect(() => {
        fetch("/api/classes")
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setClasses(data);
                    if (data.length > 0) setSelectedClassId(data[0].id);
                }
            })
            .catch(() => {})
            .finally(() => setClassesLoading(false));
    }, []);

    // Fetch attendance when filters change
    const fetchAttendance = useCallback(async () => {
        if (!selectedClassId) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({
                classId: selectedClassId,
                month: String(monthIndex),
                year: String(reportYear),
            });
            const res = await fetch(`/api/attendance?${params}`);
            const data = await res.json();
            const records: ApiAttendanceRecord[] = data.records || [];

            // Group records by student
            const studentMap = new Map<string, { id: string; name: string; records: Map<number, AttendanceStatus> }>();
            for (const rec of records) {
                if (!studentMap.has(rec.student.id)) {
                    studentMap.set(rec.student.id, { id: rec.student.id, name: rec.student.name, records: new Map() });
                }
                const day = new Date(rec.date).getDate();
                studentMap.get(rec.student.id)!.records.set(day, mapStatus(rec.status));
            }

            // Build day arrays
            const result: StudentAttendance[] = [];
            studentMap.forEach(student => {
                const days: AttendanceStatus[] = [];
                for (let d = 1; d <= totalDays; d++) {
                    const dow = getDayOfWeek(reportYear, monthIndex, d);
                    if (dow === 0 || dow === 6) {
                        days.push("weekend");
                    } else {
                        days.push(student.records.get(d) || "none");
                    }
                }
                result.push({ id: student.id, name: student.name, days });
            });

            setAttendanceData(result);
            setPage(0);
        } catch {
            setAttendanceData([]);
        } finally {
            setLoading(false);
        }
    }, [selectedClassId, monthIndex, reportYear, totalDays]);

    const exportCSV = () => {
        if (attendanceData.length === 0) return;
        const headers = [
            "Student",
            ...Array.from({ length: totalDays }, (_, i) => {
                const d = i + 1;
                const dow = getDayOfWeek(reportYear, monthIndex, d);
                return `${String(d).padStart(2, "0")} ${dayLabels[dow]}`;
            }),
            "Present", "Absent", "Leave",
        ];
        const rows = attendanceData.map(student => {
            const present = student.days.filter(s => s === "present").length;
            const absent = student.days.filter(s => s === "absent").length;
            const leave = student.days.filter(s => s === "leave").length;
            return [
                `"${student.name}"`,
                ...student.days.map(s => s === "present" ? "P" : s === "absent" ? "A" : s === "leave" ? "L" : s === "weekend" ? "-" : ""),
                present, absent, leave,
            ];
        });
        const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `attendance-${monthName.replace(" ", "-")}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportPDF = () => {
        window.print();
    };

    const totalStudents = attendanceData.length;
    const totalPages = Math.ceil(totalStudents / perPage);
    const visibleStudents = attendanceData.slice(page * perPage, (page + 1) * perPage);

    // Stats
    const totalSchoolDays = attendanceData[0]?.days.filter(d => d !== "weekend").length || 0;
    const totalPossible = totalSchoolDays * totalStudents;
    const totalPresent = attendanceData.reduce((sum, s) => sum + s.days.filter(d => d === "present").length, 0);
    const totalAbsent = attendanceData.reduce((sum, s) => sum + s.days.filter(d => d === "absent").length, 0);
    const totalLeave = attendanceData.reduce((sum, s) => sum + s.days.filter(d => d === "leave").length, 0);
    const avgAttendance = totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0;
    const absentRatio = totalPossible > 0 ? (totalAbsent / totalPossible) * 100 : 0;
    const leaveRatio = totalPossible > 0 ? (totalLeave / totalPossible) * 100 : 0;

    const selectStyle = {
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat" as const,
        backgroundPosition: "right 12px center",
    };

    // Build academic year options (current and previous 2)
    const acYearOptions = useMemo(() => {
        const opts = [];
        for (let i = 0; i < 3; i++) {
            const y = currentYear - i;
            opts.push(`${y}-${y + 1}`);
        }
        return opts;
    }, [currentYear]);

    return (
        <div className="animate-fade-in">
            {/* ─── Header ─── */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Attendance Reports</h1>
                    <p className="text-accent text-sm mt-0.5 font-medium">
                        Monthly summary and detailed logs for students
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={exportPDF}
                        disabled={attendanceData.length === 0}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-text-secondary text-sm font-semibold hover:bg-surface-alt hover:border-accent/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                        <FileText className="w-4 h-4" />
                        Export PDF
                    </button>
                    <button
                        onClick={exportCSV}
                        disabled={attendanceData.length === 0}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-text-secondary text-sm font-semibold hover:bg-surface-alt hover:border-accent/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                        <FileSpreadsheet className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* ─── Filters ─── */}
            <div className="card p-5 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1.5">Academic Year</label>
                        <select
                            value={academicYear}
                            onChange={e => setAcademicYear(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all appearance-none"
                            style={selectStyle}>
                            {acYearOptions.map(y => (
                                <option key={y} value={y}>{y.replace("-", " - ")}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1.5">Select Class</label>
                        <select
                            value={selectedClassId}
                            onChange={e => setSelectedClassId(e.target.value)}
                            disabled={classesLoading}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all appearance-none disabled:opacity-60"
                            style={selectStyle}>
                            {classesLoading
                                ? <option>Loading classes...</option>
                                : classes.length === 0
                                    ? <option value="">No classes available</option>
                                    : classes.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}{c.section ? ` ${c.section}` : ""}
                                        </option>
                                    ))
                            }
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1.5">Select Month</label>
                        <select
                            value={selectedMonth}
                            onChange={e => setSelectedMonth(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all appearance-none"
                            style={selectStyle}>
                            <option value="6">July {yearStart}</option>
                            <option value="7">August {yearStart}</option>
                            <option value="8">September {yearStart}</option>
                            <option value="9">October {yearStart}</option>
                            <option value="10">November {yearStart}</option>
                            <option value="11">December {yearStart}</option>
                            <option value="0">January {yearStart + 1}</option>
                            <option value="1">February {yearStart + 1}</option>
                            <option value="2">March {yearStart + 1}</option>
                            <option value="3">April {yearStart + 1}</option>
                            <option value="4">May {yearStart + 1}</option>
                            <option value="5">June {yearStart + 1}</option>
                        </select>
                    </div>

                    <button
                        onClick={fetchAttendance}
                        disabled={!selectedClassId || loading}
                        className="w-full py-2.5 bg-accent hover:bg-accent-dark text-white font-bold text-sm rounded-xl shadow-md shadow-accent/25 transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2">
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? "Loading..." : "Apply Filters"}
                    </button>
                </div>
            </div>

            {/* ─── Stats Cards ─── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 stagger-children">
                <div className="card p-6 group">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <p className="text-[10px] font-bold text-accent tracking-[0.08em] uppercase">Average Attendance</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-4xl font-extrabold text-text-primary">{avgAttendance}%</span>
                                {totalStudents > 0 && (
                                    <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                                        {monthName}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center transition-transform group-hover:scale-110">
                            <TrendingUp className="w-5 h-5 text-accent" />
                        </div>
                    </div>
                    <div className="h-2 bg-surface-alt rounded-full overflow-hidden">
                        <div
                            className="h-full bg-accent rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${avgAttendance}%` }}
                        />
                    </div>
                </div>

                <div className="card p-6 group">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <p className="text-[10px] font-bold text-text-muted tracking-[0.08em] uppercase">Total Present Days</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-4xl font-extrabold text-text-primary">{totalPresent}</span>
                                <span className="text-sm text-text-muted font-medium">/ {totalPossible} possible</span>
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center transition-transform group-hover:scale-110">
                            <Calendar className="w-5 h-5 text-blue-500" />
                        </div>
                    </div>
                    <div className="flex items-center mt-1">
                        {attendanceData.slice(0, 3).map((s, i) => (
                            <div
                                key={i}
                                className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(s.name)} flex items-center justify-center text-white text-[10px] font-bold border-2 border-white shadow-sm ${i > 0 ? "-ml-2" : ""}`}>
                                {getInitials(s.name)}
                            </div>
                        ))}
                        {totalStudents > 3 && (
                            <span className="ml-2 text-xs font-semibold text-text-muted bg-surface-alt px-2 py-0.5 rounded-full">
                                +{totalStudents - 3}
                            </span>
                        )}
                        {totalStudents === 0 && (
                            <span className="text-xs text-text-muted">No data — apply filters to load</span>
                        )}
                    </div>
                </div>

                <div className="card p-6 group">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <p className="text-[10px] font-bold text-text-muted tracking-[0.08em] uppercase">Absences vs Leaves</p>
                            <div className="flex items-center gap-6 mt-1">
                                <div>
                                    <span className="text-4xl font-extrabold text-text-primary">{totalAbsent}</span>
                                    <p className="text-xs text-text-muted mt-0.5">Absent</p>
                                </div>
                                <div className="w-px h-10 bg-border" />
                                <div>
                                    <span className="text-4xl font-extrabold text-text-primary">{totalLeave}</span>
                                    <p className="text-xs text-text-muted mt-0.5">On Leave</p>
                                </div>
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center transition-transform group-hover:scale-110">
                            <UserX className="w-5 h-5 text-red-400" />
                        </div>
                    </div>
                    <div className="h-2 bg-surface-alt rounded-full overflow-hidden flex">
                        <div
                            className="h-full bg-red-400 rounded-l-full transition-all duration-700"
                            style={{ width: `${absentRatio + leaveRatio > 0 ? (absentRatio / (absentRatio + leaveRatio)) * 100 : 50}%` }}
                        />
                        <div
                            className="h-full bg-amber-400 rounded-r-full transition-all duration-700"
                            style={{ width: `${absentRatio + leaveRatio > 0 ? (leaveRatio / (absentRatio + leaveRatio)) * 100 : 50}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* ─── Detailed Attendance Log ─── */}
            <div className="card overflow-hidden">
                <div className="p-6 pb-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-text-primary">Detailed Attendance Log</h3>
                        {totalStudents > 0 && (
                            <p className="text-xs text-text-muted mt-0.5">{monthName} · {totalStudents} students</p>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        {statusLegend.map(s => (
                            <div key={s.label} className="flex items-center gap-1.5">
                                <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                                <span className="text-xs text-text-muted font-medium">{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16 text-text-muted">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                        <span className="text-sm">Loading attendance data...</span>
                    </div>
                ) : totalStudents === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-text-muted">
                        <p className="text-sm mb-2">
                            {selectedClassId
                                ? "No attendance records for this period."
                                : "Select a class and click Apply Filters to view attendance."}
                        </p>
                        {selectedClassId && (
                            <p className="text-xs text-text-muted/70">
                                Attendance can be marked from the Classes section.
                            </p>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th className="sticky left-0 z-10 bg-surface px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider border-b border-border min-w-[180px]">
                                            Student Name
                                        </th>
                                        {Array.from({ length: totalDays }, (_, i) => {
                                            const dayNum = i + 1;
                                            const dow = getDayOfWeek(reportYear, monthIndex, dayNum);
                                            const isWeekend = dow === 0 || dow === 6;
                                            return (
                                                <th
                                                    key={dayNum}
                                                    className={`px-0 py-3 text-center border-b border-border min-w-[32px] ${isWeekend ? "bg-red-50/50" : ""}`}>
                                                    <div className={`text-[10px] font-bold ${isWeekend ? "text-red-400" : "text-text-muted"}`}>
                                                        {String(dayNum).padStart(2, "0")}
                                                    </div>
                                                    <div className={`text-[10px] font-medium ${isWeekend ? "text-red-300" : "text-text-muted/60"}`}>
                                                        {dayLabels[dow]}
                                                    </div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleStudents.map(student => (
                                        <tr key={student.id} className="hover:bg-surface-alt/50 transition-colors">
                                            <td className="sticky left-0 z-10 bg-surface px-6 py-4 border-b border-border-light">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(student.name)} flex items-center justify-center text-white text-[10px] font-bold shadow-sm`}>
                                                        {getInitials(student.name)}
                                                    </div>
                                                    <span className="text-sm font-semibold text-text-primary whitespace-nowrap">{student.name}</span>
                                                </div>
                                            </td>
                                            {student.days.map((status, dayIdx) => {
                                                const dow = getDayOfWeek(reportYear, monthIndex, dayIdx + 1);
                                                const isWeekend = dow === 0 || dow === 6;
                                                return (
                                                    <td
                                                        key={dayIdx}
                                                        className={`px-0 py-4 text-center border-b border-border-light ${isWeekend ? "bg-red-50/30" : ""}`}>
                                                        <div className="flex items-center justify-center">
                                                            <span
                                                                className={`w-3 h-3 rounded-full ${statusDot[status]} transition-transform hover:scale-150`}
                                                                title={`Day ${dayIdx + 1}: ${status}`}
                                                            />
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-border-light">
                            <p className="text-sm text-accent font-medium">
                                Showing {page * perPage + 1}–{Math.min((page + 1) * perPage, totalStudents)} of {totalStudents} students
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage(Math.max(0, page - 1))}
                                    disabled={page === 0}
                                    className="flex items-center gap-1 px-4 py-2 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-alt disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                                    <ChevronLeft className="w-4 h-4" />
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                                    disabled={page >= totalPages - 1}
                                    className="flex items-center gap-1 px-4 py-2 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-alt disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                                    Next
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

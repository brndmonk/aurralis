"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
    Search, Plus, Upload, FileSpreadsheet,
    ChevronLeft, ChevronRight, MoreVertical, Link2Off,
    X, ChevronDown, Loader2, Pencil, Trash2, Mail, CheckCircle,
} from "lucide-react";


// ─── Types ──────────────────────────────────────────────────

type StudentStatus = "Active" | "Inactive" | "Fees Pending";

interface ApiStudent {
    id: string;
    name: string;
    enrollmentId: string;
    classId: string | null;
    parentName: string | null;
    parentPhone: string | null;
    parentEmail: string | null;
    avatar: string | null;
    dateOfBirth: string | null;
    gender: string | null;
    enrolledAt: string;
    status: string;
    class: { id: string; name: string; section: string | null } | null;
}

interface ApiClass { id: string; name: string; section: string | null; }

// ─── Helpers ─────────────────────────────────────────────────

const AVATAR_COLORS = [
    "from-pink-400 to-rose-500", "from-blue-400 to-indigo-500",
    "from-amber-400 to-orange-500", "from-purple-400 to-violet-500",
    "from-cyan-400 to-teal-500", "from-emerald-400 to-green-500",
    "from-fuchsia-400 to-pink-500", "from-sky-400 to-blue-500",
    "from-orange-400 to-red-500", "from-violet-400 to-purple-500",
];
const CLASS_COLORS = [
    "bg-emerald-50 text-emerald-700 border-emerald-200",
    "bg-blue-50 text-blue-700 border-blue-200",
    "bg-rose-50 text-rose-700 border-rose-200",
    "bg-purple-50 text-purple-700 border-purple-200",
    "bg-amber-50 text-amber-700 border-amber-200",
];
const classColorCache: Record<string, string> = {};

function getAvatarColor(name: string) {
    let h = 0; for (const c of name) h += c.charCodeAt(0);
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function getInitials(name: string) {
    return name.split(" ").map(n => n[0] ?? "").join("").substring(0, 2).toUpperCase();
}
function getClassColor(name: string) {
    if (!classColorCache[name]) { const i = Object.keys(classColorCache).length; classColorCache[name] = CLASS_COLORS[i % CLASS_COLORS.length]; }
    return classColorCache[name];
}
function mapStatus(s: string): StudentStatus {
    const u = s.toUpperCase();
    if (u === "INACTIVE") return "Inactive";
    if (u === "FEES_PENDING") return "Fees Pending";
    return "Active";
}
function getClassName(s: ApiStudent) {
    if (!s.class) return "Unassigned";
    return s.class.section ? `${s.class.name} ${s.class.section}` : s.class.name;
}
function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

const statusStyles: Record<StudentStatus, string> = {
    Active: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    Inactive: "bg-gray-100 text-gray-500 border border-gray-200",
    "Fees Pending": "bg-amber-50 text-amber-700 border border-amber-200",
};
const allStatuses: ("All" | StudentStatus)[] = ["All", "Active", "Inactive", "Fees Pending"];
const allParentLinks = ["All", "Linked", "Unlinked"];

// ─── Filter Chip ─────────────────────────────────────────────

function FilterChip({ label, value, options, onChange }: {
    label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <button onClick={() => setOpen(!open)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${value !== "All" ? "bg-accent/10 text-accent border-accent/30" : "bg-surface text-text-secondary border-border hover:border-accent/30"}`}>
                <span className="text-text-muted font-medium">{label}:</span>
                <span className={value !== "All" ? "text-accent" : "text-text-primary"}>{value}</span>
                <ChevronDown className="w-3 h-3" />
            </button>
            {open && (<>
                <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                <div className="absolute top-full left-0 mt-1.5 bg-surface rounded-xl border border-border shadow-xl z-20 py-1 min-w-[160px]">
                    {options.map(o => (
                        <button key={o} onClick={() => { onChange(o); setOpen(false); }}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${value === o ? "bg-accent/10 text-accent font-semibold" : "text-text-primary hover:bg-surface-alt"}`}>
                            {o}
                        </button>
                    ))}
                </div>
            </>)}
        </div>
    );
}

// ─── Shared Modal Shell ───────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-border flex-shrink-0">
                    <h2 className="text-lg font-bold text-text-primary">{title}</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-alt text-text-muted"><X className="w-5 h-5" /></button>
                </div>
                {children}
            </div>
        </div>
    );
}

// ─── Student Form (shared by Add & Edit) ─────────────────────

function StudentForm({ initial, classes, onClose, onSaved }: {
    initial?: ApiStudent | null;
    classes: ApiClass[];
    onClose: () => void;
    onSaved: () => void;
}) {
    const isEdit = !!initial;
    const [form, setForm] = useState({
        name: initial?.name ?? "",
        enrollmentId: initial?.enrollmentId ?? "",
        classId: initial?.classId ?? "",
        parentName: initial?.parentName ?? "",
        parentPhone: initial?.parentPhone ?? "",
        parentEmail: initial?.parentEmail ?? "",
        dateOfBirth: initial?.dateOfBirth ? initial.dateOfBirth.split("T")[0] : "",
        gender: initial?.gender ?? "MALE",
        status: initial?.status ?? "ACTIVE",
    });
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

    const inp = "w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-text-muted";
    const lbl = "block text-xs font-semibold text-text-secondary mb-1.5";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !form.enrollmentId.trim()) { setErr("Name and Enrollment ID are required."); return; }
        setSaving(true); setErr(null);
        try {
            const url = isEdit ? `/api/students/${initial!.id}` : "/api/students";
            const method = isEdit ? "PUT" : "POST";
            const res = await fetch(url, {
                method, headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name, enrollmentId: form.enrollmentId,
                    classId: form.classId || null, parentName: form.parentName || null,
                    parentPhone: form.parentPhone || null, parentEmail: form.parentEmail || null,
                    dateOfBirth: form.dateOfBirth || null, gender: form.gender, status: form.status,
                }),
            });
            if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "Failed"); }
            onSaved(); onClose();
        } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Failed to save."); }
        finally { setSaving(false); }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-4">
                    <div><label className={lbl}>Full Name <span className="text-red-400">*</span></label>
                        <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Emma Thompson" className={inp} required /></div>
                    <div><label className={lbl}>Enrollment ID <span className="text-red-400">*</span></label>
                        <input value={form.enrollmentId} onChange={e => set("enrollmentId", e.target.value)} placeholder="STD-2024-001" className={inp} required /></div>
                </div>
                <div><label className={lbl}>Class</label>
                    <select value={form.classId} onChange={e => set("classId", e.target.value)} className={inp}>
                        <option value="">— Unassigned —</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? ` ${c.section}` : ""}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className={lbl}>Parent Name</label>
                        <input value={form.parentName} onChange={e => set("parentName", e.target.value)} placeholder="Sarah Thompson" className={inp} /></div>
                    <div><label className={lbl}>Parent Phone</label>
                        <input value={form.parentPhone} onChange={e => set("parentPhone", e.target.value)} placeholder="+91 9876543210" className={inp} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className={lbl}>Parent Email</label>
                        <input type="email" value={form.parentEmail} onChange={e => set("parentEmail", e.target.value)} placeholder="parent@email.com" className={inp} /></div>
                    <div><label className={lbl}>Date of Birth</label>
                        <input type="date" value={form.dateOfBirth} onChange={e => set("dateOfBirth", e.target.value)} className={inp} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className={lbl}>Gender</label>
                        <select value={form.gender} onChange={e => set("gender", e.target.value)} className={inp}>
                            <option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option>
                        </select>
                    </div>
                    {isEdit && <div><label className={lbl}>Status</label>
                        <select value={form.status} onChange={e => set("status", e.target.value)} className={inp}>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                            <option value="FEES_PENDING">Fees Pending</option>
                        </select>
                    </div>}
                </div>
                {err && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
            </div>
            <div className="flex items-center gap-3 px-6 py-4 border-t border-border flex-shrink-0">
                <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-text-secondary hover:bg-surface-alt transition-all">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent-dark text-white font-bold text-sm shadow-md shadow-accent/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Student"}
                </button>
            </div>
        </form>
    );
}

// ─── Delete Confirm Modal ─────────────────────────────────────

function DeleteConfirm({ name, onConfirm, onClose, deleting }: {
    name: string; onConfirm: () => void; onClose: () => void; deleting: boolean;
}) {
    return (
        <Modal title="Delete Student" onClose={onClose}>
            <div className="px-6 py-6 flex-1">
                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-7 h-7 text-red-500" />
                </div>
                <p className="text-center text-text-primary font-semibold mb-2">Remove <span className="text-red-500">{name}</span>?</p>
                <p className="text-center text-sm text-text-muted">This will permanently delete the student record and all associated data. This action cannot be undone.</p>
            </div>
            <div className="flex items-center gap-3 px-6 py-4 border-t border-border">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-text-secondary hover:bg-surface-alt transition-all">Cancel</button>
                <button onClick={onConfirm} disabled={deleting} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-70 transition-all">
                    {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {deleting ? "Deleting..." : "Delete"}
                </button>
            </div>
        </Modal>
    );
}

// ─── Row Action Menu ──────────────────────────────────────────

function ActionMenu({ onEdit, onDelete, onSendCredentials, hasEmail, sendingCreds, sentCreds }: {
    onEdit: () => void;
    onDelete: () => void;
    onSendCredentials: () => void;
    hasEmail: boolean;
    sendingCreds: boolean;
    sentCreds: boolean;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    return (
        <div className="relative inline-block" ref={ref}>
            <button onClick={() => setOpen(o => !o)} className="p-1.5 rounded-lg hover:bg-surface-alt text-text-muted hover:text-text-primary transition-colors">
                <MoreVertical className="w-4 h-4" />
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1 bg-surface rounded-xl border border-border shadow-xl z-30 py-1 w-48">
                    <button onClick={() => { setOpen(false); onEdit(); }}
                        className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-text-primary hover:bg-surface-alt transition-colors">
                        <Pencil className="w-3.5 h-3.5 text-text-muted" /> Edit
                    </button>
                    <button
                        onClick={() => { setOpen(false); onSendCredentials(); }}
                        disabled={!hasEmail || sendingCreds}
                        title={!hasEmail ? "Add a parent email first" : sentCreds ? "Credentials sent" : "Generate & email login credentials"}
                        className={`flex items-center gap-2.5 w-full px-4 py-2 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                            ${sentCreds ? "text-emerald-600 hover:bg-emerald-50" : "text-violet-600 hover:bg-violet-50"}`}
                    >
                        {sendingCreds
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : sentCreds
                                ? <CheckCircle className="w-3.5 h-3.5" />
                                : <Mail className="w-3.5 h-3.5" />
                        }
                        {sendingCreds ? "Sending…" : sentCreds ? "Credentials Sent" : "Send Credentials"}
                    </button>
                    <div className="my-1 border-t border-border-light" />
                    <button onClick={() => { setOpen(false); onDelete(); }}
                        className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Export CSV ───────────────────────────────────────────────

function exportCSV(students: ApiStudent[]) {
    const headers = ["Name", "Enrollment ID", "Class", "Parent Name", "Parent Phone", "Parent Email", "Gender", "Date of Birth", "Status", "Enrolled At"];
    const rows = students.map(s => [
        s.name, s.enrollmentId,
        s.class ? (s.class.section ? `${s.class.name} ${s.class.section}` : s.class.name) : "Unassigned",
        s.parentName ?? "", s.parentPhone ?? "", s.parentEmail ?? "",
        s.gender ?? "", s.dateOfBirth ? s.dateOfBirth.split("T")[0] : "",
        s.status, new Date(s.enrolledAt).toLocaleDateString("en-IN"),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `students_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

// ─── Page Component ─────────────────────────────────────────

export default function StudentsPage() {
    const [apiStudents, setApiStudents] = useState<ApiStudent[]>([]);
    const [classes, setClasses] = useState<ApiClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [classFilter, setClassFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState<"All" | StudentStatus>("All");
    const [parentFilter, setParentFilter] = useState("All");
    const [page, setPage] = useState(0);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const perPage = 10;

    const [showAddModal, setShowAddModal] = useState(false);
    const [editTarget, setEditTarget] = useState<ApiStudent | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ApiStudent | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [credsSending, setCredsSending] = useState<string | null>(null); // student id
    const [credsSent, setCredsSent] = useState<Set<string>>(new Set());
    const [credsError, setCredsError] = useState<string | null>(null);
    const bulkUploadRef = useRef<HTMLInputElement>(null);

    const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            const lines = text.trim().split('\n');
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, ''));
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim());
                const row: Record<string, string> = {};
                headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
                if (!row.name || !row.enrollmentid) continue;
                const matchedClass = classes.find(c =>
                    c.name.toLowerCase() === (row.classname ?? '').toLowerCase() ||
                    (c.section && `${c.name} ${c.section}`.toLowerCase() === (row.classname ?? '').toLowerCase())
                );
                await fetch('/api/students', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: row.name,
                        enrollmentId: row.enrollmentid,
                        classId: matchedClass?.id ?? null,
                        parentName: row.parentname || null,
                        parentPhone: row.parentphone || null,
                        parentEmail: row.parentemail || null,
                        dateOfBirth: row.dateofbirth || null,
                        gender: row.gender?.toUpperCase() || 'MALE',
                        status: row.status?.toUpperCase() || 'ACTIVE',
                    }),
                });
            }
            fetchData();
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const fetchData = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const [sr, cr] = await Promise.all([fetch("/api/students"), fetch("/api/classes")]);
            const [sd, cd] = await Promise.all([sr.json(), cr.json()]);
            if (Array.isArray(sd)) setApiStudents(sd); else throw new Error("Invalid data");
            if (Array.isArray(cd)) setClasses(cd);
        } catch { setError("Failed to load students. Please check your connection and try again."); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSendCredentials = async (student: ApiStudent) => {
        if (!student.parentEmail) return;
        setCredsSending(student.id);
        setCredsError(null);
        try {
            const res = await fetch(`/api/students/${student.id}/credentials`, { method: "POST" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed");
            setCredsSent(prev => new Set(prev).add(student.id));
        } catch (e: unknown) {
            setCredsError(e instanceof Error ? e.message : "Failed to send credentials.");
        } finally {
            setCredsSending(null);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/students/${deleteTarget.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            setDeleteTarget(null);
            fetchData();
        } catch { alert("Failed to delete student. Please try again."); }
        finally { setDeleting(false); }
    };

    const students = useMemo(() => apiStudents.map(s => ({
        raw: s,
        id: s.id,
        name: s.name,
        avatar: getInitials(s.name),
        avatarColor: getAvatarColor(s.name),
        joinDate: formatDate(s.enrolledAt),
        rollNo: `#${s.enrollmentId}`,
        className: getClassName(s),
        classColor: getClassColor(getClassName(s)),
        parent: s.parentName || "Unlinked",
        parentLinked: !!(s.parentName || s.parentPhone || s.parentEmail),
        status: mapStatus(s.status),
    })), [apiStudents]);

    const allClasses = useMemo(() => ["All", ...[...new Set(students.map(s => s.className))].sort()], [students]);
    const hasActiveFilters = classFilter !== "All" || statusFilter !== "All" || parentFilter !== "All";
    const resetFilters = () => { setClassFilter("All"); setStatusFilter("All"); setParentFilter("All"); setSearch(""); setPage(0); };

    const filtered = useMemo(() => students.filter(s => {
        if (search) { const q = search.toLowerCase(); if (!s.name.toLowerCase().includes(q) && !s.rollNo.toLowerCase().includes(q) && !s.parent.toLowerCase().includes(q)) return false; }
        if (classFilter !== "All" && s.className !== classFilter) return false;
        if (statusFilter !== "All" && s.status !== statusFilter) return false;
        if (parentFilter === "Linked" && !s.parentLinked) return false;
        if (parentFilter === "Unlinked" && s.parentLinked) return false;
        return true;
    }), [students, search, classFilter, statusFilter, parentFilter]);

    const totalResults = filtered.length;
    const totalPages = Math.ceil(totalResults / perPage);
    const visible = filtered.slice(page * perPage, (page + 1) * perPage);

    const toggleSelect = (id: string) => setSelected(prev => { const n = new Set(prev); if (n.has(id)) { n.delete(id); } else { n.add(id); } return n; });
    const toggleAll = () => selected.size === visible.length ? setSelected(new Set()) : setSelected(new Set(visible.map(s => s.rollNo)));

    if (loading) return (
        <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-text-primary mb-2">Student Directory</h1>
            <div className="flex items-center justify-center py-24 text-text-muted">
                <Loader2 className="w-8 h-8 animate-spin mr-3" />
                <span className="text-sm font-medium">Loading students...</span>
            </div>
        </div>
    );

    if (error) return (
        <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-text-primary mb-8">Student Directory</h1>
            <div className="card p-12 text-center">
                <p className="text-text-muted mb-4">{error}</p>
                <button onClick={fetchData} className="px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-bold shadow-md shadow-accent/25">Retry</button>
            </div>
        </div>
    );

    return (
        <div className="animate-fade-in">
            {/* Modals */}
            {showAddModal && (
                <Modal title="Add New Student" onClose={() => setShowAddModal(false)}>
                    <StudentForm classes={classes} onClose={() => setShowAddModal(false)} onSaved={fetchData} />
                </Modal>
            )}
            {editTarget && (
                <Modal title={`Edit · ${editTarget.name}`} onClose={() => setEditTarget(null)}>
                    <StudentForm initial={editTarget} classes={classes} onClose={() => setEditTarget(null)} onSaved={fetchData} />
                </Modal>
            )}
            {deleteTarget && (
                <DeleteConfirm name={deleteTarget.name} deleting={deleting} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />
            )}

            {/* ─── Credentials error toast ─── */}
            {credsError && (
                <div className="mb-4 flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                    <span>{credsError}</span>
                    <button onClick={() => setCredsError(null)} className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"><X className="w-4 h-4" /></button>
                </div>
            )}

            {/* ─── Header ─── */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Student Directory</h1>
                    <p className="text-text-secondary text-sm mt-0.5">Manage all student records, admissions, and status updates.</p>
                </div>
                <button onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-dark text-white font-bold text-sm rounded-xl shadow-md shadow-accent/25 transition-all active:scale-[0.98]">
                    <Plus className="w-4 h-4" /> Add New Student
                </button>
            </div>

            {/* ─── Quick Actions ─── */}
            <div className="card p-5 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                            <Upload className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-text-primary">Quick Actions</p>
                            <p className="text-xs text-text-muted">Import in bulk via CSV or download the current directory.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => exportCSV(apiStudents)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-text-secondary text-sm font-semibold hover:bg-surface-alt hover:border-accent/30 transition-all">
                            <FileSpreadsheet className="w-4 h-4" /> Export CSV
                        </button>
                        <input
                            ref={bulkUploadRef}
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={handleBulkUpload}
                        />
                        <button
                            onClick={() => bulkUploadRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/10 text-accent text-sm font-bold hover:bg-accent/15 border border-accent/20 transition-all"
                        >
                            <Upload className="w-4 h-4" /> Bulk Upload
                        </button>
                    </div>
                </div>
            </div>

            {/* ─── Search + Filters ─── */}
            <div className="card p-5 mb-6">
                <div className="relative mb-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
                        placeholder="Search by name, roll number, or parent name"
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-text-muted" />
                    {search && <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"><X className="w-4 h-4" /></button>}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Filters:</span>
                    <FilterChip label="Class" value={classFilter} options={allClasses} onChange={v => { setClassFilter(v); setPage(0); }} />
                    <FilterChip label="Status" value={statusFilter} options={allStatuses} onChange={v => { setStatusFilter(v as "All" | StudentStatus); setPage(0); }} />
                    <FilterChip label="Parent Link" value={parentFilter} options={allParentLinks} onChange={v => { setParentFilter(v); setPage(0); }} />
                    {hasActiveFilters && <button onClick={resetFilters} className="ml-auto text-xs font-semibold text-accent hover:text-accent-dark transition-colors">Reset Filters</button>}
                </div>
            </div>

            {/* ─── Table ─── */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="px-6 py-4 text-left w-10">
                                    <input type="checkbox" checked={selected.size === visible.length && visible.length > 0} onChange={toggleAll}
                                        className="w-4 h-4 rounded border-border text-accent focus:ring-accent/30 cursor-pointer accent-[var(--accent)]" />
                                </th>
                                <th className="px-4 py-4 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider">Student Name</th>
                                <th className="px-4 py-4 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider">ID / Roll No.</th>
                                <th className="px-4 py-4 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider">Class</th>
                                <th className="px-4 py-4 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider">Parent / Guardian</th>
                                <th className="px-4 py-4 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider">Status</th>
                                <th className="px-4 py-4 text-center text-[11px] font-bold text-text-muted uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map(student => (
                                <tr key={student.rollNo} className="border-b border-border-light hover:bg-surface-alt/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <input type="checkbox" checked={selected.has(student.rollNo)} onChange={() => toggleSelect(student.rollNo)}
                                            className="w-4 h-4 rounded border-border text-accent focus:ring-accent/30 cursor-pointer accent-[var(--accent)]" />
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${student.avatarColor} flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0`}>
                                                {student.avatar}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-text-primary">{student.name}</p>
                                                <p className="text-[11px] text-accent font-medium">Joined: {student.joinDate}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4"><span className="text-sm text-text-secondary font-medium">{student.rollNo}</span></td>
                                    <td className="px-4 py-4">
                                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold border ${student.classColor}`}>{student.className}</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        {student.parentLinked
                                            ? <span className="text-sm text-text-primary">{student.parent}</span>
                                            : <div className="flex items-center gap-1.5 text-red-400"><Link2Off className="w-3.5 h-3.5" /><span className="text-sm font-semibold">Unlinked</span></div>}
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${statusStyles[student.status]}`}>{student.status}</span>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <ActionMenu
                                            onEdit={() => setEditTarget(student.raw)}
                                            onDelete={() => setDeleteTarget(student.raw)}
                                            onSendCredentials={() => handleSendCredentials(student.raw)}
                                            hasEmail={!!student.raw.parentEmail}
                                            sendingCreds={credsSending === student.id}
                                            sentCreds={credsSent.has(student.id)}
                                        />
                                    </td>
                                </tr>
                            ))}
                            {visible.length === 0 && (
                                <tr><td colSpan={7} className="px-6 py-16 text-center">
                                    <p className="text-text-muted text-sm">{students.length === 0 ? 'No students yet. Click "Add New Student" to get started.' : "No students match your current filters."}</p>
                                    {students.length > 0 && hasActiveFilters && <button onClick={resetFilters} className="text-accent text-sm font-semibold mt-2 hover:underline">Reset Filters</button>}
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-border-light">
                    <p className="text-sm text-accent font-medium">
                        Showing {totalResults > 0 ? page * perPage + 1 : 0}–{Math.min((page + 1) * perPage, totalResults)} of {totalResults} results
                    </p>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                            className="p-2 rounded-lg border border-border text-text-muted hover:bg-surface-alt disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            let pn = i;
                            if (totalPages > 5) {
                                if (page >= 3 && page <= totalPages - 3) pn = page - 2 + i;
                                else if (page > totalPages - 4) pn = totalPages - 5 + i;
                            }
                            return (
                                <button key={pn} onClick={() => setPage(pn)}
                                    className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${page === pn ? "bg-accent text-white shadow-md shadow-accent/25" : "text-text-secondary hover:bg-surface-alt"}`}>
                                    {pn + 1}
                                </button>
                            );
                        })}
                        {totalPages > 5 && page < totalPages - 3 && (
                            <><span className="px-1 text-text-muted">...</span>
                                <button onClick={() => setPage(totalPages - 1)} className="w-9 h-9 rounded-lg text-sm font-semibold text-text-secondary hover:bg-surface-alt transition-all">{totalPages}</button></>
                        )}
                        <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
                            className="p-2 rounded-lg border border-border text-text-muted hover:bg-surface-alt disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

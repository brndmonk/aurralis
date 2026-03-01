"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
    Search, Plus, Users, MoreVertical, X, UserPlus,
    ArrowRightLeft, Loader2, Pencil, Trash2, ChevronRight, Check,
} from "lucide-react";
import { useRouter } from "next/navigation";

// ─── Types ──────────────────────────────────────────────────

type ClassCategory = "toddler" | "kindergarten" | "primary";

interface ApiClass {
    id: string;
    name: string;
    section: string | null;
    capacity: number;
    enrolled: number;
    teacher: { id: string; name: string; email: string } | null;
    createdAt: string;
}

interface Student {
    id: string;
    name: string;
    classId: string | null;
    enrolledAt: string;
    enrollmentId?: string;
}

interface ApiUser {
    id: string;
    name: string;
    email: string;
    role: string;
}

// ─── Helpers ─────────────────────────────────────────────────

const AVATAR_COLORS = [
    "from-emerald-400 to-teal-500", "from-amber-400 to-orange-500",
    "from-violet-400 to-purple-500", "from-cyan-400 to-blue-500",
    "from-rose-400 to-red-500", "from-blue-400 to-indigo-500",
    "from-pink-400 to-fuchsia-500", "from-lime-400 to-green-500",
];
function getAvatarColor(name: string) {
    let h = 0; for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function getInitials(name: string) {
    return name.split(" ").map(n => n[0] ?? "").join("").substring(0, 2).toUpperCase();
}
function deriveCategory(name: string): ClassCategory {
    const n = name.toLowerCase();
    if (n.includes("toddler") || n.includes("nursery") || n.includes("montessori")) return "toddler";
    if (n.includes("kindergarten") || n.includes("kg") || n.includes("kinder")) return "kindergarten";
    return "primary";
}
const catStyles: Record<ClassCategory, { borderColor: string; labelColor: string; barColor: string; label: string }> = {
    toddler: { borderColor: "border-t-emerald-400", labelColor: "text-emerald-600", barColor: "bg-emerald-400", label: "TODDLER PROGRAM" },
    kindergarten: { borderColor: "border-t-amber-400", labelColor: "text-amber-600", barColor: "bg-amber-400", label: "KINDERGARTEN" },
    primary: { borderColor: "border-t-violet-400", labelColor: "text-violet-600", barColor: "bg-violet-400", label: "PRIMARY SCHOOL" },
};
const filterTabs = ["All Classes", "Toddlers", "Primary"] as const;
const inp = "w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-text-muted";
const lbl = "block text-xs font-semibold text-text-secondary mb-1.5";

// ─── Assign Teacher Modal ────────────────────────────────────

function AssignTeacherModal({ cls, onClose, onDone }: { cls: ApiClass; onClose: () => void; onDone: () => void }) {
    const [users, setUsers] = useState<ApiUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState(cls.teacher?.id ?? "");
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const displayName = cls.section ? `${cls.name} ${cls.section}` : cls.name;

    useEffect(() => {
        fetch("/api/users").then(r => r.json()).then(d => {
            const list = Array.isArray(d) ? d : (d.users ?? []);
            setUsers(list.filter((u: ApiUser) => u.role === "TEACHER" || u.role === "teacher"));
        }).catch(() => setErr("Could not load teachers.")).finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true); setErr(null);
        try {
            const res = await fetch(`/api/classes/${cls.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ teacherId: selectedId || null }),
            });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error(d.error || "Failed to assign teacher");
            }
            onDone(); onClose();
        } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Failed to assign teacher."); }
        finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-sm mx-4">
                <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-border">
                    <div>
                        <h2 className="text-lg font-bold text-text-primary">Assign Teacher</h2>
                        <p className="text-xs text-text-muted mt-0.5">{displayName}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-alt text-text-muted"><X className="w-5 h-5" /></button>
                </div>
                <div className="px-6 py-5">
                    {loading
                        ? <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-text-muted" /></div>
                        : <div className="space-y-1 max-h-[280px] overflow-y-auto">
                            <button onClick={() => setSelectedId("")}
                                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-all ${!selectedId ? "bg-accent/10 text-accent font-semibold" : "hover:bg-surface-alt text-text-primary"}`}>
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-bold">?</div>
                                <span>No Teacher (Unassign)</span>
                                {!selectedId && <Check className="w-4 h-4 ml-auto" />}
                            </button>
                            {users.length === 0 && <p className="text-sm text-text-muted text-center py-4">No teachers found. Add teacher accounts first.</p>}
                            {users.map(u => (
                                <button key={u.id} onClick={() => setSelectedId(u.id)}
                                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-all ${selectedId === u.id ? "bg-accent/10 text-accent font-semibold" : "hover:bg-surface-alt text-text-primary"}`}>
                                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(u.name)} flex items-center justify-center text-white text-xs font-bold`}>{getInitials(u.name)}</div>
                                    <div className="text-left flex-1">
                                        <p className="font-semibold">{u.name}</p>
                                        <p className="text-xs text-text-muted">{u.email}</p>
                                    </div>
                                    {selectedId === u.id && <Check className="w-4 h-4 text-accent" />}
                                </button>
                            ))}
                        </div>
                    }
                    {err && <p className="text-sm text-red-500 mt-3">{err}</p>}
                </div>
                <div className="flex items-center gap-3 px-6 py-4 border-t border-border">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-text-secondary hover:bg-surface-alt transition-all">Cancel</button>
                    <button onClick={handleSave} disabled={saving || loading}
                        className="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent-dark text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-70 transition-all shadow-md shadow-accent/25">
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        {saving ? "Saving..." : "Assign"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Create / Edit Class Modal ───────────────────────────────

function ClassFormModal({ cls, onClose, onDone }: {
    cls?: ApiClass;
    onClose: () => void;
    onDone: () => void;
}) {
    const isEdit = !!cls;
    const [form, setForm] = useState({
        name: cls?.name ?? "",
        section: cls?.section ?? "",
        capacity: String(cls?.capacity ?? 30),
    });
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) { setErr("Class name is required."); return; }
        setSaving(true); setErr(null);
        try {
            const url = isEdit ? `/api/classes/${cls!.id}` : "/api/classes";
            const method = isEdit ? "PATCH" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name.trim(),
                    section: form.section.trim() || null,
                    capacity: parseInt(form.capacity) || 30,
                }),
            });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error(d.error || (isEdit ? "Failed to update class" : "Failed to create class"));
            }
            onDone(); onClose();
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : "Operation failed.");
        } finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-border">
                    <h2 className="text-lg font-bold text-text-primary">{isEdit ? "Edit Class" : "Create New Class"}</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-alt text-text-muted transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-5 space-y-4">
                        <div>
                            <label className={lbl}>Class Name <span className="text-red-400">*</span></label>
                            <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Montessori Primary" className={inp} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={lbl}>Section</label>
                                <input value={form.section} onChange={e => set("section", e.target.value)} placeholder="e.g. A, B" className={inp} />
                            </div>
                            <div>
                                <label className={lbl}>Capacity</label>
                                <input type="number" value={form.capacity} onChange={e => set("capacity", e.target.value)} min="1" max="100" className={inp} />
                            </div>
                        </div>
                        {err && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
                    </div>
                    <div className="flex items-center gap-3 px-6 py-4 border-t border-border">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-text-secondary hover:bg-surface-alt transition-all">Cancel</button>
                        <button type="submit" disabled={saving}
                            className="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent-dark text-white font-bold text-sm shadow-md shadow-accent/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            {saving ? (isEdit ? "Saving..." : "Creating...") : (isEdit ? "Save Changes" : "Create Class")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Delete Confirmation Modal ───────────────────────────────

function DeleteClassModal({ cls, onClose, onDone }: { cls: ApiClass; onClose: () => void; onDone: () => void }) {
    const [deleting, setDeleting] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const displayName = cls.section ? `${cls.name} ${cls.section}` : cls.name;

    const handleDelete = async () => {
        setDeleting(true); setErr(null);
        try {
            const res = await fetch(`/api/classes/${cls.id}`, { method: "DELETE" });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error(d.error || "Failed to delete class");
            }
            onDone(); onClose();
        } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Failed to delete class."); }
        finally { setDeleting(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                        <Trash2 className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-text-primary">Delete Class</h2>
                        <p className="text-xs text-text-muted">{displayName}</p>
                    </div>
                </div>
                {cls.enrolled > 0
                    ? <p className="text-sm text-text-secondary mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                        ⚠️ This class has <strong>{cls.enrolled} student{cls.enrolled > 1 ? "s" : ""}</strong> enrolled. Reassign them to another class before deleting.
                    </p>
                    : <p className="text-sm text-text-secondary mb-4">
                        Are you sure you want to delete <strong>{displayName}</strong>? This cannot be undone.
                    </p>
                }
                {err && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg mb-4">{err}</p>}
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-text-secondary hover:bg-surface-alt transition-all">Cancel</button>
                    <button onClick={handleDelete} disabled={deleting || cls.enrolled > 0}
                        className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
                        {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {deleting ? "Deleting..." : "Delete Class"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Page Component ─────────────────────────────────────────

export default function ClassesPage() {
    const router = useRouter();
    const [apiClasses, setApiClasses] = useState<ApiClass[]>([]);
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editTarget, setEditTarget] = useState<ApiClass | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ApiClass | null>(null);
    const [assignTarget, setAssignTarget] = useState<ApiClass | null>(null);

    // UI state
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState<string>("All Classes");
    const [allocationSearch, setAllocationSearch] = useState("");
    const [showAllocation, setShowAllocation] = useState(true);
    const [selectedClass, setSelectedClass] = useState<string | null>(null);
    const [openCardMenu, setOpenCardMenu] = useState<string | null>(null);
    const [bulkAllocating, setBulkAllocating] = useState(false);
    const [allocatingId, setAllocatingId] = useState<string | null>(null); // per-student

    const fetchData = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const [classRes, studRes] = await Promise.all([fetch("/api/classes"), fetch("/api/students")]);
            const [classData, studData] = await Promise.all([classRes.json(), studRes.json()]);
            if (Array.isArray(classData)) setApiClasses(classData);
            else throw new Error("Invalid class data");
            if (Array.isArray(studData)) setAllStudents(studData);
        } catch { setError("Failed to load classes. Please try again."); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const unassignedStudents = useMemo(() => allStudents.filter(s => !s.classId), [allStudents]);

    const filteredClasses = useMemo(() => {
        return apiClasses.filter(c => {
            const displayName = c.section ? `${c.name} ${c.section}` : c.name;
            if (search) {
                const q = search.toLowerCase();
                if (!displayName.toLowerCase().includes(q) && !(c.teacher?.name?.toLowerCase() || "").includes(q)) return false;
            }
            if (activeTab === "Toddlers") {
                const cat = deriveCategory(c.name);
                return cat === "toddler" || cat === "kindergarten";
            }
            if (activeTab === "Primary") return deriveCategory(c.name) === "primary";
            return true;
        });
    }, [apiClasses, search, activeTab]);

    const filteredUnassigned = useMemo(() => {
        if (!allocationSearch) return unassignedStudents;
        const q = allocationSearch.toLowerCase();
        return unassignedStudents.filter(s => s.name.toLowerCase().includes(q));
    }, [unassignedStudents, allocationSearch]);

    // Assign one student to selectedClass
    const assignStudent = async (studentId: string) => {
        if (!selectedClass) return;
        setAllocatingId(studentId);
        try {
            const res = await fetch(`/api/students/${studentId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ classId: selectedClass }),
            });
            if (!res.ok) throw new Error();
            // Optimistically remove student from unassigned
            setAllStudents(prev => prev.map(s => s.id === studentId ? { ...s, classId: selectedClass } : s));
            // Update enrolled count
            setApiClasses(prev => prev.map(c => c.id === selectedClass ? { ...c, enrolled: c.enrolled + 1 } : c));
        } catch { alert("Failed to assign student. Please try again."); }
        finally { setAllocatingId(null); }
    };

    // Bulk assign ALL unassigned to selectedClass
    const bulkAllocate = async () => {
        if (!selectedClass || unassignedStudents.length === 0) return;
        setBulkAllocating(true);
        try {
            await Promise.all(
                unassignedStudents.map(s =>
                    fetch(`/api/students/${s.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ classId: selectedClass }),
                    })
                )
            );
            fetchData();
        } catch { alert("Bulk allocation failed. Please try again."); }
        finally { setBulkAllocating(false); }
    };

    if (loading) return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-text-primary">Classes &amp; Batch Management</h1>
            </div>
            <div className="flex items-center justify-center py-24 text-text-muted">
                <Loader2 className="w-8 h-8 animate-spin mr-3" />
                <span className="text-sm font-medium">Loading classes...</span>
            </div>
        </div>
    );

    if (error) return (
        <div className="animate-fade-in">
            <div className="card p-12 text-center">
                <p className="text-text-muted mb-4">{error}</p>
                <button onClick={fetchData} className="px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-bold shadow-md shadow-accent/25">Retry</button>
            </div>
        </div>
    );

    const selectedClassName = apiClasses.find(c => c.id === selectedClass)
        ? (apiClasses.find(c => c.id === selectedClass)!.section
            ? `${apiClasses.find(c => c.id === selectedClass)!.name} ${apiClasses.find(c => c.id === selectedClass)!.section}`
            : apiClasses.find(c => c.id === selectedClass)!.name)
        : null;

    return (
        <div className="animate-fade-in">
            {/* Modals */}
            {showCreateModal && <ClassFormModal onClose={() => setShowCreateModal(false)} onDone={fetchData} />}
            {editTarget && <ClassFormModal cls={editTarget} onClose={() => setEditTarget(null)} onDone={fetchData} />}
            {deleteTarget && <DeleteClassModal cls={deleteTarget} onClose={() => setDeleteTarget(null)} onDone={fetchData} />}
            {assignTarget && <AssignTeacherModal cls={assignTarget} onClose={() => setAssignTarget(null)} onDone={fetchData} />}

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Classes &amp; Batch Management</h1>
                    <p className="text-text-secondary text-sm mt-0.5">Manage class allocations, capacities, and teacher assignments.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-dark text-white font-bold text-sm rounded-xl shadow-md shadow-accent/25 transition-all active:scale-[0.98]">
                        <Plus className="w-4 h-4" /> Create New Class
                    </button>
                </div>
            </div>

            <div className="flex gap-6">
                {/* Main Content */}
                <div className={`flex-1 ${showAllocation ? "max-w-[calc(100%-320px)]" : ""}`}>
                    {/* Search + Filter */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="relative flex-1 max-w-[320px]">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Search class or teacher"
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-text-muted" />
                        </div>
                        <div className="flex items-center bg-surface rounded-xl border border-border p-1">
                            {filterTabs.map(tab => (
                                <button key={tab} onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === tab ? "bg-sidebar text-white shadow-sm" : "text-text-secondary hover:text-text-primary"}`}>
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <span className="text-xs text-text-muted ml-auto">{filteredClasses.length} class{filteredClasses.length !== 1 ? "es" : ""}</span>
                    </div>

                    {/* Class Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 stagger-children">
                        {filteredClasses.map(cls => {
                            const style = catStyles[deriveCategory(cls.name)];
                            const fillPercent = cls.capacity > 0 ? Math.min((cls.enrolled / cls.capacity) * 100, 100) : 0;
                            const isSelected = selectedClass === cls.id;
                            const displayName = cls.section ? `${cls.name} ${cls.section}` : cls.name;
                            const teacherColor = cls.teacher ? getAvatarColor(cls.teacher.name) : "from-gray-300 to-gray-400";

                            return (
                                <div key={cls.id}
                                    onClick={() => setSelectedClass(isSelected ? null : cls.id)}
                                    className={`card border-t-4 ${style.borderColor} p-5 cursor-pointer transition-all duration-200 hover:shadow-lg ${isSelected ? "ring-2 ring-accent ring-offset-2 shadow-lg" : ""}`}>

                                    {/* Card Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className={`text-[10px] font-extrabold tracking-[0.1em] uppercase ${style.labelColor} mb-1`}>{style.label}</p>
                                            <h3 className="text-lg font-bold text-text-primary leading-tight">{displayName}</h3>
                                        </div>
                                        {/* ···  menu */}
                                        <div className="relative" onClick={e => e.stopPropagation()}>
                                            <button onClick={() => setOpenCardMenu(openCardMenu === cls.id ? null : cls.id)}
                                                className="p-1 rounded-lg hover:bg-surface-alt text-text-muted transition-colors">
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                            {openCardMenu === cls.id && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setOpenCardMenu(null)} />
                                                    <div className="absolute right-0 top-full mt-1 bg-surface rounded-xl border border-border shadow-xl z-20 py-1 w-44">
                                                        <button onClick={() => { setOpenCardMenu(null); setAssignTarget(cls); }}
                                                            className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-text-primary hover:bg-surface-alt transition-colors">
                                                            <UserPlus className="w-3.5 h-3.5 text-text-muted" /> Assign Teacher
                                                        </button>
                                                        <button onClick={() => { setOpenCardMenu(null); setEditTarget(cls); }}
                                                            className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-text-primary hover:bg-surface-alt transition-colors">
                                                            <Pencil className="w-3.5 h-3.5 text-text-muted" /> Edit Class
                                                        </button>
                                                        <button onClick={() => { setOpenCardMenu(null); router.push(`/dashboard/students?class=${encodeURIComponent(displayName)}`); }}
                                                            className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-text-primary hover:bg-surface-alt transition-colors">
                                                            <Users className="w-3.5 h-3.5 text-text-muted" /> Manage Students
                                                        </button>
                                                        <div className="border-t border-border my-1" />
                                                        <button onClick={() => { setOpenCardMenu(null); setDeleteTarget(cls); }}
                                                            className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
                                                            <Trash2 className="w-3.5 h-3.5" /> Delete Class
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Teacher Row */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${teacherColor} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                                            {cls.teacher ? getInitials(cls.teacher.name) : "?"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Teacher</p>
                                            <p className="text-sm font-semibold text-text-primary truncate">
                                                {cls.teacher?.name || <span className="text-text-muted italic">No Teacher Assigned</span>}
                                            </p>
                                        </div>
                                        {!cls.teacher && (
                                            <button onClick={e => { e.stopPropagation(); setAssignTarget(cls); }}
                                                className="text-xs font-bold text-accent hover:underline whitespace-nowrap">
                                                Assign
                                            </button>
                                        )}
                                    </div>

                                    {/* Capacity Bar */}
                                    <div className="mb-4">
                                        <div className="flex items-baseline justify-between mb-1.5">
                                            <span className="text-xs font-semibold text-text-muted">Capacity</span>
                                            <div>
                                                <span className="text-lg font-extrabold text-text-primary">{cls.enrolled}</span>
                                                <span className="text-sm text-text-muted font-medium"> / {cls.capacity}</span>
                                            </div>
                                        </div>
                                        <div className="h-2 bg-surface-alt rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-700 ease-out ${fillPercent >= 90 ? "bg-red-400" : style.barColor}`}
                                                style={{ width: `${fillPercent}%` }} />
                                        </div>
                                        {fillPercent >= 90 && (
                                            <p className="text-[10px] text-red-500 font-semibold mt-1">⚠ Near capacity</p>
                                        )}
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="flex items-center gap-3 pt-3 border-t border-border">
                                        <button onClick={e => { e.stopPropagation(); router.push(`/dashboard/students?class=${encodeURIComponent(displayName)}`); }}
                                            className="flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-accent transition-colors">
                                            <Users className="w-3.5 h-3.5" /> Manage Students
                                            <ChevronRight className="w-3 h-3" />
                                        </button>
                                        <button onClick={e => { e.stopPropagation(); setEditTarget(cls); }}
                                            className="ml-auto flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors">
                                            <Pencil className="w-3.5 h-3.5" /> Edit
                                        </button>
                                    </div>

                                    {/* "Selected for allocation" badge */}
                                    {isSelected && (
                                        <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-accent bg-accent/10 rounded-lg px-3 py-1.5">
                                            <ArrowRightLeft className="w-3 h-3" />
                                            Selected for allocation
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Create New Batch Card */}
                        <div onClick={() => setShowCreateModal(true)}
                            className="border-2 border-dashed border-border rounded-2xl p-5 flex flex-col items-center justify-center text-center min-h-[260px] hover:border-accent/40 hover:bg-accent/[0.02] transition-all cursor-pointer group">
                            <div className="w-12 h-12 rounded-2xl bg-surface-alt flex items-center justify-center mb-4 group-hover:bg-accent/10 transition-colors">
                                <Plus className="w-6 h-6 text-text-muted group-hover:text-accent transition-colors" />
                            </div>
                            <h3 className="text-lg font-bold text-text-primary mb-1">Create New Batch</h3>
                            <p className="text-xs text-text-muted max-w-[180px] leading-relaxed">Add a new class section or intake batch to the system.</p>
                        </div>

                        {filteredClasses.length === 0 && apiClasses.length > 0 && (
                            <div className="col-span-full text-center py-12">
                                <p className="text-text-muted text-sm">No classes match your search.</p>
                                <button onClick={() => setSearch("")} className="text-accent text-sm font-semibold mt-2 hover:underline">Clear search</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Allocation Panel */}
                {showAllocation && (
                    <div className="w-[300px] flex-shrink-0 animate-fade-in">
                        <div className="card p-5 sticky top-4">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="font-bold text-text-primary">Quick Allocation</h3>
                                <button onClick={() => setShowAllocation(false)} className="p-1 rounded-lg hover:bg-surface-alt text-text-muted transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-xs text-text-muted mb-4">Students not yet assigned to any class</p>

                            {/* Target class hint */}
                            <div className={`rounded-xl px-3 py-2.5 mb-4 text-xs font-semibold flex items-center gap-2 ${selectedClass ? "bg-accent/10 text-accent" : "bg-surface-alt text-text-muted"}`}>
                                <ArrowRightLeft className="w-3.5 h-3.5 flex-shrink-0" />
                                {selectedClass
                                    ? <>Assigning to → <span className="truncate ml-0.5">{selectedClassName}</span></>
                                    : "Click a class card to select target"}
                            </div>

                            {/* Search */}
                            <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                                <input type="text" value={allocationSearch} onChange={e => setAllocationSearch(e.target.value)}
                                    placeholder="Search unassigned..." className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-surface text-xs focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-text-muted" />
                            </div>

                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-text-primary">Unassigned ({unassignedStudents.length})</span>
                                {allocationSearch && <button onClick={() => setAllocationSearch("")}
                                    className="text-[10px] text-text-muted hover:text-text-primary">Clear</button>}
                            </div>

                            {/* Student list */}
                            <div className="space-y-1 mb-4 max-h-[300px] overflow-y-auto pr-1">
                                {filteredUnassigned.length === 0 ? (
                                    <div className="text-center py-6">
                                        <p className="text-xs text-text-muted">
                                            {unassignedStudents.length === 0 ? "🎉 All students are assigned!" : "No matches found."}
                                        </p>
                                    </div>
                                ) : (
                                    filteredUnassigned.map(student => (
                                        <div key={student.id} className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl hover:bg-surface-alt/70 transition-colors group">
                                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(student.name)} flex items-center justify-center text-white text-[10px] font-bold shadow-sm flex-shrink-0`}>
                                                {getInitials(student.name)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-text-primary truncate">{student.name}</p>
                                                <p className="text-[10px] text-red-400 font-medium">No Class</p>
                                            </div>
                                            {/* Per-student assign button */}
                                            <button
                                                disabled={!selectedClass || allocatingId === student.id}
                                                onClick={() => assignStudent(student.id)}
                                                title={selectedClass ? `Assign to ${selectedClassName}` : "Select a class first"}
                                                className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${selectedClass ? "bg-accent/10 hover:bg-accent text-accent hover:text-white" : "bg-surface-alt text-text-muted cursor-not-allowed opacity-50"}`}>
                                                {allocatingId === student.id
                                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                                    : <ChevronRight className="w-3 h-3" />}
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Bulk Allocate */}
                            <button
                                disabled={bulkAllocating || !selectedClass || unassignedStudents.length === 0}
                                onClick={bulkAllocate}
                                className="w-full py-2.5 bg-sidebar hover:bg-sidebar-hover text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                {bulkAllocating && <Loader2 className="w-4 h-4 animate-spin" />}
                                {!selectedClass
                                    ? "Select a class above"
                                    : bulkAllocating
                                        ? "Allocating..."
                                        : `Bulk Allocate All (${unassignedStudents.length})`}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Floating show-allocation button when panel is hidden */}
            {!showAllocation && (
                <button onClick={() => setShowAllocation(true)}
                    className="fixed right-6 bottom-6 flex items-center gap-2 px-4 py-3 bg-sidebar text-white rounded-xl shadow-xl font-semibold text-sm hover:bg-sidebar-hover transition-all z-20">
                    <Users className="w-4 h-4" /> Quick Allocation ({unassignedStudents.length})
                </button>
            )}
        </div>
    );
}

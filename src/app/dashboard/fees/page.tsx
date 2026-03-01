"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
    Download, CreditCard, AlertTriangle, MoreVertical, Plus, ChevronDown,
    DollarSign, Clock, Loader2, X, Search, Check, Pencil, Trash2,
    CheckCircle2, RefreshCw, Filter,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────

interface ApiAggregations {
    totalReceivable: number; totalCollected: number;
    pendingDues: number; overdueDues: number;
    totalCount: number; paidCount: number; pendingCount: number; overdueCount: number;
}
interface ApiDefaulter {
    id: string; studentName: string; studentId: string; className: string;
    amount: number; dueDate: string; description: string | null;
}
interface ApiFee {
    id: string; studentName: string; studentId: string; className: string;
    amount: number; dueDate: string; paidDate: string | null;
    status: string; description: string | null; createdAt: string;
}
interface ApiStudent { id: string; name: string; enrollmentId: string; }

type TxnStatus = "Completed" | "Processing" | "Overdue";

// ─── Helpers ─────────────────────────────────────────────────

function mapStatus(s: string): TxnStatus {
    if (s === "PAID") return "Completed";
    if (s === "OVERDUE") return "Overdue";
    return "Processing";
}
function daysLate(d: string) {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    return diff >= 60 ? "60+ days late" : `${diff} day${diff !== 1 ? "s" : ""} late`;
}
const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const fmtK = (n: number) => n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${n}`;

const statusDot: Record<TxnStatus, string> = {
    Completed: "bg-emerald-500", Processing: "bg-amber-500", Overdue: "bg-red-500",
};
const statusBg: Record<TxnStatus, string> = {
    Completed: "bg-emerald-50 text-emerald-700", Processing: "bg-amber-50 text-amber-700", Overdue: "bg-red-50 text-red-600",
};

const AVATAR_COLORS = [
    "from-pink-400 to-rose-500", "from-blue-400 to-indigo-500",
    "from-amber-400 to-orange-500", "from-purple-400 to-violet-500",
    "from-cyan-400 to-teal-500", "from-emerald-400 to-green-500",
];
function getAvatarColor(n: string) {
    let h = 0; for (let i = 0; i < n.length; i++) h += n.charCodeAt(i);
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function getInitials(n: string) {
    return n.split(" ").map(x => x[0] ?? "").join("").substring(0, 2).toUpperCase();
}

// ─── Chart Tooltip ──────────────────────────────────────────

function CustomTooltip({ active, payload, label }: {
    active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string;
}) {
    if (!active || !payload) return null;
    return (
        <div className="bg-white rounded-xl shadow-xl border border-border px-4 py-3">
            <p className="text-xs font-bold text-text-muted mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} className="text-sm font-semibold" style={{ color: p.dataKey === "collection" ? "#22c55e" : "#94a3b8" }}>
                    {p.dataKey === "collection" ? "Collected" : "Projected"}: {fmtK(p.value)}
                </p>
            ))}
        </div>
    );
}

// ─── Add / Edit Fee Modal ─────────────────────────────────────

function FeeModal({ fee, onClose, onDone }: {
    fee?: ApiFee; onClose: () => void; onDone: () => void;
}) {
    const isEdit = !!fee;
    const [students, setStudents] = useState<ApiStudent[]>([]);
    const [form, setForm] = useState({
        studentId: "",
        amount: fee ? String(fee.amount) : "",
        dueDate: fee ? new Date(fee.dueDate).toISOString().split("T")[0] : "",
        description: fee?.description ?? "",
        status: fee?.status ?? "PENDING",
    });
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

    useEffect(() => {
        if (!isEdit) {
            fetch("/api/students").then(r => r.json()).then(d => { if (Array.isArray(d)) setStudents(d); }).catch(() => { });
        }
    }, [isEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isEdit && !form.studentId) { setErr("Select a student."); return; }
        if (!form.amount || !form.dueDate) { setErr("Amount and due date are required."); return; }
        setSaving(true); setErr(null);
        try {
            let res: Response;
            if (isEdit) {
                res = await fetch(`/api/fees/${fee!.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        amount: parseFloat(form.amount),
                        dueDate: form.dueDate,
                        description: form.description || null,
                        status: form.status,
                    }),
                });
            } else {
                res = await fetch("/api/fees", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        studentId: form.studentId,
                        amount: parseFloat(form.amount),
                        dueDate: form.dueDate,
                        description: form.description || null,
                        status: form.status,
                    }),
                });
            }
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error(d.error || "Operation failed");
            }
            onDone(); onClose();
        } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Failed to save."); }
        finally { setSaving(false); }
    };

    const inp = "w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-text-muted";
    const lbl = "block text-xs font-semibold text-text-secondary mb-1.5";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-border">
                    <h2 className="text-lg font-bold text-text-primary">{isEdit ? "Edit Fee Record" : "Add Fee Record"}</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-alt text-text-muted"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-5 space-y-4">
                        {!isEdit && (
                            <div>
                                <label className={lbl}>Student <span className="text-red-400">*</span></label>
                                <select value={form.studentId} onChange={e => set("studentId", e.target.value)} className={inp} required>
                                    <option value="">— Select Student —</option>
                                    {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.enrollmentId})</option>)}
                                </select>
                            </div>
                        )}
                        {isEdit && (
                            <div className="flex items-center gap-3 p-3 bg-surface-alt rounded-xl">
                                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarColor(fee!.studentName)} flex items-center justify-center text-white text-xs font-bold`}>
                                    {getInitials(fee!.studentName)}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-text-primary">{fee!.studentName}</p>
                                    <p className="text-xs text-text-muted">{fee!.className} · #{fee!.studentId}</p>
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={lbl}>Amount (₹) <span className="text-red-400">*</span></label>
                                <input type="number" value={form.amount} onChange={e => set("amount", e.target.value)} placeholder="1250" min="0" step="0.01" className={inp} required />
                            </div>
                            <div>
                                <label className={lbl}>Due Date <span className="text-red-400">*</span></label>
                                <input type="date" value={form.dueDate} onChange={e => set("dueDate", e.target.value)} className={inp} required />
                            </div>
                        </div>
                        <div>
                            <label className={lbl}>Description</label>
                            <input value={form.description} onChange={e => set("description", e.target.value)} placeholder="e.g. Tuition Fee, Bus Fee" className={inp} />
                        </div>
                        <div>
                            <label className={lbl}>Status</label>
                            <select value={form.status} onChange={e => set("status", e.target.value)} className={inp}>
                                <option value="PENDING">Pending</option>
                                <option value="PAID">Paid</option>
                                <option value="OVERDUE">Overdue</option>
                            </select>
                        </div>
                        {err && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
                    </div>
                    <div className="flex items-center gap-3 px-6 py-4 border-t border-border">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-text-secondary hover:bg-surface-alt transition-all">Cancel</button>
                        <button type="submit" disabled={saving}
                            className="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent-dark text-white font-bold text-sm shadow-md shadow-accent/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            {saving ? "Saving..." : (isEdit ? "Save Changes" : "Add Fee")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Delete Confirm Modal ─────────────────────────────────────

function DeleteFeeModal({ fee, onClose, onDone }: { fee: ApiFee; onClose: () => void; onDone: () => void }) {
    const [deleting, setDeleting] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const handleDelete = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/fees/${fee.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");
            onDone(); onClose();
        } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Failed to delete."); }
        finally { setDeleting(false); }
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center"><Trash2 className="w-5 h-5 text-red-500" /></div>
                    <div>
                        <h2 className="text-base font-bold text-text-primary">Delete Fee Record</h2>
                        <p className="text-xs text-text-muted">#{fee.id.slice(-6).toUpperCase()}</p>
                    </div>
                </div>
                <p className="text-sm text-text-secondary mb-4">
                    Delete <strong>{fmt(fee.amount)}</strong> fee for <strong>{fee.studentName}</strong>? This cannot be undone.
                </p>
                {err && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg mb-4">{err}</p>}
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-text-secondary hover:bg-surface-alt">Cancel</button>
                    <button onClick={handleDelete} disabled={deleting}
                        className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                        {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {deleting ? "Deleting..." : "Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Row Context Menu ─────────────────────────────────────────

function RowMenu({ fee, onMarkPaid, onEdit, onDelete }: {
    fee: ApiFee;
    onMarkPaid: (f: ApiFee) => void;
    onEdit: (f: ApiFee) => void;
    onDelete: (f: ApiFee) => void;
}) {
    const [open, setOpen] = useState(false);
    const [marking, setMarking] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        if (open) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const markPaid = async () => {
        setMarking(true); setOpen(false);
        try {
            const res = await fetch(`/api/fees/${fee.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "PAID" }),
            });
            if (!res.ok) throw new Error();
            onMarkPaid(fee);
        } catch { alert("Failed to mark as paid."); }
        finally { setMarking(false); }
    };

    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setOpen(o => !o)}
                className="p-1.5 rounded-lg hover:bg-surface-alt text-text-muted hover:text-text-primary transition-colors">
                {marking ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreVertical className="w-4 h-4" />}
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1 bg-surface rounded-xl border border-border shadow-xl z-30 py-1 w-44">
                    {fee.status !== "PAID" && (
                        <button onClick={markPaid}
                            className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Mark as Paid
                        </button>
                    )}
                    <button onClick={() => { setOpen(false); onEdit(fee); }}
                        className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-text-primary hover:bg-surface-alt transition-colors">
                        <Pencil className="w-3.5 h-3.5 text-text-muted" /> Edit Record
                    </button>
                    <div className="border-t border-border my-1" />
                    <button onClick={() => { setOpen(false); onDelete(fee); }}
                        className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Page Component ─────────────────────────────────────────

export default function FeesPage() {
    const [aggregations, setAggregations] = useState<ApiAggregations | null>(null);
    const [defaulters, setDefaulters] = useState<ApiDefaulter[]>([]);
    const [fees, setFees] = useState<ApiFee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [defaulterTab, setDefaulterTab] = useState<"critical" | "warning">("critical");
    const [lateFeeAuto, setLateFeeAuto] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editFee, setEditFee] = useState<ApiFee | null>(null);
    const [deleteFee, setDeleteFee] = useState<ApiFee | null>(null);
    const [statusFilter, setStatusFilter] = useState("All");
    const [filterOpen, setFilterOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [showAll, setShowAll] = useState(false);
    const [sendingReminder, setSendingReminder] = useState<string | null>(null);
    const [reminderSent, setReminderSent] = useState<Set<string>>(new Set());

    const fetchData = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetch("/api/fees?limit=200");
            if (!res.ok) throw new Error("Failed to fetch fees");
            const data = await res.json();
            setAggregations(data.aggregations);
            setDefaulters(data.defaulters || []);
            setFees(data.fees || []);
        } catch { setError("Failed to load fee data. Please try again."); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const chartData = useMemo(() => {
        const now = new Date();
        return Array.from({ length: 6 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
            const key = d.toLocaleDateString("en-US", { month: "short" });
            const mFees = fees.filter(f => {
                const fd = new Date(f.createdAt);
                return fd.getMonth() === d.getMonth() && fd.getFullYear() === d.getFullYear() && f.status === "PAID";
            });
            const collection = mFees.reduce((s, f) => s + f.amount, 0);
            return { month: key, collection, projected: Math.round(collection * 1.12) };
        });
    }, [fees]);

    const criticalDefaulters = defaulters.filter(d => Math.floor((Date.now() - new Date(d.dueDate).getTime()) / 86400000) >= 30);
    const warningDefaulters = defaulters.filter(d => Math.floor((Date.now() - new Date(d.dueDate).getTime()) / 86400000) < 30);
    const visibleDefaulters = defaulterTab === "critical" ? criticalDefaulters : warningDefaulters;

    const filteredFees = useMemo(() => {
        let list = fees;
        if (statusFilter !== "All") {
            const map: Record<string, string> = { Completed: "PAID", Processing: "PENDING", Overdue: "OVERDUE" };
            list = list.filter(f => f.status === map[statusFilter]);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(f =>
                f.studentName.toLowerCase().includes(q) ||
                f.id.toLowerCase().includes(q) ||
                (f.description?.toLowerCase() || "").includes(q) ||
                f.className.toLowerCase().includes(q)
            );
        }
        return list;
    }, [fees, statusFilter, search]);

    const displayFees = showAll ? filteredFees : filteredFees.slice(0, 15);

    // Optimistic mark-paid update
    const handleMarkPaid = (paid: ApiFee) => {
        setFees(prev => prev.map(f => f.id === paid.id ? { ...f, status: "PAID", paidDate: new Date().toISOString() } : f));
        setAggregations(prev => prev ? {
            ...prev,
            totalCollected: prev.totalCollected + paid.amount,
            pendingDues: Math.max(0, prev.pendingDues - (paid.status === "PENDING" ? paid.amount : 0)),
            overdueDues: Math.max(0, prev.overdueDues - (paid.status === "OVERDUE" ? paid.amount : 0)),
            paidCount: prev.paidCount + 1,
            pendingCount: Math.max(0, paid.status === "PENDING" ? prev.pendingCount - 1 : prev.pendingCount),
            overdueCount: Math.max(0, paid.status === "OVERDUE" ? prev.overdueCount - 1 : prev.overdueCount),
        } : null);
    };

    const sendReminder = async (defaulter: ApiDefaulter) => {
        setSendingReminder(defaulter.id);
        try {
            const res = await fetch(`/api/fees/${defaulter.id}/remind`, { method: 'POST' });
            if (res.ok) {
                setReminderSent(s => new Set(s).add(defaulter.id));
            }
        } catch (error) {
            console.error("Failed to send reminder:", error);
        } finally { setSendingReminder(null); }
    };

    // Export CSV
    const exportCSV = () => {
        const rows = [
            ["Fee ID", "Student", "Class", "Description", "Amount", "Due Date", "Paid Date", "Status"],
            ...filteredFees.map(f => [
                "#" + f.id.slice(-6).toUpperCase(),
                f.studentName, f.className,
                f.description || "",
                f.amount,
                new Date(f.dueDate).toLocaleDateString("en-IN"),
                f.paidDate ? new Date(f.paidDate).toLocaleDateString("en-IN") : "",
                f.status,
            ]),
        ];
        const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `fees_export_${new Date().toISOString().split("T")[0]}.csv`;
        a.click(); URL.revokeObjectURL(url);
    };

    const agg = aggregations;

    if (loading) return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-text-primary">Fee Management</h1>
            </div>
            <div className="flex items-center justify-center py-24 text-text-muted">
                <Loader2 className="w-8 h-8 animate-spin mr-3" />
                <span className="text-sm font-medium">Loading fee data...</span>
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

    return (
        <div className="animate-fade-in">
            {/* Modals */}
            {showAddModal && <FeeModal onClose={() => setShowAddModal(false)} onDone={fetchData} />}
            {editFee && <FeeModal fee={editFee} onClose={() => setEditFee(null)} onDone={fetchData} />}
            {deleteFee && <DeleteFeeModal fee={deleteFee} onClose={() => setDeleteFee(null)} onDone={fetchData} />}

            {/* ─── Header ─── */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Fee Management</h1>
                    <p className="text-text-secondary text-sm mt-0.5">Overview of collections, dues, and financial health.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchData}
                        className="p-2.5 rounded-xl border border-border text-text-secondary hover:bg-surface-alt transition-all" title="Refresh">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button onClick={exportCSV}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-text-secondary text-sm font-semibold hover:bg-surface-alt transition-all">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                    <button onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-dark text-white font-bold text-sm rounded-xl shadow-md shadow-accent/25 transition-all active:scale-[0.98]">
                        <Plus className="w-4 h-4" /> Add Fee Record
                    </button>
                </div>
            </div>

            {/* ─── Stat Cards ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6 stagger-children">
                {[
                    { icon: CreditCard, bg: "bg-emerald-50", iconColor: "text-emerald-600", label: "Total Receivables", value: fmt(agg?.totalReceivable || 0), sub: `${agg?.totalCount || 0} records` },
                    { icon: DollarSign, bg: "bg-blue-50", iconColor: "text-blue-600", label: "Fees Collected", value: fmt(agg?.totalCollected || 0), sub: `${agg?.paidCount || 0} paid` },
                    { icon: Clock, bg: "bg-amber-50", iconColor: "text-amber-600", label: "Pending Dues", value: fmt(agg?.pendingDues || 0), sub: `${agg?.pendingCount || 0} pending` },
                    { icon: AlertTriangle, bg: "bg-red-50", iconColor: "text-red-500", label: "Overdue Dues", value: fmt(agg?.overdueDues || 0), sub: `${agg?.overdueCount || 0} overdue` },
                ].map(card => (
                    <div key={card.label} className="card p-5">
                        <div className="flex items-start justify-between mb-3">
                            <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center`}>
                                <card.icon className={`w-4 h-4 ${card.iconColor}`} />
                            </div>
                            <span className="text-xs font-medium text-text-muted">{card.sub}</span>
                        </div>
                        <p className="text-xs text-text-muted font-medium mb-0.5">{card.label}</p>
                        <p className="text-2xl font-extrabold text-text-primary">{card.value}</p>
                    </div>
                ))}
            </div>

            {/* ─── Chart + Defaulters ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
                {/* Chart */}
                <div className="lg:col-span-3 card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-text-primary">Financial Overview</h3>
                        <span className="text-xs font-medium text-text-muted bg-surface-alt px-3 py-1.5 rounded-full">Last 6 Months</span>
                    </div>
                    <div className="flex items-center gap-8 mb-6">
                        <div>
                            <p className="text-xs text-accent font-semibold mb-0.5">Total Collected</p>
                            <p className="text-2xl font-extrabold text-text-primary">{fmtK(agg?.totalCollected || 0)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-text-muted font-semibold mb-0.5">Pending + Overdue</p>
                            <p className="text-2xl font-extrabold text-text-primary">{fmtK((agg?.pendingDues || 0) + (agg?.overdueDues || 0))}</p>
                        </div>
                        <div>
                            <p className="text-xs text-text-muted font-semibold mb-0.5">Collection Rate</p>
                            <p className="text-2xl font-extrabold text-text-primary">
                                {agg?.totalReceivable ? Math.round((agg.totalCollected / agg.totalReceivable) * 100) : 0}%
                            </p>
                        </div>
                    </div>
                    <div className="h-[200px]">
                        {chartData.some(d => d.collection > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="feeGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.15} />
                                            <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="projected" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="6 4" fill="none" dot={false} />
                                    <Area type="monotone" dataKey="collection" stroke="#22c55e" strokeWidth={2.5} fill="url(#feeGradient)"
                                        dot={{ r: 4, fill: "#22c55e", stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-text-muted">
                                <DollarSign className="w-8 h-8 mb-2 opacity-30" />
                                <p className="text-sm">No payment data for the last 6 months</p>
                                <button onClick={() => setShowAddModal(true)} className="mt-3 text-sm font-bold text-accent hover:underline">Add a fee record</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Defaulters */}
                <div className="lg:col-span-2 card p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-lg font-bold text-text-primary">Defaulter List</h3>
                        <span className="text-xs font-medium text-text-muted">{defaulters.length} total</span>
                    </div>
                    <p className="text-xs text-text-muted mb-4">Students with overdue payments</p>
                    <div className="flex items-center gap-2 mb-4">
                        {(["critical", "warning"] as const).map(tab => (
                            <button key={tab} onClick={() => setDefaulterTab(tab)}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all capitalize ${defaulterTab === tab
                                    ? tab === "critical" ? "bg-red-500 text-white shadow-md shadow-red-500/25" : "bg-amber-500 text-white shadow-md shadow-amber-500/25"
                                    : "bg-surface-alt text-text-secondary"}`}>
                                {tab} ({tab === "critical" ? criticalDefaulters.length : warningDefaulters.length})
                            </button>
                        ))}
                    </div>
                    <div className="flex-1 space-y-1 overflow-y-auto max-h-[260px] pr-1">
                        {visibleDefaulters.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-text-muted">
                                <Check className="w-6 h-6 mb-2 text-emerald-400" />
                                <p className="text-sm">No {defaulterTab} defaulters 🎉</p>
                            </div>
                        ) : (
                            visibleDefaulters.map(d => {
                                const sent = reminderSent.has(d.id);
                                const sending = sendingReminder === d.id;
                                return (
                                    <div key={d.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-alt/70 transition-colors group">
                                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarColor(d.studentName)} flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0`}>
                                            {getInitials(d.studentName)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-text-primary truncate">{d.studentName}</p>
                                            <p className="text-[11px] text-text-muted">{d.className} · {daysLate(d.dueDate)}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <p className="text-sm font-bold text-red-500">{fmt(d.amount)}</p>
                                            <button onClick={() => sendReminder(d)} disabled={sending || sent}
                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${sent ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600 hover:bg-amber-100"} disabled:opacity-60`}>
                                                {sending ? "..." : sent ? "✓ Sent" : "Remind"}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                        <span className="text-sm font-medium text-text-primary">Late Fee Automation</span>
                        <button onClick={() => setLateFeeAuto(!lateFeeAuto)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${lateFeeAuto ? "bg-accent" : "bg-gray-200"}`}>
                            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ${lateFeeAuto ? "translate-x-6" : "translate-x-1"}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ─── Transactions Table ─── */}
            <div className="card overflow-hidden">
                <div className="p-6 pb-4 flex flex-wrap items-center gap-3 justify-between">
                    <h3 className="text-lg font-bold text-text-primary">
                        Fee Records
                        <span className="ml-2 text-sm font-normal text-text-muted">({filteredFees.length})</span>
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Search student, class..."
                                className="pl-9 pr-4 py-2 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-text-muted w-52" />
                            {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"><X className="w-3.5 h-3.5" /></button>}
                        </div>
                        {/* Status Filter */}
                        <div className="relative">
                            <button onClick={() => setFilterOpen(!filterOpen)}
                                className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border text-text-secondary text-sm font-medium hover:bg-surface-alt transition-all">
                                <Filter className="w-3.5 h-3.5" />
                                {statusFilter}
                                <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            {filterOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
                                    <div className="absolute top-full right-0 mt-1.5 bg-surface rounded-xl border border-border shadow-xl z-20 py-1 min-w-[140px]">
                                        {["All", "Completed", "Processing", "Overdue"].map(opt => (
                                            <button key={opt} onClick={() => { setStatusFilter(opt); setFilterOpen(false); }}
                                                className={`w-full text-left px-4 py-2 text-sm transition-colors ${statusFilter === opt ? "bg-accent/10 text-accent font-semibold" : "text-text-primary hover:bg-surface-alt"}`}>
                                                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${opt === "Completed" ? "bg-emerald-500" : opt === "Overdue" ? "bg-red-500" : opt === "Processing" ? "bg-amber-500" : "bg-gray-300"}`} />
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                        {/* Add */}
                        <button onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-text-primary text-sm font-bold hover:bg-surface-alt transition-all">
                            <Plus className="w-4 h-4" /> Manual Entry
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-t border-b border-border bg-surface-alt/30">
                                <th className="px-6 py-3 text-left text-[10px] font-bold text-accent uppercase tracking-wider">Fee ID</th>
                                <th className="px-4 py-3 text-left text-[10px] font-bold text-accent uppercase tracking-wider">Student</th>
                                <th className="px-4 py-3 text-left text-[10px] font-bold text-accent uppercase tracking-wider">Description</th>
                                <th className="px-4 py-3 text-left text-[10px] font-bold text-accent uppercase tracking-wider">Due Date</th>
                                <th className="px-4 py-3 text-left text-[10px] font-bold text-accent uppercase tracking-wider">Paid Date</th>
                                <th className="px-4 py-3 text-right text-[10px] font-bold text-accent uppercase tracking-wider">Amount</th>
                                <th className="px-4 py-3 text-left text-[10px] font-bold text-accent uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-center text-[10px] font-bold text-accent uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayFees.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-text-muted text-sm">
                                        {fees.length === 0
                                            ? <>No fee records yet. <button onClick={() => setShowAddModal(true)} className="text-accent font-bold hover:underline">Add one</button>.</>
                                            : "No records match your search or filter."}
                                    </td>
                                </tr>
                            ) : (
                                displayFees.map(fee => {
                                    const txnStatus = mapStatus(fee.status);
                                    return (
                                        <tr key={fee.id} className="border-b border-border-light hover:bg-surface-alt/40 transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-semibold text-text-primary font-mono">#{fee.id.slice(-6).toUpperCase()}</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(fee.studentName)} flex items-center justify-center text-white text-[10px] font-bold shadow-sm flex-shrink-0`}>
                                                        {getInitials(fee.studentName)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-text-primary">{fee.studentName}</p>
                                                        <p className="text-[11px] text-text-muted">{fee.className}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="text-sm text-text-primary font-medium">{fee.description || <span className="text-text-muted">—</span>}</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="text-sm text-text-secondary">
                                                    {new Date(fee.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="text-sm text-text-secondary">
                                                    {fee.paidDate
                                                        ? new Date(fee.paidDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                                                        : <span className="text-text-muted">—</span>}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <span className="text-sm font-bold text-text-primary">{fmt(fee.amount)}</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusBg[txnStatus]}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${statusDot[txnStatus]}`} />
                                                    {txnStatus}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <RowMenu fee={fee} onMarkPaid={handleMarkPaid} onEdit={setEditFee} onDelete={setDeleteFee} />
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-text-muted">
                        Showing {displayFees.length} of {filteredFees.length} records
                    </span>
                    {filteredFees.length > 15 && (
                        <button onClick={() => setShowAll(s => !s)}
                            className="inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:text-accent-dark transition-colors">
                            {showAll ? "Show Less" : `View All ${filteredFees.length} Records`}
                            <ChevronDown className={`w-4 h-4 transition-transform ${showAll ? "rotate-180" : ""}`} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

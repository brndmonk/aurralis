"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
    ChevronLeft, ChevronRight, Plus, Printer, MapPin,
    MoreHorizontal, Loader2, X, Pencil, Trash2,
    Calendar, Download, RefreshCw, Check,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────

type EventCategory = "academic" | "holiday" | "meeting";
type ApiEventType = "MEETING" | "EXHIBITION" | "HOLIDAY" | "ACTIVITY" | "OTHER";

interface ApiEvent {
    id: string; title: string; description: string | null;
    startDate: string; endDate: string | null; location: string | null;
    type: ApiEventType; createdAt: string;
}

interface CalEvent {
    id: string; title: string; date: number; endDate?: number;
    startMonth: number; startYear: number; category: EventCategory;
    time: string; location?: string; description?: string; type: ApiEventType;
    rawStartDate: string; rawEndDate: string | null;
}

// ─── Config ────────────────────────────────────────────────────

const catCfg: Record<EventCategory, { color: string; bg: string; dot: string; label: string; pill: string }> = {
    academic: { color: "text-blue-700", bg: "bg-blue-50 border-blue-100", dot: "bg-blue-500", label: "Academic", pill: "bg-blue-500" },
    holiday: { color: "text-rose-700", bg: "bg-rose-50 border-rose-100", dot: "bg-rose-500", label: "Holidays", pill: "bg-rose-500" },
    meeting: { color: "text-violet-700", bg: "bg-violet-50 border-violet-100", dot: "bg-violet-500", label: "Meetings", pill: "bg-violet-500" },
};

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// ─── Helpers ───────────────────────────────────────────────────

function mapType(t: ApiEventType): EventCategory {
    if (t === "MEETING") return "meeting";
    if (t === "HOLIDAY") return "holiday";
    return "academic";
}
function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(y: number, m: number) { return new Date(y, m, 1).getDay(); }
function fmtTime(d: string) {
    return new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}
function fmtDatetimeLocal(d: string) {
    const dt = new Date(d);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}
function toISOLocal(dateStr: string): string {
    return new Date(dateStr).toISOString();
}

// ─── Event Form Modal (Create + Edit) ─────────────────────────

function EventFormModal({ event, prefillDate, onClose, onDone }: {
    event?: CalEvent; prefillDate?: string; onClose: () => void; onDone: () => void;
}) {
    const isEdit = !!event;
    const [form, setForm] = useState({
        title: event?.title ?? "",
        type: event?.type ?? "MEETING" as ApiEventType | string,
        startDate: event ? fmtDatetimeLocal(event.rawStartDate) : prefillDate ?? "",
        endDate: event?.rawEndDate ? fmtDatetimeLocal(event.rawEndDate) : "",
        location: event?.location ?? "",
        description: event?.description ?? "",
    });
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim() || !form.startDate) { setErr("Title and start date are required."); return; }
        setSaving(true); setErr(null);
        try {
            const payload = {
                title: form.title.trim(),
                type: form.type,
                startDate: new Date(form.startDate).toISOString(),
                endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
                location: form.location.trim() || null,
                description: form.description.trim() || null,
            };
            const res = await fetch(isEdit ? `/api/events/${event!.id}` : "/api/events", {
                method: isEdit ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error(d.error || "Operation failed");
            }
            onDone(); onClose();
        } catch (err: unknown) { setErr(err instanceof Error ? err.message : "Failed to save."); }
        finally { setSaving(false); }
    };

    const inp = "w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-text-muted";
    const lbl = "block text-xs font-semibold text-text-secondary mb-1.5";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-border flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-text-primary">{isEdit ? "Edit Event" : "Add New Event"}</h2>
                        {prefillDate && !isEdit && (
                            <p className="text-xs text-text-muted mt-0.5">{new Date(prefillDate).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" })}</p>
                        )}
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-alt text-text-muted transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
                        <div>
                            <label className={lbl}>Event Title <span className="text-red-400">*</span></label>
                            <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Parent-Teacher Meeting" className={inp} required />
                        </div>
                        <div>
                            <label className={lbl}>Event Type</label>
                            <select value={form.type} onChange={e => set("type", e.target.value)} className={inp}>
                                <option value="MEETING">Meeting</option>
                                <option value="HOLIDAY">Holiday</option>
                                <option value="ACTIVITY">Activity</option>
                                <option value="EXHIBITION">Exhibition</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={lbl}>Start Date & Time <span className="text-red-400">*</span></label>
                                <input type="datetime-local" value={form.startDate} onChange={e => set("startDate", e.target.value)} className={inp} required />
                            </div>
                            <div>
                                <label className={lbl}>End Date & Time</label>
                                <input type="datetime-local" value={form.endDate} onChange={e => set("endDate", e.target.value)} className={inp} />
                            </div>
                        </div>
                        <div>
                            <label className={lbl}>Location</label>
                            <input value={form.location} onChange={e => set("location", e.target.value)} placeholder="e.g. Auditorium, Room 201" className={inp} />
                        </div>
                        <div>
                            <label className={lbl}>Description</label>
                            <textarea value={form.description} onChange={e => set("description", e.target.value)}
                                placeholder="Optional notes about the event" rows={2} className={`${inp} resize-none`} />
                        </div>
                        {err && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
                    </div>
                    <div className="flex items-center gap-3 px-6 py-4 border-t border-border flex-shrink-0">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-text-secondary hover:bg-surface-alt transition-all">Cancel</button>
                        <button type="submit" disabled={saving}
                            className="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent-dark text-white font-bold text-sm shadow-md shadow-accent/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Event"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Delete Confirm Modal ──────────────────────────────────────

function DeleteEventModal({ event, onClose, onDone }: { event: CalEvent; onClose: () => void; onDone: () => void }) {
    const [deleting, setDeleting] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const handleDelete = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/events/${event.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");
            onDone(); onClose();
        } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Failed"); }
        finally { setDeleting(false); }
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center"><Trash2 className="w-5 h-5 text-red-500" /></div>
                    <div>
                        <h2 className="text-base font-bold text-text-primary">Delete Event</h2>
                        <p className="text-xs text-text-muted">This action cannot be undone</p>
                    </div>
                </div>
                <p className="text-sm text-text-secondary mb-4">Delete <strong>{event.title}</strong>?</p>
                {err && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg mb-4">{err}</p>}
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-text-secondary hover:bg-surface-alt">Cancel</button>
                    <button onClick={handleDelete} disabled={deleting}
                        className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                        {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {deleting ? "Deleting..." : "Delete Event"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Day Detail Panel ──────────────────────────────────────────

function DayDetailPanel({ day, month, year, events, onClose, onEdit, onDelete, onAdd }: {
    day: number; month: number; year: number; events: CalEvent[];
    onClose: () => void; onEdit: (e: CalEvent) => void; onDelete: (e: CalEvent) => void; onAdd: () => void;
}) {
    const dateLabel = new Date(year, month, day).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    return (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-surface rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-sm mx-0 sm:mx-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border flex-shrink-0">
                    <div>
                        <p className="text-xs font-bold text-accent uppercase tracking-wider">{dateLabel}</p>
                        <p className="text-sm text-text-muted mt-0.5">{events.length} event{events.length !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={onAdd}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white text-xs font-bold rounded-lg">
                            <Plus className="w-3 h-3" /> Add
                        </button>
                        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-alt text-text-muted"><X className="w-4 h-4" /></button>
                    </div>
                </div>
                <div className="overflow-y-auto flex-1 p-4 space-y-2">
                    {events.length === 0 ? (
                        <div className="text-center py-8">
                            <Calendar className="w-8 h-8 text-text-muted/40 mx-auto mb-2" />
                            <p className="text-sm text-text-muted">No events on this day</p>
                            <button onClick={onAdd} className="mt-2 text-accent text-sm font-bold hover:underline">Add an event</button>
                        </div>
                    ) : events.map(evt => {
                        const cfg = catCfg[evt.category];
                        return (
                            <div key={evt.id} className={`border-l-4 ${evt.category === "meeting" ? "border-l-violet-400" : evt.category === "holiday" ? "border-l-rose-400" : "border-l-blue-400"} rounded-xl p-3.5 bg-surface-alt/50 group`}>
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border mb-1`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} /> {cfg.label}
                                        </span>
                                        <p className="text-sm font-bold text-text-primary">{evt.title}</p>
                                        <p className="text-xs text-accent font-semibold mt-0.5">{evt.time}</p>
                                        {evt.location && <p className="text-[11px] text-text-muted flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{evt.location}</p>}
                                        {evt.description && <p className="text-[11px] text-text-muted mt-1 line-clamp-2">{evt.description}</p>}
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                        <button onClick={() => onEdit(evt)} className="p-1.5 rounded-lg hover:bg-surface-alt text-text-muted hover:text-text-primary transition-colors">
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => onDelete(evt)} className="p-1.5 rounded-lg hover:bg-red-50 text-text-muted hover:text-red-500 transition-colors">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ─── Sidebar Event Menu ────────────────────────────────────────

function SidebarEventMenu({ event, onEdit, onDelete }: { event: CalEvent; onEdit: (e: CalEvent) => void; onDelete: (e: CalEvent) => void }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        if (open) document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, [open]);
    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setOpen(o => !o)} className="text-text-muted hover:text-text-primary transition-colors p-0.5 rounded">
                <MoreHorizontal className="w-4 h-4" />
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1 bg-surface rounded-xl border border-border shadow-xl z-30 py-1 w-36">
                    <button onClick={() => { setOpen(false); onEdit(event); }}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-text-primary hover:bg-surface-alt">
                        <Pencil className="w-3.5 h-3.5 text-text-muted" /> Edit
                    </button>
                    <div className="border-t border-border my-1" />
                    <button onClick={() => { setOpen(false); onDelete(event); }}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Page ──────────────────────────────────────────────────────

export default function CalendarPage() {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth());
    const [activeFilter, setActiveFilter] = useState<"all" | EventCategory>("all");
    const [apiEvents, setApiEvents] = useState<ApiEvent[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [showModal, setShowModal] = useState(false);
    const [editEvent, setEditEvent] = useState<CalEvent | null>(null);
    const [deleteEvent, setDeleteEvent] = useState<CalEvent | null>(null);
    const [prefillDate, setPrefillDate] = useState<string | undefined>();

    // Day detail panel
    const [selectedDay, setSelectedDay] = useState<number | null>(null);

    const todayDay = now.getDate(), todayMonth = now.getMonth(), todayYear = now.getFullYear();

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/events");
            const data = await res.json();
            if (Array.isArray(data)) setApiEvents(data);
        } catch { /* silently fail */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    // Map API → CalEvent
    const calendarEvents: CalEvent[] = useMemo(() => apiEvents.map(e => {
        const start = new Date(e.startDate);
        const end = e.endDate ? new Date(e.endDate) : null;
        return {
            id: e.id, title: e.title, type: e.type,
            date: start.getDate(),
            endDate: end && (end.getMonth() === start.getMonth() && end.getFullYear() === start.getFullYear()) ? end.getDate() : undefined,
            startMonth: start.getMonth(), startYear: start.getFullYear(),
            category: mapType(e.type), time: fmtTime(e.startDate),
            location: e.location || undefined, description: e.description || undefined,
            rawStartDate: e.startDate, rawEndDate: e.endDate,
        };
    }), [apiEvents]);

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDay(year, month);
    const prevMonthDays = getDaysInMonth(year, month - 1);

    const calendarCells = useMemo(() => {
        const cells: { day: number; isCurrentMonth: boolean }[] = [];
        for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevMonthDays - i, isCurrentMonth: false });
        for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, isCurrentMonth: true });
        const rem = 42 - cells.length;
        for (let d = 1; d <= rem; d++) cells.push({ day: d, isCurrentMonth: false });
        return cells;
    }, [daysInMonth, firstDay, prevMonthDays]);

    const eventsThisMonth = useMemo(() =>
        calendarEvents.filter(e => e.startMonth === month && e.startYear === year),
        [calendarEvents, month, year]);

    const filteredEvents = useMemo(() =>
        activeFilter === "all" ? eventsThisMonth : eventsThisMonth.filter(e => e.category === activeFilter),
        [eventsThisMonth, activeFilter]);

    const getEventsForDay = (day: number) =>
        filteredEvents.filter(e => e.date === day || (e.endDate && day > e.date && day <= e.endDate));

    const isHolidayDay = (day: number) =>
        eventsThisMonth.some(e => e.category === "holiday" && e.endDate && day >= e.date && day <= e.endDate);

    const upcomingEvents = useMemo(() => {
        const todayTs = new Date(todayYear, todayMonth, todayDay).getTime();
        return calendarEvents
            .filter(e => new Date(e.startYear, e.startMonth, e.date).getTime() >= todayTs)
            .sort((a, b) => new Date(a.startYear, a.startMonth, a.date).getTime() - new Date(b.startYear, b.startMonth, b.date).getTime())
            .slice(0, 10);
    }, [calendarEvents, todayYear, todayMonth, todayDay]);

    // Category counts for this month
    const counts = useMemo(() => ({
        academic: eventsThisMonth.filter(e => e.category === "academic").length,
        holiday: eventsThisMonth.filter(e => e.category === "holiday").length,
        meeting: eventsThisMonth.filter(e => e.category === "meeting").length,
    }), [eventsThisMonth]);

    const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); setSelectedDay(null); };
    const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); setSelectedDay(null); };
    const goToToday = () => { setYear(todayYear); setMonth(todayMonth); setSelectedDay(todayDay); };
    const isToday = (d: number) => d === todayDay && month === todayMonth && year === todayYear;

    // Export iCal
    const exportICal = () => {
        const lines = [
            "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Aurralis//School Calendar//EN",
            "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
        ];
        calendarEvents.forEach(evt => {
            const dtstart = toISOLocal(evt.rawStartDate).replace(/[-:]/g, "").split(".")[0] + "Z";
            const dtend = evt.rawEndDate ? toISOLocal(evt.rawEndDate).replace(/[-:]/g, "").split(".")[0] + "Z" : dtstart;
            lines.push("BEGIN:VEVENT",
                `UID:${evt.id}@aurralis`,
                `DTSTART:${dtstart}`,
                `DTEND:${dtend}`,
                `SUMMARY:${evt.title}`,
                ...(evt.location ? [`LOCATION:${evt.location}`] : []),
                ...(evt.description ? [`DESCRIPTION:${evt.description}`] : []),
                "END:VEVENT");
        });
        lines.push("END:VCALENDAR");
        const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = "aurralis_calendar.ics"; a.click();
        URL.revokeObjectURL(url);
    };

    // Day click → open detail panel or toggle
    const handleDayClick = (day: number) => {
        setSelectedDay(prev => prev === day ? null : day);
    };

    const openAddForDay = (day: number) => {
        const pad = (n: number) => String(n).padStart(2, "0");
        const dateStr = `${year}-${pad(month + 1)}-${pad(day)}T09:00`;
        setPrefillDate(dateStr);
        setShowModal(true);
        setSelectedDay(null);
    };

    return (
        <div className="animate-fade-in">
            {/* Modals */}
            {showModal && (
                <EventFormModal prefillDate={prefillDate} onClose={() => { setShowModal(false); setPrefillDate(undefined); }} onDone={fetchEvents} />
            )}
            {editEvent && (
                <EventFormModal event={editEvent} onClose={() => setEditEvent(null)} onDone={fetchEvents} />
            )}
            {deleteEvent && (
                <DeleteEventModal event={deleteEvent} onClose={() => setDeleteEvent(null)} onDone={fetchEvents} />
            )}
            {/* Day detail panel */}
            {selectedDay !== null && (
                <DayDetailPanel
                    day={selectedDay} month={month} year={year}
                    events={getEventsForDay(selectedDay)}
                    onClose={() => setSelectedDay(null)}
                    onEdit={evt => { setSelectedDay(null); setEditEvent(evt); }}
                    onDelete={evt => { setSelectedDay(null); setDeleteEvent(evt); }}
                    onAdd={() => openAddForDay(selectedDay)}
                />
            )}

            <div className="flex gap-6">
                {/* ─── Main Calendar ─── */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-5">
                        <div>
                            <h1 className="text-2xl font-bold text-text-primary mb-1">School Event Calendar</h1>
                            <p className="text-text-secondary text-sm">Manage school schedule, holidays, and meetings</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button onClick={fetchEvents} className="p-2.5 rounded-xl border border-border text-text-secondary hover:bg-surface-alt transition-all" title="Refresh">
                                <RefreshCw className="w-4 h-4" />
                            </button>
                            <button onClick={exportICal} className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-border text-text-secondary text-sm font-semibold hover:bg-surface-alt transition-all">
                                <Download className="w-4 h-4" /> Export .ics
                            </button>
                            <button onClick={() => window.print()} className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-border text-text-secondary text-sm font-semibold hover:bg-surface-alt transition-all">
                                <Printer className="w-4 h-4" /> Print
                            </button>
                            <button onClick={() => { setPrefillDate(undefined); setShowModal(true); }}
                                className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-dark text-white font-bold text-sm rounded-xl shadow-md shadow-accent/25 transition-all active:scale-[0.98]">
                                <Plus className="w-4 h-4" /> Add Event
                            </button>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-4 gap-3 mb-5">
                        {[
                            { label: "Total", value: eventsThisMonth.length, color: "text-text-primary", bg: "bg-surface-alt" },
                            { label: "Academic", value: counts.academic, color: "text-blue-700", bg: "bg-blue-50" },
                            { label: "Holidays", value: counts.holiday, color: "text-rose-700", bg: "bg-rose-50" },
                            { label: "Meetings", value: counts.meeting, color: "text-violet-700", bg: "bg-violet-50" },
                        ].map(s => (
                            <div key={s.label} className={`${s.bg} rounded-2xl px-4 py-3 flex items-center justify-between`}>
                                <p className="text-xs font-semibold text-text-muted">{s.label}</p>
                                <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Navigation + Filters */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <button onClick={prevMonth} className="p-2 rounded-lg border border-border hover:bg-surface-alt text-text-muted transition-all"><ChevronLeft className="w-4 h-4" /></button>
                            <h2 className="text-lg font-bold text-text-primary min-w-[175px] text-center">{MONTHS[month]} {year}</h2>
                            <button onClick={nextMonth} className="p-2 rounded-lg border border-border hover:bg-surface-alt text-text-muted transition-all"><ChevronRight className="w-4 h-4" /></button>
                            <button onClick={goToToday} className="px-3 py-1.5 rounded-lg border border-border text-sm font-semibold text-text-primary hover:bg-surface-alt transition-all ml-1">Today</button>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <button onClick={() => setActiveFilter("all")}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${activeFilter === "all" ? "bg-sidebar text-white shadow-sm" : "bg-surface-alt text-text-secondary hover:text-text-primary"}`}>
                                {activeFilter === "all" && <Check className="w-3 h-3" />}
                                All ({eventsThisMonth.length})
                            </button>
                            {(Object.entries(catCfg) as [EventCategory, typeof catCfg.academic][]).map(([key, cfg]) => (
                                <button key={key} onClick={() => setActiveFilter(activeFilter === key ? "all" : key)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${activeFilter === key ? `${cfg.bg} ${cfg.color} border` : "bg-surface-alt text-text-secondary hover:text-text-primary"}`}>
                                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                    {cfg.label} ({counts[key]})
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="card overflow-hidden">
                        {/* Day headers */}
                        <div className="grid grid-cols-7 border-b border-border bg-surface-alt/30">
                            {DAYS.map(d => (
                                <div key={d} className="px-2 py-3 text-center text-[11px] font-bold text-text-muted tracking-wider">{d}</div>
                            ))}
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-16 text-text-muted">
                                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                <span className="text-sm">Loading events...</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-7">
                                {calendarCells.map((cell, idx) => {
                                    const dayEvents = cell.isCurrentMonth ? getEventsForDay(cell.day) : [];
                                    const isTodayCell = cell.isCurrentMonth && isToday(cell.day);
                                    const isHoliday = cell.isCurrentMonth && isHolidayDay(cell.day);
                                    const isSelected = cell.isCurrentMonth && selectedDay === cell.day;
                                    return (
                                        <div key={idx}
                                            onClick={() => cell.isCurrentMonth ? handleDayClick(cell.day) : undefined}
                                            className={`min-h-[96px] border-b border-r border-border-light p-1.5 transition-colors ${cell.isCurrentMonth ? "cursor-pointer" : ""}
                                                ${!cell.isCurrentMonth ? "bg-surface-alt/20" : ""}
                                                ${isHoliday ? "bg-rose-50/50" : ""}
                                                ${isSelected ? "bg-accent/5 ring-1 ring-inset ring-accent/30" : ""}
                                                ${cell.isCurrentMonth && !isSelected ? "hover:bg-surface-alt/40" : ""}`}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`text-xs font-semibold flex items-center justify-center w-6 h-6 rounded-full transition-colors
                                                    ${!cell.isCurrentMonth ? "text-text-muted/40" : ""}
                                                    ${isTodayCell ? "bg-accent text-white text-[11px] font-bold" : cell.isCurrentMonth ? "text-text-primary" : ""}`}>
                                                    {cell.day}
                                                </span>
                                                {dayEvents.length > 0 && cell.isCurrentMonth && (
                                                    <span className="text-[9px] font-bold text-text-muted">{dayEvents.length}</span>
                                                )}
                                            </div>
                                            <div className="space-y-0.5">
                                                {dayEvents.slice(0, 3).map((evt, i) => {
                                                    const cfg = catCfg[evt.category];
                                                    return (
                                                        <div key={i}
                                                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${cfg.bg} ${cfg.color} border truncate`}
                                                            title={evt.title}>
                                                            {evt.date === cell.day || !evt.endDate ? evt.title : ""}
                                                        </div>
                                                    );
                                                })}
                                                {dayEvents.length > 3 && (
                                                    <span className="text-[9px] text-text-muted font-bold pl-0.5">+{dayEvents.length - 3} more</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-text-muted mt-2 text-center">Click any day to view or add events for that date</p>
                </div>

                {/* ─── Upcoming Events Sidebar ─── */}
                <div className="w-[290px] flex-shrink-0">
                    <div className="card p-5 sticky top-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-text-primary">Upcoming Events</h3>
                            <span className="text-xs bg-surface-alt text-text-muted font-semibold px-2.5 py-1 rounded-full">{upcomingEvents.length}</span>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-8 text-text-muted">
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                <span className="text-xs">Loading...</span>
                            </div>
                        ) : upcomingEvents.length === 0 ? (
                            <div className="text-center py-8">
                                <Calendar className="w-8 h-8 text-text-muted/40 mx-auto mb-2" />
                                <p className="text-sm text-text-muted mb-2">No upcoming events.</p>
                                <button onClick={() => setShowModal(true)} className="text-accent text-sm font-semibold hover:underline">Add an event</button>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[calc(100vh-240px)] overflow-y-auto pr-1">
                                {upcomingEvents.map(evt => {
                                    const isEvtToday = evt.date === todayDay && evt.startMonth === todayMonth && evt.startYear === todayYear;
                                    const dateLabel = isEvtToday
                                        ? `Today, ${MONTHS[evt.startMonth].slice(0, 3)} ${evt.date}`
                                        : `${MONTHS[evt.startMonth].slice(0, 3)} ${evt.date}${evt.startYear !== todayYear ? `, ${evt.startYear}` : ""}`;
                                    const borderColor = evt.category === "meeting" ? "border-l-violet-400" : evt.category === "holiday" ? "border-l-rose-400" : "border-l-blue-400";
                                    return (
                                        <div key={evt.id} className={`border-l-4 ${borderColor} rounded-xl p-3.5 bg-surface hover:bg-surface-alt/50 transition-colors group`}>
                                            <div className="flex items-start justify-between gap-1">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <span className="text-[10px] font-bold text-accent">{evt.time}</span>
                                                        {isEvtToday && <span className="text-[9px] font-bold bg-accent text-white px-1.5 py-0.5 rounded-full">Today</span>}
                                                    </div>
                                                    <p className="text-[11px] text-text-muted font-medium">{dateLabel}</p>
                                                    <p className="text-sm font-bold text-text-primary mt-0.5 truncate">{evt.title}</p>
                                                    {evt.location && (
                                                        <p className="text-[11px] text-text-muted flex items-center gap-1 mt-1">
                                                            <MapPin className="w-3 h-3 text-accent flex-shrink-0" />
                                                            <span className="truncate">{evt.location}</span>
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <SidebarEventMenu event={evt} onEdit={setEditEvent} onDelete={setDeleteEvent} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        <button onClick={() => setShowModal(true)}
                            className="mt-4 w-full py-2.5 rounded-xl border-2 border-dashed border-border text-text-secondary text-sm font-semibold hover:border-accent/40 hover:text-accent hover:bg-accent/[0.02] transition-all flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" /> Add Event
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

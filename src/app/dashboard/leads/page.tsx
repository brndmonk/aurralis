"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Phone,
    Calendar,
    Send,
    X,
    Upload,
    Plus,
    Clock,
    Paperclip,
    UserPlus,
    Users,
    Baby
} from "lucide-react";

// --- Types ---

interface LeadActivity {
    id: string;
    type: "CALL" | "EMAIL" | "TOUR" | "NOTE" | "SYSTEM";
    text: string;
    date: string;
    scheduledFor?: string;
    createdBy?: {
        name: string;
        role: string;
    };
}

interface Lead {
    id: string;
    parentName: string;
    childName: string;
    childAge: number;
    childProgram: string;
    email: string | null;
    phone: string | null;
    status: string;
    leadScore: number;
    intentLevel: string | null;
    createdAt: string;
    lastActivity: {
        type: string;
        text: string;
        date: string;
        scheduledFor?: string;
    } | null;
    nextTourDate?: string | null;
}

// --- Helpers ---

const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-700";
    if (score >= 50) return "bg-yellow-100 text-yellow-700";
    return "bg-gray-100 text-gray-700";
};

const getStatusBadge = (status: string) => {
    switch (status) {
        case "TOUR_SCHEDULED":
            return "bg-blue-50 text-blue-600 border border-blue-200";
        case "NEW":
            return "bg-gray-100 text-gray-600 border border-gray-200";
        case "APPLICATION_SENT":
            return "bg-purple-50 text-purple-600 border border-purple-200";
        case "WAITLIST":
            return "bg-red-50 text-red-600 border border-red-200";
        case "TOUR_COMPLETED":
            return "bg-blue-50 text-blue-600 border border-blue-200";
        default:
            return "bg-gray-50 text-gray-600 border border-gray-200";
    }
};

const formatStatus = (status: string) => {
    if (status === "TOUR_SCHEDULED") return "Tour Scheduled";
    if (status === "APPLICATION_SENT") return "Application Sent";
    if (status === "TOUR_COMPLETED") return "Tour Completed";
    return status.charAt(0) + status.slice(1).toLowerCase();
};

const getNextAction = (lead: Lead): { icon: string; text: string; color: string } => {
    if (lead.nextTourDate) {
        const date = new Date(lead.nextTourDate);
        const now = new Date();
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const isToday = date.toDateString() === now.toDateString();
        const isTomorrow = date.toDateString() === new Date(now.getTime() + 86400000).toDateString();
        const label = isToday ? `Today, ${timeStr}` : isTomorrow ? `Tomorrow, ${timeStr}` : `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${timeStr}`;
        return { icon: 'calendar', text: label, color: 'text-orange-600' };
    }
    switch (lead.status) {
        case 'NEW': return { icon: 'phone', text: 'Call pending', color: 'text-gray-600' };
        case 'CONTACTED': return { icon: 'calendar', text: 'Schedule tour', color: 'text-gray-600' };
        case 'APPLICATION_SENT': return { icon: 'send', text: 'Follow up email', color: 'text-gray-600' };
        case 'WAITLIST': return { icon: 'clock', text: 'Check availability', color: 'text-gray-600' };
        case 'TOUR_COMPLETED': return { icon: 'paperclip', text: 'Feedback needed', color: 'text-gray-600' };
        default: return { icon: 'phone', text: 'Call pending', color: 'text-gray-600' };
    }
};

const timeAgo = (date: string) => {
    const hours = Math.floor((new Date().getTime() - new Date(date).getTime()) / 3600000);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return `Yesterday`;
    if (days < 7) return `${days} days ago`;
    return `1 week ago`; // Simplified for UI matching
};

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [activities, setActivities] = useState<LeadActivity[]>([]);
    const [loadingActivities, setLoadingActivities] = useState(false);
    const [activeTab, setActiveTab] = useState("activity");

    const importInputRef = useRef<HTMLInputElement>(null);

    const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
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
                if (!row.parentname || !row.childname || !row.childage || !row.childprogram) continue;
                await fetch('/api/leads', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        parentName: row.parentname,
                        childName: row.childname,
                        childAge: row.childage,
                        childProgram: row.childprogram,
                        email: row.email || '',
                        phone: row.phone || '',
                        intentLevel: row.intentlevel || 'Warm',
                    }),
                });
            }
            fetchLeads();
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    // Form & Filter States
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isPostingActivity, setIsPostingActivity] = useState(false);
    const [noteText, setNoteText] = useState("");
    const [newLeadForm, setNewLeadForm] = useState({
        parentName: "",
        phone: "",
        email: "",
        contactMethod: "",
        childName: "",
        dob: "",
        childProgram: "",
        leadSource: "",
        notes: "",
        intentLevel: "Warm"
    });

    // Fetch leads
    const fetchLeads = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append("search", searchQuery);
            if (statusFilter !== "ALL") params.append("status", statusFilter);

            const res = await fetch(`/api/leads?${params.toString()}`);
            const data = await res.json();
            setLeads(data);
            if (data.length > 0 && !selectedLead) {
                setSelectedLead(data[0]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, statusFilter]);

    useEffect(() => {
        const timeout = setTimeout(fetchLeads, 300);
        return () => clearTimeout(timeout);
    }, [fetchLeads]);

    // Fetch activities when lead is selected
    const fetchActivities = useCallback(async () => {
        if (!selectedLead) return;
        setLoadingActivities(true);
        try {
            const res = await fetch(`/api/leads/${selectedLead.id}/activities`);
            const data = await res.json();
            setActivities(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingActivities(false);
        }
    }, [selectedLead]);

    useEffect(() => {
        if (selectedLead) {
            fetchActivities();
        }
    }, [selectedLead, fetchActivities]);

    const handleCreateLead = async () => {
        if (!newLeadForm.parentName || !newLeadForm.childName || !newLeadForm.dob) return;

        try {
            // Compute Age dynamically
            const birthDate = new Date(newLeadForm.dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            const ageDecimal = m < 0 ? age + (12 + m) / 12 : age + m / 12;

            const res = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    parentName: newLeadForm.parentName,
                    childName: newLeadForm.childName,
                    childAge: ageDecimal.toFixed(1),
                    childProgram: newLeadForm.childProgram,
                    email: newLeadForm.email,
                    phone: newLeadForm.phone,
                    intentLevel: newLeadForm.intentLevel,
                    notes: newLeadForm.notes,
                    contactMethod: newLeadForm.contactMethod,
                    leadSource: newLeadForm.leadSource,
                }),
            });

            if (res.ok) {
                setIsAddModalOpen(false);
                setNewLeadForm({ parentName: "", phone: "", email: "", contactMethod: "", childName: "", dob: "", childProgram: "", leadSource: "", notes: "", intentLevel: "Warm" });
                fetchLeads();
            }
        } catch (error) {
            console.error("Failed to create lead:", error);
        }
    };

    const handleCreateAndBookTrial = async () => {
        if (!newLeadForm.parentName || !newLeadForm.childName || !newLeadForm.dob) return;

        try {
            const birthDate = new Date(newLeadForm.dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
            const ageDecimal = m < 0 ? age + (12 + m) / 12 : age + m / 12;

            const res = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    parentName: newLeadForm.parentName,
                    childName: newLeadForm.childName,
                    childAge: ageDecimal.toFixed(1),
                    childProgram: newLeadForm.childProgram,
                    email: newLeadForm.email,
                    phone: newLeadForm.phone,
                    intentLevel: newLeadForm.intentLevel,
                    notes: newLeadForm.notes,
                    contactMethod: newLeadForm.contactMethod,
                    leadSource: newLeadForm.leadSource,
                }),
            });

            if (res.ok) {
                const newLead = await res.json();
                // Also log a tour activity
                await fetch(`/api/leads/${newLead.id}/activities`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'TOUR',
                        text: 'School Tour Scheduled.',
                        scheduledFor: new Date(Date.now() + 86400000).toISOString(),
                    }),
                });
                setIsAddModalOpen(false);
                setNewLeadForm({ parentName: "", phone: "", email: "", contactMethod: "", childName: "", dob: "", childProgram: "", leadSource: "", notes: "", intentLevel: "Warm" });
                fetchLeads();
            }
        } catch (error) {
            console.error("Failed to create lead with trial:", error);
        }
    };

    const handleLogActivity = async (type: string, text: string, scheduledFor?: string) => {
        if (!selectedLead) return;
        setIsPostingActivity(true);
        try {
            const res = await fetch(`/api/leads/${selectedLead.id}/activities`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    text,
                    scheduledFor,
                })
            });
            if (res.ok) {
                setNoteText("");
                fetchActivities();
                fetchLeads(); // Refresh leads timeline
            }
        } catch (error) {
            console.error("Failed to log activity:", error);
        } finally {
            setIsPostingActivity(false);
        }
    };

    return (
        <div className="animate-fade-in flex h-full gap-6 relative">
            {/* --- Main List View --- */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ${selectedLead ? "max-w-[calc(100%-400px)]" : "w-full"}`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary">Lead Directory</h1>
                        <p className="text-text-secondary text-sm mt-0.5">
                            Manage potential enrollments and track follow-up activities.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            ref={importInputRef}
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={handleImportCSV}
                        />
                        <button
                            onClick={() => importInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            <Upload className="w-4 h-4" />
                            Import
                        </button>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-dark text-white rounded-lg text-sm font-bold shadow-sm transition-all focus:ring-2 focus:ring-accent/20"
                        >
                            <Plus className="w-4 h-4" />
                            Add New Lead
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by parent, child, or email..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent shadow-sm"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 appearance-none pr-10"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23374151' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "right 14px center",
                        }}
                    >
                        <option value="ALL">All Status</option>
                        <option value="NEW">New</option>
                        <option value="CONTACTED">Contacted</option>
                        <option value="TOUR_SCHEDULED">Tour Scheduled</option>
                        <option value="TOUR_COMPLETED">Tour Completed</option>
                        <option value="APPLICATION_SENT">Application Sent</option>
                        <option value="WAITLIST">Waitlist</option>
                        <option value="ENROLLED">Enrolled</option>
                        <option value="LOST">Lost</option>
                    </select>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="px-6 py-4 w-12">
                                        <input type="checkbox" className="rounded text-accent focus:ring-accent/20 border-gray-300 w-4 h-4" />
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold tracking-wider text-gray-500 uppercase">Parent Name</th>
                                    <th className="px-6 py-4 text-xs font-bold tracking-wider text-gray-500 uppercase">Child Info</th>
                                    <th className="px-6 py-4 text-xs font-bold tracking-wider text-gray-500 uppercase">Lead Score</th>
                                    <th className="px-6 py-4 text-xs font-bold tracking-wider text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold tracking-wider text-gray-500 uppercase">Last Activity</th>
                                    <th className="px-6 py-4 text-xs font-bold tracking-wider text-gray-500 uppercase">Next Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan={7} className="p-8 text-center text-gray-500">Loading leads...</td></tr>
                                ) : (
                                    leads.map((lead) => (
                                        <tr
                                            key={lead.id}
                                            onClick={() => setSelectedLead(lead)}
                                            className={`hover:bg-gray-50/50 cursor-pointer transition-colors ${selectedLead?.id === lead.id ? "bg-accent/5" : ""}`}
                                        >
                                            <td className="px-6 py-5">
                                                <input type="checkbox" className="rounded text-accent focus:ring-accent/20 border-gray-300 w-4 h-4" onClick={(e) => e.stopPropagation()} />
                                            </td>
                                            <td className="px-6 py-5 relative">
                                                {selectedLead?.id === lead.id && (
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent"></div>
                                                )}
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${lead.leadScore >= 80 ? "bg-orange-100 text-orange-600" :
                                                        lead.leadScore >= 60 ? "bg-pink-100 text-pink-600" :
                                                            lead.leadScore >= 40 ? "bg-purple-100 text-purple-600" :
                                                                "bg-teal-100 text-teal-600"
                                                        }`}>
                                                        {lead.parentName.split(" ").map(n => n[0]).join("")}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{lead.parentName}</p>
                                                        <p className="text-xs text-gray-500">{lead.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="font-bold text-gray-900">{lead.childName}</p>
                                                <p className="text-xs text-gray-500">{lead.childAge} yrs • {lead.childProgram}</p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getScoreColor(lead.leadScore)}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full mr-2 ${lead.leadScore >= 80 ? 'bg-green-500' : lead.leadScore >= 50 ? 'bg-yellow-500' : 'bg-gray-400'}`}></span>
                                                    {lead.intentLevel ? `${lead.intentLevel.split(" ")[0]} (${lead.leadScore})` : `${lead.leadScore >= 80 ? 'High' : lead.leadScore >= 50 ? 'Medium' : 'Low'} (${lead.leadScore})`}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(lead.status)}`}>
                                                    {formatStatus(lead.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="text-sm font-medium text-gray-700">
                                                    {lead.lastActivity ? timeAgo(lead.lastActivity.date) : "N/A"}
                                                </p>
                                            </td>
                                            <td className="px-6 py-5">
                                                {(() => {
                                                    const action = getNextAction(lead);
                                                    return (
                                                        <div className="flex items-center gap-2">
                                                            {action.icon === 'calendar' && <Calendar className="w-4 h-4 text-orange-500" />}
                                                            {action.icon === 'phone' && <Phone className="w-4 h-4 text-gray-400" />}
                                                            {action.icon === 'send' && <Send className="w-4 h-4 text-gray-400" />}
                                                            {action.icon === 'clock' && <Clock className="w-4 h-4 text-gray-400" />}
                                                            {action.icon === 'paperclip' && <Paperclip className="w-4 h-4 text-gray-400" />}
                                                            <p className={`text-sm font-medium ${action.color}`}>{action.text}</p>
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-sm text-gray-500 font-medium">Showing 1–{leads.length} of {leads.length} leads</p>
                        <div className="flex items-center gap-1">
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"><ChevronLeft className="w-4 h-4" /></button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-accent bg-accent/5 text-accent font-bold text-sm">1</button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-transparent text-gray-600 hover:bg-gray-50 text-sm font-medium">2</button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-transparent text-gray-600 hover:bg-gray-50 text-sm font-medium">3</button>
                            <span className="w-8 h-8 flex items-center justify-center text-gray-500 text-sm">...</span>
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Side Panel --- */}
            {selectedLead && (
                <div className="w-[380px] bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col flex-shrink-0 animate-slide-in-right overflow-hidden sticky top-0 h-[calc(100vh-100px)]">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 relative">
                        <button
                            onClick={() => setSelectedLead(null)}
                            className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xl font-bold">
                                {selectedLead.parentName.split(" ").map(n => n[0]).join("")}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{selectedLead.parentName}</h2>
                                <p className="text-sm text-gray-500 font-medium">Child: {selectedLead.childName} ({selectedLead.childAge}y)</p>
                            </div>
                        </div>

                        {selectedLead.intentLevel && (
                            <span className={`inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border ${
                                selectedLead.intentLevel === 'Hot' ? 'bg-red-50 text-red-700 border-red-100' :
                                selectedLead.intentLevel === 'Warm' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                'bg-blue-50 text-blue-700 border-blue-100'
                            }`}>
                                {selectedLead.intentLevel} Intent
                            </span>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
                        <button
                            onClick={() => handleLogActivity("CALL", "Phone Call Outbound: Called parent to discuss enrollment.")}
                            disabled={isPostingActivity}
                            className="flex flex-col items-center justify-center p-4 hover:bg-gray-50 transition-colors group cursor-pointer disabled:opacity-50"
                        >
                            <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center mb-2 group-hover:bg-teal-100 transition-colors">
                                <Phone className="w-4 h-4 text-teal-600" />
                            </div>
                            <span className="text-xs font-bold text-teal-600">Log Call</span>
                        </button>
                        <button
                            onClick={() => handleLogActivity("TOUR", "School Tour Scheduled.", new Date(Date.now() + 86400000).toISOString())}
                            disabled={isPostingActivity}
                            className="flex flex-col items-center justify-center p-4 hover:bg-gray-50 transition-colors group cursor-pointer disabled:opacity-50"
                        >
                            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-2 group-hover:bg-emerald-100 transition-colors">
                                <Calendar className="w-4 h-4 text-emerald-600" />
                            </div>
                            <span className="text-xs font-bold text-emerald-600">Book Tour</span>
                        </button>
                        <button
                            onClick={() => handleLogActivity("EMAIL", "Sent informational packet and application forms.")}
                            disabled={isPostingActivity}
                            className="flex flex-col items-center justify-center p-4 hover:bg-gray-50 transition-colors group cursor-pointer disabled:opacity-50"
                        >
                            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mb-2 group-hover:bg-accent/20 transition-colors">
                                <Send className="w-4 h-4 text-accent" />
                            </div>
                            <span className="text-xs font-bold text-accent">Send Pack</span>
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-100">
                        {['Activity', 'Details', 'Notes'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab.toLowerCase())}
                                className={`flex-1 py-4 text-sm font-bold transition-colors border-b-2 ${activeTab === tab.toLowerCase()
                                    ? "border-accent text-accent"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6">
                        {activeTab === 'activity' && (
                            <div className="space-y-6">
                                {loadingActivities ? (
                                    <p className="text-center text-sm text-gray-500">Loading activities...</p>
                                ) : activities.length > 0 ? (
                                    <div className="relative border-l-2 border-gray-200 ml-3 space-y-8 pb-4">
                                        {activities.map((activity) => (
                                            <div key={activity.id} className="relative pl-6">
                                                {/* Timeline Dot */}
                                                <div className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full ring-4 ring-white ${activity.type === 'TOUR' ? 'bg-orange-500' :
                                                    activity.type === 'CALL' ? 'bg-gray-300' :
                                                        activity.type === 'EMAIL' ? 'bg-blue-500' :
                                                            'bg-green-500'
                                                    }`} />

                                                {/* Activity Content */}
                                                <div className="mb-1 flex justify-between items-start">
                                                    <h4 className="text-sm font-bold text-gray-900">
                                                        {activity.type === 'TOUR' ? 'UPCOMING' :
                                                            activity.type === 'CALL' ? 'Phone Call Outbound' :
                                                                activity.type === 'EMAIL' ? 'Email Sent' :
                                                                    activity.type === 'NOTE' ? 'Internal Note' : 'Lead Created'}
                                                    </h4>
                                                    <span className={`text-[11px] font-medium ${activity.type === 'TOUR' ? 'text-orange-600' : 'text-gray-500'}`}>
                                                        {activity.type === 'TOUR' && activity.scheduledFor ? new Date(activity.scheduledFor).toLocaleString() : new Date(activity.date).toLocaleDateString()}
                                                    </span>
                                                </div>

                                                <div className={`
                                                    ${activity.type === 'TOUR' ? 'bg-orange-50/50 border border-orange-100 rounded-xl p-4 mt-2' : ''}
                                                    ${activity.type === 'CALL' ? 'bg-white border border-gray-200 rounded-xl p-4 mt-2 shadow-sm' : ''}
                                                    ${activity.type === 'NOTE' ? 'bg-[#fcfca4]/20 border border-yellow-200 rounded-xl p-4 mt-2 shadow-sm' : ''}
                                                `}>
                                                    {activity.type === 'TOUR' && (
                                                        <>
                                                            <p className="font-bold text-gray-900 mb-1">School Tour</p>
                                                            <p className="text-xs text-gray-600 font-medium mb-3">{activity.text.replace('School Tour ', '')}</p>
                                                            <div className="flex gap-2">
                                                                <button className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 shadow-sm">Reschedule</button>
                                                                <button className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 shadow-sm">Cancel</button>
                                                            </div>
                                                        </>
                                                    )}

                                                    {activity.type === 'CALL' && (
                                                        <>
                                                            <p className="text-xs text-gray-600 leading-relaxed mb-3">
                                                                {activity.text.replace('Phone Call Outbound: ', '')}
                                                            </p>
                                                            <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium pt-3 border-t border-gray-100">
                                                                <span className="w-3 h-3 bg-gray-300 rounded-full flex items-center justify-center text-white text-[8px]">👤</span>
                                                                Logged by Admin
                                                            </div>
                                                        </>
                                                    )}

                                                    {activity.type === 'NOTE' && (
                                                        <>
                                                            <p className="text-xs text-gray-800 leading-relaxed font-medium">
                                                                {activity.text}
                                                            </p>
                                                        </>
                                                    )}

                                                    {activity.type === 'EMAIL' && (
                                                        <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-blue-50/50 border border-blue-100 rounded-lg max-w-fit">
                                                            <Paperclip className="w-3.5 h-3.5 text-blue-500" />
                                                            <span className="text-xs font-semibold text-blue-700">Message Pack Details.pdf</span>
                                                        </div>
                                                    )}

                                                    {activity.type === 'SYSTEM' && (
                                                        <p className="text-xs text-gray-500 font-medium mt-1">Source: Admin Internal Update</p>
                                                    )}
                                                </div>

                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-sm text-gray-500">No activities recorded yet.</p>
                                )}
                            </div>
                        )}

                        {activeTab === 'details' && (
                            <div className="space-y-4">
                                <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Contact Info</h4>
                                    <div className="space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">Email</span>
                                            <span className="text-sm font-semibold text-gray-900">{selectedLead.email || "—"}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">Phone</span>
                                            <span className="text-sm font-semibold text-gray-900">{selectedLead.phone || "—"}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Child Details</h4>
                                    <div className="space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">Name</span>
                                            <span className="text-sm font-semibold text-gray-900">{selectedLead.childName}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">Age</span>
                                            <span className="text-sm font-semibold text-gray-900">{selectedLead.childAge} yrs</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">Program</span>
                                            <span className="text-sm font-semibold text-gray-900">{selectedLead.childProgram}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Lead Info</h4>
                                    <div className="space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">Status</span>
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(selectedLead.status)}`}>{formatStatus(selectedLead.status)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">Score</span>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${getScoreColor(selectedLead.leadScore)}`}>{selectedLead.leadScore}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">Intent</span>
                                            <span className="text-sm font-semibold text-gray-900">{selectedLead.intentLevel || "—"}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">Created</span>
                                            <span className="text-sm font-semibold text-gray-900">{new Date(selectedLead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notes' && (
                            <div className="space-y-3">
                                {loadingActivities ? (
                                    <p className="text-center text-sm text-gray-500">Loading notes...</p>
                                ) : activities.filter(a => a.type === 'NOTE').length > 0 ? (
                                    activities.filter(a => a.type === 'NOTE').map(note => (
                                        <div key={note.id} className="bg-[#fcfca4]/30 border border-yellow-200 rounded-xl p-4">
                                            <p className="text-sm text-gray-800 leading-relaxed">{note.text}</p>
                                            <p className="text-xs text-gray-400 mt-2">{new Date(note.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-sm text-gray-400">No notes added yet.</p>
                                        <p className="text-xs text-gray-400 mt-1">Use the input below to add a note.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-gray-50/80 border-t border-gray-200">
                        <div className="relative">
                            <textarea
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                disabled={isPostingActivity}
                                placeholder="Add a note..."
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none min-h-[80px]"
                            />
                            <button
                                onClick={() => {
                                    if (noteText.trim()) handleLogActivity("NOTE", noteText);
                                }}
                                disabled={isPostingActivity || !noteText.trim()}
                                className="absolute right-3 bottom-3 p-2 bg-accent hover:bg-accent-dark text-white rounded-lg shadow-sm transition-colors disabled:opacity-50"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Lead Modal Premium Design */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-3xl overflow-hidden animate-slide-up flex flex-col max-h-[95vh]">
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-gray-100 flex items-start justify-between bg-white relative shrink-0">
                            <div>
                                <h2 className="text-[28px] leading-none font-black text-[#1e293b] mb-2 tracking-tight">Add New Lead</h2>
                                <p className="text-[13px] font-semibold text-[#0f766e]/70">Enter details for the prospective family for Aurralis Montessori.</p>
                            </div>
                            <div className="absolute right-8 top-8 text-[#0f766e]">
                                <UserPlus className="w-6 h-6" strokeWidth={2.5} />
                            </div>
                        </div>

                        {/* Scrollable Body */}
                        <div className="p-8 overflow-y-auto w-full no-scrollbar space-y-10">

                            {/* Section 1: Parent/Guardian Info */}
                            <section>
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100/80 flex items-center justify-center">
                                        <Users className="w-5 h-5 text-slate-800" strokeWidth={2.5} />
                                    </div>
                                    <h3 className="text-[19px] font-bold text-slate-900 tracking-tight">Parent/Guardian Info</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                                    <div>
                                        <label className="block text-[13px] font-bold text-slate-800 mb-1.5">Full Name</label>
                                        <input type="text" placeholder="e.g. Jane Doe" value={newLeadForm.parentName} onChange={e => setNewLeadForm({ ...newLeadForm, parentName: e.target.value })} className="w-full px-4 py-3 bg-[#f8fafc]/80 border border-slate-200/80 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-semibold text-slate-700 placeholder:text-teal-600/40" />
                                    </div>
                                    <div>
                                        <label className="block text-[13px] font-bold text-slate-800 mb-1.5">Phone Number</label>
                                        <input type="tel" placeholder="e.g. (555) 123-4567" value={newLeadForm.phone} onChange={e => setNewLeadForm({ ...newLeadForm, phone: e.target.value })} className="w-full px-4 py-3 bg-[#f8fafc]/80 border border-slate-200/80 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-semibold text-slate-700 placeholder:text-teal-600/40" />
                                    </div>
                                    <div>
                                        <label className="block text-[13px] font-bold text-slate-800 mb-1.5">Email Address</label>
                                        <input type="email" placeholder="e.g. jane@example.com" value={newLeadForm.email} onChange={e => setNewLeadForm({ ...newLeadForm, email: e.target.value })} className="w-full px-4 py-3 bg-[#f8fafc]/80 border border-slate-200/80 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-semibold text-slate-700 placeholder:text-teal-600/40" />
                                    </div>
                                    <div>
                                        <label className="block text-[13px] font-bold text-slate-800 mb-1.5">Preferred Contact Method</label>
                                        <select value={newLeadForm.contactMethod} onChange={e => setNewLeadForm({ ...newLeadForm, contactMethod: e.target.value })} className="w-full px-4 py-3 bg-[#f8fafc]/80 border border-slate-200/80 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-semibold text-slate-700 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%208l5%205%205-5%22%20stroke%3D%22%230f766e%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_12px_center] bg-no-repeat">
                                            <option value="" disabled>Select method</option>
                                            <option value="Email">Email</option>
                                            <option value="Phone">Phone</option>
                                            <option value="Text">Text Message</option>
                                        </select>
                                    </div>
                                </div>
                            </section>

                            <hr className="border-slate-100" />

                            {/* Section 2: Child Details */}
                            <section>
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-10 h-10 rounded-xl bg-[#eaf8f6] flex items-center justify-center">
                                        <Baby className="w-5 h-5 text-slate-900" strokeWidth={2.5} />
                                    </div>
                                    <h3 className="text-[19px] font-bold text-slate-900 tracking-tight">Child Details</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                                    <div className="col-span-1">
                                        <label className="block text-[13px] font-bold text-slate-800 mb-1.5">Child&apos;s Name</label>
                                        <input type="text" placeholder="e.g. Leo Doe" value={newLeadForm.childName} onChange={e => setNewLeadForm({ ...newLeadForm, childName: e.target.value })} className="w-full px-4 py-3 bg-[#f8fafc]/80 border border-slate-200/80 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-semibold text-slate-700 placeholder:text-teal-600/40" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 col-span-1">
                                        <div>
                                            <label className="block text-[13px] font-bold text-slate-800 mb-1.5">Date of Birth</label>
                                            <input type="date" value={newLeadForm.dob} onChange={e => setNewLeadForm({ ...newLeadForm, dob: e.target.value })} className="w-full px-4 py-3 bg-[#f8fafc]/80 border border-slate-200/80 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-semibold text-slate-700" />
                                        </div>
                                        <div>
                                            <label className="block text-[13px] font-bold text-slate-800 mb-1.5">Targeted Grade/Level</label>
                                            <select value={newLeadForm.childProgram} onChange={e => setNewLeadForm({ ...newLeadForm, childProgram: e.target.value })} className="w-full px-4 py-3 bg-[#f8fafc]/80 border border-slate-200/80 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-semibold text-slate-700 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%208l5%205%205-5%22%20stroke%3D%22%230f766e%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_12px_center] bg-no-repeat">
                                                <option value="" disabled>Select level</option>
                                                <option value="Infant (0-1.5 years)">Infant</option>
                                                <option value="Toddler (1.5-3 years)">Toddler</option>
                                                <option value="Preschool (3-4 years)">Preschool</option>
                                                <option value="Kindergarten (4-6 years)">Kindergarten</option>
                                                <option value="Primary (6-12 years)">Primary</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-[13px] font-bold text-slate-800 mb-1.5">Lead Source</label>
                                        <select value={newLeadForm.leadSource} onChange={e => setNewLeadForm({ ...newLeadForm, leadSource: e.target.value })} className="w-[48.5%] pr-4 px-4 py-3 bg-[#f8fafc]/80 border border-slate-200/80 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-semibold text-slate-700 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%208l5%205%205-5%22%20stroke%3D%22%230f766e%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_12px_center] bg-no-repeat">
                                            <option value="" disabled>Select source</option>
                                            <option value="Website">Website</option>
                                            <option value="Referral">Referral</option>
                                            <option value="Social Media">Social Media</option>
                                            <option value="Walk-in">Walk-in</option>
                                        </select>
                                    </div>

                                    <div className="col-span-2 mt-1">
                                        <label className="block text-[13px] font-bold text-slate-800 mb-1.5">Initial Inquiry Notes</label>
                                        <textarea placeholder="Enter any specific details or questions from the parent..." value={newLeadForm.notes} onChange={e => setNewLeadForm({ ...newLeadForm, notes: e.target.value })} className="w-full px-4 py-3 bg-[#f8fafc]/80 border border-slate-200/80 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-semibold text-slate-700 placeholder:text-teal-600/40 min-h-[96px] resize-none" />
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-5 bg-slate-50 border-t border-gray-100 flex items-center justify-between mt-auto shrink-0">
                            <div className="flex items-center gap-4">
                                <span className="text-[13px] font-bold text-slate-600">Initial Status:</span>
                                <div className="flex bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
                                    {['Cold', 'Warm', 'Hot'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => setNewLeadForm({ ...newLeadForm, intentLevel: status })}
                                            className={`px-4 py-1.5 text-[13px] font-bold rounded-md transition-all ${newLeadForm.intentLevel === status ? 'bg-[#cbf7f1] text-[#0f766e] shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 text-[14px] font-bold text-slate-700 hover:text-slate-900 transition-colors">Cancel</button>
                                <button onClick={handleCreateLead} className="px-6 py-2.5 bg-[#cbf7f1] hover:bg-[#a9ede4] text-[#0f766e] rounded-[10px] text-[15px] font-bold transition-all shadow-sm">Save Lead</button>
                                <button onClick={handleCreateAndBookTrial} className="px-6 py-2.5 bg-[#20e1d0] hover:bg-[#1bcbbc] text-slate-900 rounded-[10px] text-[15px] font-extrabold transition-all shadow-md shadow-accent/20 border border-transparent">Save & Book Trial</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

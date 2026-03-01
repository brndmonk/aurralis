"use client";

import { useState, useEffect, useRef } from "react";
import {
    Calendar,
    CreditCard,
    Wallet,
    Key,
    Pencil,
    Plus,
    MessageSquare,
    Link,
    Loader2,
    CheckCircle2,
    Trash2
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────

interface FeeItem {
    id: string;
    type: string;
    frequency: string;
    frequencyColor: string;
    amount: number;
}

interface SystemSettings {
    academicYear: string;
    currentTerm: string;
    startDate: string;
    endDate: string;
    stripeEnabled: boolean;
    razorpayEnabled: boolean;
    twilioEnabled: boolean;
    resendEnabled: boolean;
    webhooksEnabled: boolean;
}



// ─── Toggle Component ───────────────────────────────────────

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
    return (
        <button
            onClick={onChange}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${enabled ? "bg-accent" : "bg-gray-200"
                }`}
        >
            <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ${enabled ? "translate-x-6" : "translate-x-1"
                    }`}
            />
        </button>
    );
}

// ─── Select Component ───────────────────────────────────────

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (val: string) => void }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">{label}</label>
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-sm font-medium text-text-primary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all appearance-none"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 14px center",
                    }}
                >
                    {options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}

// ─── Page Component ─────────────────────────────────────────

export default function SettingsPage() {
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const originalSettings = useRef<SystemSettings | null>(null);
    const [feeStructure, setFeeStructure] = useState<FeeItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savedCount, setSavedCount] = useState(0);
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const [isAddingFee, setIsAddingFee] = useState(false);
    const [newFee, setNewFee] = useState({ type: '', frequency: 'Monthly', amount: '' });
    const [editingFee, setEditingFee] = useState<FeeItem | null>(null);
    const [editFeeData, setEditFeeData] = useState({ type: '', frequency: 'Monthly', amount: '' });

    const academicYearOptions = (() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 5 }, (_, i) => {
            const start = currentYear - 3 + i;
            return `${start} - ${start + 1}`;
        });
    })();

    useEffect(() => {
        async function fetchSettings() {
            try {
                const response = await fetch('/api/settings');
                const data = await response.json();
                if (data.settings) {
                    const s: SystemSettings = {
                        academicYear: data.settings.academicYear,
                        currentTerm: data.settings.currentTerm,
                        startDate: new Date(data.settings.startDate).toISOString().split('T')[0],
                        endDate: new Date(data.settings.endDate).toISOString().split('T')[0],
                        stripeEnabled: data.settings.stripeEnabled,
                        razorpayEnabled: data.settings.razorpayEnabled,
                        twilioEnabled: data.settings.twilioEnabled,
                        resendEnabled: data.settings.resendEnabled,
                        webhooksEnabled: data.settings.webhooksEnabled,
                    };
                    setSettings(s);
                    originalSettings.current = s;
                }
                if (data.feeTemplates) {
                    setFeeStructure(data.feeTemplates);
                }
            } catch (error) {
                console.error("Failed to load settings:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    academicYear: settings?.academicYear,
                    currentTerm: settings?.currentTerm,
                    startDate: settings ? new Date(settings.startDate) : undefined,
                    endDate: settings ? new Date(settings.endDate) : undefined,
                    stripeEnabled: settings?.stripeEnabled,
                    razorpayEnabled: settings?.razorpayEnabled,
                    twilioEnabled: settings?.twilioEnabled,
                    resendEnabled: settings?.resendEnabled,
                    webhooksEnabled: settings?.webhooksEnabled,
                }),
            });
            if (response.ok) {
                setSavedCount((prev) => prev + 1);
                originalSettings.current = settings ? { ...settings } : null;
                const now = new Date();
                setLastSaved(`${now.toDateString() === new Date().toDateString() ? 'Today' : now.toLocaleDateString()} at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
                setTimeout(() => setSavedCount(0), 3000);
            }
        } catch (error) {
            console.error("Save error:", error);
        } finally {
            setSaving(false);
        }
    };

    const deleteFeeTemplate = async (id: string) => {
        try {
            const response = await fetch(`/api/settings/fees?id=${id}`, { method: 'DELETE' });
            if (response.ok) {
                setFeeStructure((prev) => prev.filter(f => f.id !== id));
            }
        } catch (error) {
            console.error("Failed to delete fee template:", error);
        }
    };

    const handleEditFee = async () => {
        if (!editingFee || !editFeeData.type || !editFeeData.amount) return;
        try {
            const response = await fetch(`/api/settings/fees/${editingFee.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: editFeeData.type,
                    frequency: editFeeData.frequency,
                    amount: editFeeData.amount,
                }),
            });
            if (response.ok) {
                const updated = await response.json();
                setFeeStructure((prev) => prev.map((f) => f.id === updated.id ? updated : f));
                setEditingFee(null);
            }
        } catch (error) {
            console.error("Failed to update fee template:", error);
        }
    };

    const handleAddFee = async () => {
        if (!newFee.type || !newFee.amount) return;

        let frequencyColor = "text-text-secondary";
        if (newFee.frequency === "Monthly") frequencyColor = "text-accent";
        else if (newFee.frequency === "One-time") frequencyColor = "text-text-muted";

        try {
            const response = await fetch('/api/settings/fees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: newFee.type,
                    frequency: newFee.frequency,
                    frequencyColor,
                    amount: newFee.amount,
                }),
            });
            if (response.ok) {
                const createdFee = await response.json();
                setFeeStructure([...feeStructure, createdFee]);
                setIsAddingFee(false);
                setNewFee({ type: '', frequency: 'Monthly', amount: '' });
            }
        } catch (error) {
            console.error("Failed to add fee template:", error);
        }
    };

    if (loading || !settings) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* ─── Header ─── */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">System Configuration</h1>
                    <p className="text-text-secondary text-sm mt-0.5">
                        Manage academic schedules, fees, and integrations.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { if (originalSettings.current) setSettings({ ...originalSettings.current }); }}
                        className="px-5 py-2.5 rounded-xl border border-border text-text-secondary text-sm font-semibold hover:bg-surface-alt transition-all">
                        Discard
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-accent hover:bg-accent-dark text-white font-bold text-sm rounded-xl shadow-md shadow-accent/25 transition-all active:scale-[0.98] disabled:opacity-70"
                    >
                        {saving ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                        ) : savedCount > 0 ? (
                            <><CheckCircle2 className="w-4 h-4" /> Saved</>
                        ) : (
                            "Save Changes"
                        )}
                    </button>
                </div>
            </div>
            {/* Academic Year Settings */}
            <div className="card p-6 mb-6">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-accent" />
                        </div>
                        <h2 className="text-lg font-bold text-text-primary">Academic Year Settings</h2>
                    </div>
                    <span className="text-xs font-bold text-accent bg-accent/10 px-3 py-1 rounded-full">Active: {settings.academicYear}</span>
                </div>
                <p className="text-xs text-text-muted mb-6 ml-9">Define the operational calendar for the institution.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <SelectField
                        label="Current Academic Year"
                        value={settings.academicYear}
                        onChange={(v) => setSettings({ ...settings, academicYear: v })}
                        options={academicYearOptions}
                    />
                    <SelectField
                        label="Current Term"
                        value={settings.currentTerm}
                        onChange={(v) => setSettings({ ...settings, currentTerm: v })}
                        options={["Term 1 (Autumn)", "Term 2 (Spring)", "Term 3 (Summer)"]}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1.5">Start Date</label>
                        <input
                            type="date"
                            value={settings.startDate}
                            onChange={(e) => setSettings({ ...settings, startDate: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-sm font-medium text-text-primary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1.5">End Date</label>
                        <input
                            type="date"
                            value={settings.endDate}
                            onChange={(e) => setSettings({ ...settings, endDate: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-sm font-medium text-text-primary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Fee Structure */}
            <div className="card p-6 mb-6">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                            <CreditCard className="w-4 h-4 text-blue-500" />
                        </div>
                        <h2 className="text-lg font-bold text-text-primary">Fee Structure</h2>
                    </div>
                    <button
                        onClick={() => setIsAddingFee(true)}
                        className="text-sm font-bold text-accent hover:text-accent-dark transition-colors flex items-center gap-1"
                    >
                        <Plus className="w-4 h-4" />
                        Add New Fee Type
                    </button>
                </div>
                <p className="text-xs text-text-muted mb-5 ml-9">Configure tuition and additional fees by level.</p>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="px-4 py-3 text-left text-[10px] font-bold text-accent uppercase tracking-wider">Fee Type</th>
                                <th className="px-4 py-3 text-left text-[10px] font-bold text-accent uppercase tracking-wider">Frequency</th>
                                <th className="px-4 py-3 text-left text-[10px] font-bold text-accent uppercase tracking-wider">Amount (INR)</th>
                                <th className="px-4 py-3 text-right text-[10px] font-bold text-accent uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {feeStructure.map((fee) =>
                                editingFee?.id === fee.id ? (
                                    <tr key={fee.id} className="border-b border-border-light bg-surface-alt/30">
                                        <td className="px-4 py-3">
                                            <input
                                                type="text"
                                                value={editFeeData.type}
                                                onChange={(e) => setEditFeeData({ ...editFeeData, type: e.target.value })}
                                                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:border-accent"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={editFeeData.frequency}
                                                onChange={(e) => setEditFeeData({ ...editFeeData, frequency: e.target.value })}
                                                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:border-accent appearance-none"
                                            >
                                                <option>Monthly</option>
                                                <option>Per Term</option>
                                                <option>Annually</option>
                                                <option>One-time</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="relative">
                                                <span className="absolute left-3 top-2 text-text-muted text-sm">₹</span>
                                                <input
                                                    type="number"
                                                    value={editFeeData.amount}
                                                    onChange={(e) => setEditFeeData({ ...editFeeData, amount: e.target.value })}
                                                    className="w-full pl-7 pr-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:border-accent"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setEditingFee(null)}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-text-muted hover:bg-surface-alt transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleEditFee}
                                                    className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-bold hover:bg-accent-dark transition-colors"
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    <tr key={fee.id} className="border-b border-border-light hover:bg-surface-alt/50 transition-colors">
                                        <td className="px-4 py-4 text-sm font-semibold text-text-primary">{fee.type}</td>
                                        <td className={`px-4 py-4 text-sm font-medium ${fee.frequencyColor}`}>{fee.frequency}</td>
                                        <td className="px-4 py-4 text-sm font-mono font-semibold text-text-primary">
                                            ₹{fee.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => { setEditingFee(fee); setEditFeeData({ type: fee.type, frequency: fee.frequency, amount: String(fee.amount) }); }}
                                                    className="p-2 rounded-lg hover:bg-surface-alt text-text-muted hover:text-accent transition-colors"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => deleteFeeTemplate(fee.id)}
                                                    className="p-2 rounded-lg hover:bg-red-50 text-text-muted hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            )}
                            {isAddingFee && (
                                <tr className="border-b border-border-light bg-surface-alt/30">
                                    <td className="px-4 py-3">
                                        <input
                                            type="text"
                                            placeholder="Fee Name"
                                            value={newFee.type}
                                            onChange={(e) => setNewFee({ ...newFee, type: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:border-accent"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <select
                                            value={newFee.frequency}
                                            onChange={(e) => setNewFee({ ...newFee, frequency: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:border-accent appearance-none"
                                        >
                                            <option>Monthly</option>
                                            <option>Per Term</option>
                                            <option>Annually</option>
                                            <option>One-time</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="relative">
                                            <span className="absolute left-3 top-2 text-text-muted text-sm">₹</span>
                                            <input
                                                type="number"
                                                placeholder="Amount"
                                                value={newFee.amount}
                                                onChange={(e) => setNewFee({ ...newFee, amount: e.target.value })}
                                                className="w-full pl-7 pr-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:border-accent"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setIsAddingFee(false)}
                                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-text-muted hover:bg-surface-alt transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleAddFee}
                                                className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-bold hover:bg-accent-dark transition-colors"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Gateway + API & Communication */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Payment Gateway */}
                <div className="card p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                            <Wallet className="w-4 h-4 text-emerald-600" />
                        </div>
                        <h2 className="text-lg font-bold text-text-primary">Payment Gateway</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-alt/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                                    <span className="text-indigo-600 font-extrabold text-sm">S</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-text-primary">Stripe Integration</p>
                                    <p className="text-xs text-text-muted">Accept credit cards securely</p>
                                </div>
                            </div>
                            <Toggle enabled={settings.stripeEnabled} onChange={() => setSettings({ ...settings, stripeEnabled: !settings.stripeEnabled })} />
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-alt/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                    <span className="text-blue-600 font-extrabold text-sm">R</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-text-primary">Razorpay</p>
                                    <p className="text-xs text-text-muted">UPI & card payments (India)</p>
                                </div>
                            </div>
                            <Toggle enabled={settings.razorpayEnabled} onChange={() => setSettings({ ...settings, razorpayEnabled: !settings.razorpayEnabled })} />
                        </div>
                    </div>
                </div>

                {/* API & Communication */}
                <div className="card p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
                            <Link className="w-4 h-4 text-violet-600" />
                        </div>
                        <h2 className="text-lg font-bold text-text-primary">API & Communication</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-alt/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                                    <MessageSquare className="w-4 h-4 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-text-primary">Twilio SMS</p>
                                    <p className="text-xs text-text-muted">Notifications & Alerts</p>
                                </div>
                            </div>
                            <Toggle enabled={settings.twilioEnabled} onChange={() => setSettings({ ...settings, twilioEnabled: !settings.twilioEnabled })} />
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-alt/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                                    <span className="text-emerald-600 font-extrabold text-sm">R</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-text-primary">Resend Email</p>
                                    <p className="text-xs text-text-muted">Transactional emails</p>
                                </div>
                            </div>
                            <Toggle enabled={settings.resendEnabled} onChange={() => setSettings({ ...settings, resendEnabled: !settings.resendEnabled })} />
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-alt/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                                    <Key className="w-4 h-4 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-text-primary">Webhooks</p>
                                    <p className="text-xs text-text-muted">External system callbacks</p>
                                </div>
                            </div>
                            <Toggle enabled={settings.webhooksEnabled} onChange={() => setSettings({ ...settings, webhooksEnabled: !settings.webhooksEnabled })} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Footer Info ─── */}
            <div className="mt-6 text-center">
                <p className="text-xs text-text-muted">
                    {lastSaved ? `Last saved: ${lastSaved}` : "Changes will appear here once saved."}
                </p>
            </div>
        </div>
    );
}

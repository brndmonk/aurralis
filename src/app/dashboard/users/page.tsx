"use client";

import { useState, useCallback, useEffect, useRef } from "react";

import { Loader2, CheckCircle2, XCircle, Save } from "lucide-react";
import {
    Shield,
    GraduationCap,
    Calculator,
    Users,
    ChevronRight,
    Plus,
    UserPlus,
    BookOpen,
    ClipboardCheck,
    MessageSquare,
    LayoutGrid,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────

interface Permission {
    key: string;
    label: string;
    enabled: boolean;
}

interface PermissionCategory {
    name: string;
    description: string;
    icon: React.ElementType;
    color: string;
    permissions: Permission[];
}

interface RoleData {
    name: string;
    subtitle: string;
    icon: React.ElementType;
    color: string;
    permissionCategories: PermissionCategory[];
}

// ─── Data ───────────────────────────────────────────────────

const initialRoles: RoleData[] = [
    {
        name: "Administrator",
        subtitle: "Full Access",
        icon: Shield,
        color: "#22c55e",
        permissionCategories: [
            {
                name: "Student Data",
                description: "Access to student profiles and academic records.",
                icon: BookOpen,
                color: "#3b82f6",
                permissions: [
                    { key: "view_profiles", label: "View Profiles", enabled: true },
                    { key: "edit_details", label: "Edit Details", enabled: true },
                    { key: "upload_documents", label: "Upload Documents", enabled: true },
                ],
            },
            {
                name: "Attendance",
                description: "Daily check-in and absence management.",
                icon: ClipboardCheck,
                color: "#22c55e",
                permissions: [
                    { key: "mark_attendance", label: "Mark Attendance", enabled: true },
                    { key: "view_reports", label: "View Reports", enabled: true },
                ],
            },
            {
                name: "Content & Comms",
                description: "Manage announcements and gallery.",
                icon: MessageSquare,
                color: "#f59e0b",
                permissions: [
                    { key: "post_announcements", label: "Post Announcements", enabled: true },
                    { key: "upload_photos", label: "Upload Photos", enabled: true },
                ],
            },
            {
                name: "Class Management",
                description: "Classroom organization and student allocation.",
                icon: LayoutGrid,
                color: "#ef4444",
                permissions: [
                    { key: "assign_students", label: "Assign Students", enabled: true },
                ],
            },
        ],
    },
    {
        name: "Teacher",
        subtitle: "Editing...",
        icon: GraduationCap,
        color: "#22c55e",
        permissionCategories: [
            {
                name: "Student Data",
                description: "Access to student profiles and academic records.",
                icon: BookOpen,
                color: "#3b82f6",
                permissions: [
                    { key: "view_profiles", label: "View Profiles", enabled: true },
                    { key: "edit_details", label: "Edit Details", enabled: true },
                    { key: "upload_documents", label: "Upload Documents", enabled: false },
                ],
            },
            {
                name: "Attendance",
                description: "Daily check-in and absence management.",
                icon: ClipboardCheck,
                color: "#22c55e",
                permissions: [
                    { key: "mark_attendance", label: "Mark Attendance", enabled: true },
                    { key: "view_reports", label: "View Reports", enabled: true },
                ],
            },
            {
                name: "Content & Comms",
                description: "Manage announcements and gallery.",
                icon: MessageSquare,
                color: "#f59e0b",
                permissions: [
                    { key: "post_announcements", label: "Post Announcements", enabled: true },
                    { key: "upload_photos", label: "Upload Photos", enabled: true },
                ],
            },
            {
                name: "Class Management",
                description: "Classroom organization and student allocation.",
                icon: LayoutGrid,
                color: "#ef4444",
                permissions: [
                    { key: "assign_students", label: "Assign Students", enabled: false },
                ],
            },
        ],
    },
    {
        name: "Accountant",
        subtitle: "Financials",
        icon: Calculator,
        color: "#3b82f6",
        permissionCategories: [
            {
                name: "Student Data",
                description: "Access to student profiles and academic records.",
                icon: BookOpen,
                color: "#3b82f6",
                permissions: [
                    { key: "view_profiles", label: "View Profiles", enabled: true },
                    { key: "edit_details", label: "Edit Details", enabled: false },
                    { key: "upload_documents", label: "Upload Documents", enabled: false },
                ],
            },
            {
                name: "Attendance",
                description: "Daily check-in and absence management.",
                icon: ClipboardCheck,
                color: "#22c55e",
                permissions: [
                    { key: "mark_attendance", label: "Mark Attendance", enabled: false },
                    { key: "view_reports", label: "View Reports", enabled: true },
                ],
            },
            {
                name: "Content & Comms",
                description: "Manage announcements and gallery.",
                icon: MessageSquare,
                color: "#f59e0b",
                permissions: [
                    { key: "post_announcements", label: "Post Announcements", enabled: false },
                    { key: "upload_photos", label: "Upload Photos", enabled: false },
                ],
            },
            {
                name: "Class Management",
                description: "Classroom organization and student allocation.",
                icon: LayoutGrid,
                color: "#ef4444",
                permissions: [
                    { key: "assign_students", label: "Assign Students", enabled: false },
                ],
            },
        ],
    },
    {
        name: "Parent",
        subtitle: "View Only",
        icon: Users,
        color: "#8b5cf6",
        permissionCategories: [
            {
                name: "Student Data",
                description: "Access to student profiles and academic records.",
                icon: BookOpen,
                color: "#3b82f6",
                permissions: [
                    { key: "view_profiles", label: "View Profiles", enabled: true },
                    { key: "edit_details", label: "Edit Details", enabled: false },
                    { key: "upload_documents", label: "Upload Documents", enabled: false },
                ],
            },
            {
                name: "Attendance",
                description: "Daily check-in and absence management.",
                icon: ClipboardCheck,
                color: "#22c55e",
                permissions: [
                    { key: "mark_attendance", label: "Mark Attendance", enabled: false },
                    { key: "view_reports", label: "View Reports", enabled: true },
                ],
            },
            {
                name: "Content & Comms",
                description: "Manage announcements and gallery.",
                icon: MessageSquare,
                color: "#f59e0b",
                permissions: [
                    { key: "post_announcements", label: "Post Announcements", enabled: false },
                    { key: "upload_photos", label: "Upload Photos", enabled: false },
                ],
            },
            {
                name: "Class Management",
                description: "Classroom organization and student allocation.",
                icon: LayoutGrid,
                color: "#ef4444",
                permissions: [
                    { key: "assign_students", label: "Assign Students", enabled: false },
                ],
            },
        ],
    },
];

// ─── Toggle Switch Component ────────────────────────────────

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
    return (
        <button
            onClick={onChange}
            className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-accent/30 focus:ring-offset-1
        ${enabled ? "bg-accent" : "bg-gray-200"}
      `}
        >
            <span
                className={`
          inline-block h-4 w-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out
          ${enabled ? "translate-x-6" : "translate-x-1"}
        `}
            />
        </button>
    );
}

// ─── Page Component ─────────────────────────────────────────

interface ApiClass {
    id: string;
    name: string;
    section: string | null;
}

export default function UserRolesPage() {
    const [roles, setRoles] = useState(initialRoles);
    const originalRoles = useRef(initialRoles);
    const [selectedRoleIndex, setSelectedRoleIndex] = useState(1); // Teacher selected by default
    const [teacherName, setTeacherName] = useState("");
    const [teacherEmail, setTeacherEmail] = useState("");
    const [teacherClass, setTeacherClass] = useState("");
    const [sendingInvite, setSendingInvite] = useState(false);
    const [inviteStatus, setInviteStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [classes, setClasses] = useState<ApiClass[]>([]);

    const [isLoadingRoles, setIsLoadingRoles] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

    useEffect(() => {
        // Fetch classes from DB
        fetch("/api/classes")
            .then(r => r.json())
            .then(data => { if (Array.isArray(data)) setClasses(data); })
            .catch(() => {});

        // Fetch roles from DB
        const fetchRoles = async () => {
            try {
                const res = await fetch("/api/roles");
                if (res.ok) {
                    const dbRoles = await res.json();
                    if (dbRoles && dbRoles.length > 0) {
                        setRoles((prev) => {
                            const updated = prev.map((role) => {
                                const matchingConfig = dbRoles.find((r: { roleName: string; permissions?: unknown[] }) => r.roleName === role.name);
                                if (matchingConfig && matchingConfig.permissions) {
                                    const updatedCategories = role.permissionCategories.map((cat, catIndex) => {
                                        const dbCat = matchingConfig.permissions[catIndex];
                                        if (!dbCat || !dbCat.permissions) return cat;
                                        const updatedPermissions = cat.permissions.map((perm, permIndex) => {
                                            const dbPerm = dbCat.permissions[permIndex];
                                            return dbPerm ? { ...perm, enabled: dbPerm.enabled } : perm;
                                        });
                                        return { ...cat, permissions: updatedPermissions };
                                    });
                                    return { ...role, permissionCategories: updatedCategories };
                                }
                                return role;
                            });
                            // Store original merged state for Discard
                            originalRoles.current = JSON.parse(JSON.stringify(updated));
                            return updated;
                        });
                    }
                }
            } catch (error) {
                console.error("Error fetching roles configuration:", error);
            } finally {
                setIsLoadingRoles(false);
            }
        };
        fetchRoles();
    }, []);

    const handleSendInvitation = useCallback(async () => {
        if (!teacherName.trim() || !teacherEmail.trim()) {
            setInviteStatus({ type: "error", message: "Please fill in name and email." });
            setTimeout(() => setInviteStatus(null), 3000);
            return;
        }

        setSendingInvite(true);
        setInviteStatus(null);

        const selectedClass = classes.find(c => c.id === teacherClass);
        const className = selectedClass
            ? `${selectedClass.name}${selectedClass.section ? ` ${selectedClass.section}` : ""}`
            : "";

        try {
            const res = await fetch("/api/invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: teacherName,
                    email: teacherEmail,
                    className,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to send invitation");
            }

            setInviteStatus({ type: "success", message: `Invitation sent to ${teacherEmail}!` });
            setTeacherName("");
            setTeacherEmail("");
            setTeacherClass("");
            setTimeout(() => setInviteStatus(null), 4000);
        } catch (err) {
            setInviteStatus({ type: "error", message: err instanceof Error ? err.message : "Failed to send" });
            setTimeout(() => setInviteStatus(null), 4000);
        } finally {
            setSendingInvite(false);
        }
    }, [teacherName, teacherEmail, teacherClass, classes]);

    const selectedRole = roles[selectedRoleIndex];

    const togglePermission = (catIndex: number, permIndex: number) => {
        setRoles((prev) => {
            const updated = [...prev];
            const role = { ...updated[selectedRoleIndex] };
            const categories = [...role.permissionCategories];
            const category = { ...categories[catIndex] };
            const permissions = [...category.permissions];
            permissions[permIndex] = {
                ...permissions[permIndex],
                enabled: !permissions[permIndex].enabled,
            };
            category.permissions = permissions;
            categories[catIndex] = category;
            role.permissionCategories = categories;
            updated[selectedRoleIndex] = role;
            return updated;
        });
    };

    const handleSaveRole = async () => {
        setIsSaving(true);
        setSaveStatus(null);
        try {
            const res = await fetch("/api/roles", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roleName: selectedRole.name,
                    permissionCategories: selectedRole.permissionCategories,
                }),
            });

            if (!res.ok) throw new Error("Failed to save changes.");

            setSaveStatus({ type: "success", message: "Permissions saved!" });
            setTimeout(() => setSaveStatus(null), 3000);
        } catch {
            setSaveStatus({ type: "error", message: "Error saving permissions." });
            setTimeout(() => setSaveStatus(null), 3000);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="animate-fade-in">
            {/* Custom header without the + New Enrollment button */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">User Roles & Permissions</h1>
                    <p className="text-text-secondary text-sm mt-0.5">
                        Manage staff access and define role capabilities.
                    </p>
                </div>
                <button className="relative p-2.5 rounded-xl bg-surface border border-border hover:border-accent/30 hover:shadow-md transition-all duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-danger rounded-full ring-2 ring-surface" />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* ─── Left Column: Roles List + Add Teacher ─── */}
                <div className="lg:col-span-4 xl:col-span-3 space-y-6">
                    {/* Roles List */}
                    <div className="card p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-text-primary">Roles</h3>
                            <span className="text-xs font-semibold text-accent bg-accent/10 px-2.5 py-1 rounded-full">
                                {roles.length} Active
                            </span>
                        </div>

                        <div className="space-y-1">
                            {roles.map((role, index) => {
                                const Icon = role.icon;
                                const isSelected = index === selectedRoleIndex;
                                return (
                                    <button
                                        key={role.name}
                                        onClick={() => setSelectedRoleIndex(index)}
                                        className={`
                      w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200
                      ${isSelected
                                                ? "bg-accent/8 border border-accent/20 shadow-sm"
                                                : "hover:bg-surface-alt border border-transparent"
                                            }
                    `}
                                    >
                                        <div
                                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                            style={{ backgroundColor: `${role.color}15` }}
                                        >
                                            <Icon className="w-4 h-4" style={{ color: role.color }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-semibold ${isSelected ? "text-accent" : "text-text-primary"}`}>
                                                {role.name}
                                            </p>
                                            <p className={`text-[11px] ${isSelected ? "text-accent/70" : "text-text-muted"}`}>
                                                {role.subtitle}
                                            </p>
                                        </div>
                                        {isSelected && (
                                            <ChevronRight className="w-4 h-4 text-accent flex-shrink-0" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Create New Role */}
                        <button className="w-full flex items-center gap-2 justify-center mt-4 px-4 py-2.5 rounded-xl border border-dashed border-border text-text-muted text-sm font-medium hover:border-accent/40 hover:text-accent hover:bg-accent/5 transition-all duration-200">
                            <Plus className="w-4 h-4" />
                            Create New Role
                        </button>
                    </div>

                    {/* Add New Teacher */}
                    <div className="card p-5">
                        <div className="flex items-center gap-2 mb-5">
                            <UserPlus className="w-5 h-5 text-accent" />
                            <h3 className="font-bold text-text-primary">Add New Teacher</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Full Name</label>
                                <input
                                    type="text"
                                    value={teacherName}
                                    onChange={(e) => setTeacherName(e.target.value)}
                                    placeholder="e.g. Jane Doe"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-text-muted"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Email Address</label>
                                <input
                                    type="email"
                                    value={teacherEmail}
                                    onChange={(e) => setTeacherEmail(e.target.value)}
                                    placeholder="jane@aurralis.edu"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-text-muted"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Assign Class</label>
                                <select
                                    value={teacherClass}
                                    onChange={(e) => setTeacherClass(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all text-text-muted appearance-none"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                                        backgroundRepeat: "no-repeat",
                                        backgroundPosition: "right 12px center",
                                    }}
                                >
                                    <option value="">Select a class...</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}{c.section ? ` ${c.section}` : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={handleSendInvitation}
                                disabled={sendingInvite}
                                className="w-full py-2.5 bg-sidebar hover:bg-sidebar-hover text-white font-semibold text-sm rounded-xl shadow-md transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {sendingInvite ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                                ) : (
                                    "Send Invitation"
                                )}
                            </button>

                            {/* Status Toast */}
                            {inviteStatus && (
                                <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium animate-fade-in ${inviteStatus.type === "success"
                                    ? "bg-accent/10 text-accent border border-accent/20"
                                    : "bg-danger/10 text-danger border border-danger/20"
                                    }`}>
                                    {inviteStatus.type === "success" ? (
                                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                    ) : (
                                        <XCircle className="w-4 h-4 flex-shrink-0" />
                                    )}
                                    <span className="text-xs">{inviteStatus.message}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ─── Right Column: Permissions Panel ─── */}
                <div className="lg:col-span-8 xl:col-span-9">
                    <div className="card p-6">
                        {/* Permission Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-11 h-11 rounded-2xl flex items-center justify-center"
                                    style={{ backgroundColor: `${selectedRole.color}15` }}
                                >
                                    <selectedRole.icon className="w-5 h-5" style={{ color: selectedRole.color }} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-text-primary">
                                        {selectedRole.name} Permissions
                                    </h2>
                                    <p className="text-text-muted text-sm">
                                        Configure access levels for {selectedRole.name.toLowerCase()} staff.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {saveStatus && (
                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold animate-fade-in ${saveStatus.type === "success" ? "text-accent bg-accent/10" : "text-danger bg-danger/10"}`}>
                                        {saveStatus.type === "success" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                        {saveStatus.message}
                                    </div>
                                )}
                                <button
                                    onClick={() => setRoles(JSON.parse(JSON.stringify(originalRoles.current)))}
                                    className="px-4 py-2 rounded-xl border border-border text-text-secondary text-sm font-medium hover:bg-surface-alt transition-colors"
                                >
                                    Discard
                                </button>
                                <button
                                    onClick={handleSaveRole}
                                    disabled={isSaving || isLoadingRoles}
                                    className="flex items-center gap-2 px-5 py-2 bg-accent hover:bg-accent-dark text-white font-semibold text-sm rounded-xl shadow-md shadow-accent/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Changes
                                </button>
                            </div>
                        </div>

                        {/* Permission Categories */}
                        <div className="space-y-8">
                            {selectedRole.permissionCategories.map((category, catIndex) => {
                                const CatIcon = category.icon;
                                return (
                                    <div key={category.name} className="animate-fade-in" style={{ animationDelay: `${catIndex * 0.05}s` }}>
                                        {/* Category Header */}
                                        <div className="flex items-center gap-3 mb-4">
                                            <div
                                                className="w-9 h-9 rounded-xl flex items-center justify-center"
                                                style={{ backgroundColor: `${category.color}12` }}
                                            >
                                                <CatIcon className="w-4 h-4" style={{ color: category.color }} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-text-primary">{category.name}</h3>
                                                <p className="text-xs text-text-muted">{category.description}</p>
                                            </div>
                                        </div>

                                        {/* Permission Toggles */}
                                        <div className="flex flex-wrap gap-3 ml-12">
                                            {category.permissions.map((perm, permIndex) => (
                                                <div
                                                    key={perm.key}
                                                    className={`
                            flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200
                            ${perm.enabled
                                                            ? "border-accent/20 bg-accent/[0.03]"
                                                            : "border-border bg-surface"
                                                        }
                          `}
                                                >
                                                    <span className="text-sm font-medium text-text-primary whitespace-nowrap">
                                                        {perm.label}
                                                    </span>
                                                    <Toggle
                                                        enabled={perm.enabled}
                                                        onChange={() => togglePermission(catIndex, permIndex)}
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        {/* Separator */}
                                        {catIndex < selectedRole.permissionCategories.length - 1 && (
                                            <div className="border-t border-border-light mt-6" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

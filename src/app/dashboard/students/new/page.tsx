"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ChevronLeft,
    Camera,
    Upload,
    Baby,
    Users,
    Phone,
    Mail,
    Calendar,
    ChevronDown,
    CheckCircle2,
    Loader2
} from "lucide-react";

interface ApiClass {
    id: string;
    name: string;
    section: string | null;
}

export default function NewEnrollmentPage() {
    const router = useRouter();
    const [classes, setClasses] = useState<ApiClass[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [form, setForm] = useState({
        name: "",
        dateOfBirth: "",
        classId: "",
        gender: "Male",
        parentName: "",
        parentPhone: "",
        parentEmail: ""
    });

    useEffect(() => {
        fetch("/api/classes")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setClasses(data);
            })
            .catch(err => console.error("Failed to fetch classes:", err));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const enrollmentId = `ENR-${Math.floor(1000 + Math.random() * 9000)}`;
            const res = await fetch("/api/students", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    enrollmentId,
                    gender: form.gender.toUpperCase()
                })
            });

            if (res.ok) {
                router.push("/dashboard/students");
            } else {
                console.error("Failed to submit");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-[850px] mx-auto py-8 px-4 sm:px-6 lg:px-8 font-sans">
            {/* Nav & Header */}
            <div className="mb-8">
                <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-[14px] font-bold text-[#0f766e] hover:text-[#0b5c56] transition-colors mb-4">
                    <ChevronLeft className="w-4 h-4" strokeWidth={3} />
                    Back to Dashboard
                </Link>
                <h1 className="text-[34px] font-black tracking-tight text-[#0f172a] mb-2 leading-none">New Student Enrollment</h1>
                <p className="text-[14px] font-semibold text-[#0f766e]/80 max-w-2xl">Quickly register a new student during site visits. All fields are automatically synced to the cloud.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* 1. Student Photo */}
                <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100/60 flex items-center justify-between">
                    <div>
                        <h2 className="text-[17px] font-bold text-slate-900 mb-1.5 flex items-center gap-2">Student Photo</h2>
                        <p className="text-[13px] font-semibold text-[#0f766e]/70 max-w-md">Capture a quick photo for the profile. This helps teachers identify new students immediately.</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="w-[100px] h-[100px] rounded-full border-[3px] border-dashed border-slate-200 bg-slate-50 flex items-center justify-center relative flex-shrink-0">
                            <Camera className="w-8 h-8 text-slate-400" strokeWidth={2.5} />
                            <div className="absolute bottom-1 right-1 w-[32px] h-[32px] bg-[#20e1d0] rounded-full flex items-center justify-center shadow-sm">
                                <Camera className="w-[16px] h-[16px] text-slate-900" strokeWidth={3} />
                            </div>
                        </div>
                        <button type="button" className="flex items-center gap-2 px-5 py-2.5 bg-slate-50/80 hover:bg-slate-100 text-slate-700 rounded-xl text-[13px] font-bold transition-colors border border-slate-200/50 shadow-sm">
                            <Upload className="w-4 h-4" strokeWidth={2.5} />
                            Upload or Capture
                        </button>
                    </div>
                </div>

                {/* 2. Student Information */}
                <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100/60">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-[42px] h-[42px] rounded-full bg-[#eaf8f6] flex items-center justify-center border border-[#cbf7f1]/50 shadow-sm shadow-[#20e1d0]/5">
                            <Baby className="w-5 h-5 text-[#20e1d0]" strokeWidth={2.5} />
                        </div>
                        <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">Student Information</h2>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-[13px] font-bold text-slate-800 mb-2">Student Full Name</label>
                            <input
                                type="text"
                                required
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g. Leo Anderson"
                                className="w-full px-4 py-3.5 bg-[#f8fafc]/80 border border-slate-200/80 rounded-[14px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#20e1d0]/40 focus:border-[#20e1d0] transition-all font-semibold text-slate-700 placeholder:text-slate-400"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div>
                                <label className="block text-[13px] font-bold text-slate-800 mb-2">Date of Birth</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        required
                                        value={form.dateOfBirth}
                                        onChange={e => setForm({ ...form, dateOfBirth: e.target.value })}
                                        className="w-full pl-4 pr-10 py-3.5 bg-[#f8fafc]/80 border border-slate-200/80 rounded-[14px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#20e1d0]/40 focus:border-[#20e1d0] transition-all font-semibold text-slate-700 appearance-none inline-block align-middle"
                                    />
                                    <Calendar className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={2.5} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[13px] font-bold text-slate-800 mb-2">Targeted Class</label>
                                <div className="relative">
                                    <select
                                        required
                                        value={form.classId}
                                        onChange={e => setForm({ ...form, classId: e.target.value })}
                                        className="w-full pl-4 pr-10 py-3.5 bg-[#f8fafc]/80 border border-slate-200/80 rounded-[14px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#20e1d0]/40 focus:border-[#20e1d0] transition-all font-semibold text-slate-700 appearance-none"
                                    >
                                        <option value="" disabled>Select a class</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}{c.section ? ` ${c.section}` : ''}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={2.5} />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[13px] font-bold text-slate-800 mb-2 mt-2">Gender</label>
                            <div className="flex bg-[#f8fafc]/80 border border-slate-200/80 rounded-[14px] p-1.5 shadow-sm">
                                {['Male', 'Female', 'Other'].map(gender => (
                                    <button
                                        key={gender}
                                        type="button"
                                        onClick={() => setForm({ ...form, gender })}
                                        className={`flex-1 py-2.5 text-[14px] font-bold rounded-lg transition-all ${form.gender === gender ? 'bg-white shadow-sm text-slate-900 border border-slate-200/40' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}
                                    >
                                        {gender}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Parent Contact Info */}
                <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100/60">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-[42px] h-[42px] rounded-full bg-[#eaf8f6] flex items-center justify-center border border-[#cbf7f1]/50 shadow-sm shadow-[#20e1d0]/5">
                            <Users className="w-5 h-5 text-[#20e1d0]" strokeWidth={2.5} />
                        </div>
                        <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">Parent Contact Info</h2>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-[13px] font-bold text-slate-800 mb-2">Parent/Guardian Name</label>
                            <input
                                type="text"
                                required
                                value={form.parentName}
                                onChange={e => setForm({ ...form, parentName: e.target.value })}
                                placeholder="e.g. Sarah Anderson"
                                className="w-full px-4 py-3.5 bg-[#f8fafc]/80 border border-slate-200/80 rounded-[14px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#20e1d0]/40 focus:border-[#20e1d0] transition-all font-semibold text-slate-700 placeholder:text-slate-400"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div>
                                <label className="block text-[13px] font-bold text-slate-800 mb-2">Phone Number</label>
                                <div className="relative">
                                    <Phone className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" strokeWidth={2.5} />
                                    <input
                                        type="tel"
                                        required
                                        value={form.parentPhone}
                                        onChange={e => setForm({ ...form, parentPhone: e.target.value })}
                                        placeholder="(555) 123-4567"
                                        className="w-full pl-11 pr-4 py-3.5 bg-[#f8fafc]/80 border border-slate-200/80 rounded-[14px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#20e1d0]/40 focus:border-[#20e1d0] transition-all font-semibold text-slate-700 placeholder:text-slate-400"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[13px] font-bold text-slate-800 mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" strokeWidth={2.5} />
                                    <input
                                        type="email"
                                        value={form.parentEmail}
                                        onChange={e => setForm({ ...form, parentEmail: e.target.value })}
                                        placeholder="parent@example.com"
                                        className="w-full pl-11 pr-4 py-3.5 bg-[#f8fafc]/80 border border-slate-200/80 rounded-[14px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#20e1d0]/40 focus:border-[#20e1d0] transition-all font-semibold text-slate-700 placeholder:text-slate-400"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-2 pb-12">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-[#20e1d0] hover:bg-[#1bcbbc] text-slate-900 rounded-[14px] text-[16px] font-black tracking-wide transition-all shadow-md shadow-[#20e1d0]/20 flex items-center justify-center gap-2 disabled:opacity-70 border border-transparent"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" strokeWidth={2.5} />}
                        Submit Enrollment
                    </button>
                </div>
            </form>
        </div>
    );
}

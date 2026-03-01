"use client";

import { SlidersHorizontal, Download, MoreVertical } from "lucide-react";

export interface FeeRecord {
    studentName: string;
    id: string;
    class: string;
    date: string;
    amount: string;
    status: "Paid" | "Pending" | "Overdue";
    avatar: string;
}

const statusStyles = {
    Paid: "badge-success",
    Pending: "badge-warning",
    Overdue: "badge-danger",
};

const avatarColors = [
    "from-blue-400 to-blue-600",
    "from-purple-400 to-purple-600",
    "from-amber-400 to-amber-600",
    "from-rose-400 to-rose-600",
    "from-emerald-400 to-emerald-600",
];

export default function FeeTable({ data }: { data: FeeRecord[] }) {
    return (
        <div className="card">
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4">
                <h3 className="text-lg font-bold text-text-primary">Recent Fee Collections</h3>
                <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg hover:bg-surface-alt text-text-muted hover:text-text-secondary transition-colors">
                        <SlidersHorizontal className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-surface-alt text-text-muted hover:text-text-secondary transition-colors">
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Student Name</th>
                            <th>ID</th>
                            <th>Class</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th className="w-12">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((record, index) => (
                            <tr key={record.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                                <td>
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColors[index % avatarColors.length]} flex items-center justify-center text-white text-xs font-bold shadow-sm`}
                                        >
                                            {record.avatar}
                                        </div>
                                        <span className="font-semibold">{record.studentName}</span>
                                    </div>
                                </td>
                                <td className="text-text-muted font-mono text-sm">{record.id}</td>
                                <td>{record.class}</td>
                                <td className="text-text-secondary">{record.date}</td>
                                <td className="font-semibold">{record.amount}</td>
                                <td>
                                    <span className={`badge ${statusStyles[record.status]}`}>
                                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                        {record.status}
                                    </span>
                                </td>
                                <td>
                                    <button className="p-1.5 rounded-lg hover:bg-surface-alt text-text-muted hover:text-text-primary transition-colors">
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

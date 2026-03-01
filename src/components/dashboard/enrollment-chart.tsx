"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

export interface EnrollmentData {
    month: string;
    students: number;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-sidebar text-white px-4 py-2.5 rounded-xl shadow-xl text-sm">
                <p className="font-semibold">{label}</p>
                <p className="text-accent mt-0.5">{payload[0].value} students</p>
            </div>
        );
    }
    return null;
}

export default function EnrollmentChart({ data }: { data: EnrollmentData[] }) {
    return (
        <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-text-primary">Student Enrollment Growth</h3>
                    <p className="text-text-muted text-sm mt-0.5">Total active students over the last 6 months</p>
                </div>
                <button className="text-accent text-sm font-semibold hover:text-accent-dark transition-colors">
                    View Report
                </button>
            </div>
            <div className="h-[280px] -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <defs>
                            <linearGradient id="enrollmentGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
                                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }}
                            dy={8}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#94a3b8", fontSize: 12 }}
                            dx={-8}
                            domain={["auto", "auto"]}
                            allowDataOverflow={false}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#22c55e", strokeWidth: 1, strokeDasharray: "4 4" }} />
                        <Area
                            type="monotone"
                            dataKey="students"
                            stroke="#22c55e"
                            strokeWidth={2.5}
                            fill="url(#enrollmentGradient)"
                            dot={{ fill: "#22c55e", strokeWidth: 2, stroke: "#fff", r: 4 }}
                            activeDot={{ fill: "#22c55e", strokeWidth: 3, stroke: "#fff", r: 6 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

"use client";

import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string;
    trend: {
        value: string;
        isPositive: boolean;
        label: string;
    };
    icon: LucideIcon;
    iconBg: string;
    iconColor: string;
}

export default function StatCard({ title, value, trend, icon: Icon, iconBg, iconColor }: StatCardProps) {
    return (
        <div className="card p-6 flex flex-col justify-between group">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-text-secondary text-sm font-medium">{title}</p>
                    <p className="text-3xl font-bold text-text-primary mt-2 tracking-tight">{value}</p>
                </div>
                <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: iconBg }}
                >
                    <Icon className="w-5 h-5" style={{ color: iconColor }} />
                </div>
            </div>
            <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-border-light">
                {trend.isPositive ? (
                    <TrendingUp className="w-3.5 h-3.5 text-success" />
                ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-danger" />
                )}
                <span className={`text-xs font-bold ${trend.isPositive ? "text-success" : "text-danger"}`}>
                    {trend.value}
                </span>
                <span className="text-text-muted text-xs">{trend.label}</span>
            </div>
        </div>
    );
}

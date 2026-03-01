"use client";

import { Bell } from "lucide-react";

interface HeaderProps {
    title: string;
    subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
    return (
        <header className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
                {subtitle && (
                    <p className="text-text-secondary text-sm mt-0.5">{subtitle}</p>
                )}
            </div>

            <div className="flex items-center gap-3">
                {/* Notification Bell */}
                <button className="relative p-2.5 rounded-xl bg-surface border border-border hover:border-accent/30 hover:shadow-md transition-all duration-200">
                    <Bell className="w-5 h-5 text-text-secondary" />
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-danger rounded-full ring-2 ring-surface" />
                </button>
            </div>
        </header>
    );
}

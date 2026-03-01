"use client";

import { Calendar } from "lucide-react";

export interface EventItem {
    month: string;
    day: string;
    title: string;
    time: string;
    location: string;
    color: string;
}

export default function UpcomingEvents({ data }: { data: EventItem[] }) {
    return (
        <div className="card p-6 h-full flex flex-col">
            <h3 className="text-lg font-bold text-text-primary mb-5">Upcoming Events</h3>

            <div className="space-y-4 flex-1">
                {data.map((event, index) => (
                    <div
                        key={index}
                        className="flex items-start gap-4 p-3 rounded-xl hover:bg-surface-alt transition-colors duration-200 group"
                    >
                        {/* Date Badge */}
                        <div
                            className="min-w-[52px] h-[56px] rounded-xl flex flex-col items-center justify-center text-white shadow-md transition-transform duration-200 group-hover:scale-105"
                            style={{ backgroundColor: event.color }}
                        >
                            <span className="text-[10px] font-bold tracking-wider opacity-90">{event.month}</span>
                            <span className="text-xl font-extrabold leading-none">{event.day}</span>
                        </div>

                        {/* Event Info */}
                        <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold text-text-primary truncate">{event.title}</h4>
                            <p className="text-xs text-text-muted mt-1">
                                {event.time} • {event.location}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <button className="w-full mt-4 py-2.5 rounded-xl border border-border text-text-secondary text-sm font-semibold hover:bg-surface-alt hover:border-accent/30 hover:text-accent transition-all duration-200 flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4" />
                View Calendar
            </button>
        </div>
    );
}

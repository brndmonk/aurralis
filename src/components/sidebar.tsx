"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    BookOpen,
    CreditCard,
    CalendarDays,
    BarChart3,
    Settings,
    LogOut,
    Phone,
} from "lucide-react";

const navigation = [
    {
        label: "MAIN",
        items: [
            { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        ],
    },
    {
        label: "MANAGEMENT",
        items: [
            { name: "User Roles", href: "/dashboard/users", icon: Users },
            { name: "Students", href: "/dashboard/students", icon: GraduationCap },
            { name: "Classes", href: "/dashboard/classes", icon: BookOpen },
            { name: "Fees & Billing", href: "/dashboard/fees", icon: CreditCard },
            { name: "Calendar", href: "/dashboard/calendar", icon: CalendarDays },
            { name: "Leads", href: "/dashboard/leads", icon: Phone },
        ],
    },
    {
        label: "ANALYTICS",
        items: [
            { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
        ],
    },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 bottom-0 w-[260px] bg-sidebar flex flex-col z-50">
            {/* Logo */}
            <div className="px-5 py-5 border-b border-white/10">
                <Image
                    src="/logo.png"
                    alt="Aurralis Montessori"
                    width={160}
                    height={56}
                    className="object-contain"
                    priority
                />
                <p className="text-white/50 text-[10px] font-semibold tracking-widest uppercase mt-2 pl-0.5">
                    Admin Portal
                </p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 mt-4 overflow-y-auto">
                {navigation.map((section) => (
                    <div key={section.label} className="mb-5">
                        <p className="px-4 mb-2 text-[10px] font-bold tracking-[0.08em] text-white/30 uppercase">
                            {section.label}
                        </p>
                        <ul className="space-y-0.5">
                            {section.items.map((item) => {
                                const isActive = pathname === item.href ||
                                    (item.href !== "/dashboard" && pathname.startsWith(item.href));
                                const Icon = item.icon;
                                return (
                                    <li key={item.name}>
                                        <Link
                                            href={item.href}
                                            className={`
                        flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium
                        transition-all duration-200 group
                        ${isActive
                                                    ? "bg-sidebar-active text-accent shadow-[inset_0_0_0_1px_rgba(32,201,186,0.2)]"
                                                    : "text-white/50 hover:text-white hover:bg-sidebar-hover"
                                                }
                      `}
                                        >
                                            <Icon
                                                className={`w-[18px] h-[18px] transition-colors
                                ${isActive ? "text-accent" : "text-white/40 group-hover:text-white/80"}`}
                                            />
                                            {item.name}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            {/* Bottom Section */}
            <div className="px-3 pb-4 space-y-1">
                <Link
                    href="/dashboard/settings"
                    className={`
            flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium
            transition-all duration-200
            ${pathname === "/dashboard/settings"
                            ? "bg-sidebar-active text-accent"
                            : "text-white/50 hover:text-white hover:bg-sidebar-hover"
                        }
          `}
                >
                    <Settings className={`w-[18px] h-[18px] ${pathname === "/dashboard/settings" ? "text-accent" : "text-white/40"}`} />
                    Settings
                </Link>

                {/* User Profile */}
                <div className="mx-1 mt-3 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-3 px-3 py-2">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent/40 to-accent/10 flex items-center justify-center text-accent font-bold text-sm ring-1 ring-accent/20">
                            A
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold truncate">Admin</p>
                            <p className="text-white/40 text-[11px]">Aurralis Montessori</p>
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="text-white/30 hover:text-white/70 transition-colors p-1"
                            title="Sign out"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
}

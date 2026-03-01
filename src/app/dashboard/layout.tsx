import Sidebar from "@/components/sidebar";
import Breadcrumbs from "@/components/dashboard/Breadcrumbs";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-surface-alt">
            <Sidebar />
            <main className="ml-[260px] p-8 min-h-screen flex flex-col">
                <Breadcrumbs />
                <div className="flex-1">
                    {children}
                </div>
            </main>
        </div>
    );
}

"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import React from "react";

export default function Breadcrumbs() {
    const pathname = usePathname();

    // Default to /dashboard being the base
    const pathSegments = pathname.split('/').filter(p => p);

    // If we're right on /dashboard, don't show "Dashboard / " by itself or we can show nothing/just "Dashboard"
    if (pathSegments.length <= 1) return null;

    return (
        <div className="flex items-center gap-2 text-xs text-text-muted mb-4 animate-fade-in">
            {pathSegments.map((segment, index) => {
                const isLast = index === pathSegments.length - 1;
                const path = `/${pathSegments.slice(0, index + 1).join('/')}`;

                // Format text: Capitalize first letter, replace hyphens with spaces
                const formattedText = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

                return (
                    <React.Fragment key={path}>
                        {isLast ? (
                            <span className="text-text-primary font-medium">{formattedText}</span>
                        ) : (
                            <>
                                <Link href={path} className="hover:text-accent cursor-pointer transition-colors">
                                    {formattedText}
                                </Link>
                                <span>/</span>
                            </>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

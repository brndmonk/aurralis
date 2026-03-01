import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Aurralis | Montessori Admin Dashboard",
    description: "Modern school management dashboard for Aurralis Montessori — manage students, classes, fees, attendance, and more.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`antialiased ${inter.className}`}>
                {children}
            </body>
        </html>
    );
}

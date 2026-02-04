"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { GymProvider } from "@/context/GymContext";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === "/login";

    return (
        <GymProvider>
            <div className="flex flex-col min-h-screen bg-white">
                {/* Navigation Logic */}
                {!isLoginPage && <Sidebar />}


                <main className="flex-1 w-full max-w-7xl mx-auto px-8 pb-8 pt-32 relative z-10">
                    {children}
                </main>
            </div>
        </GymProvider>
    );
}

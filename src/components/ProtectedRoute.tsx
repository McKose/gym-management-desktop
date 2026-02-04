"use client";

import { useGym } from "@/context/GymContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
    const { currentUser } = useGym();
    const router = useRouter();

    useEffect(() => {
        if (!currentUser) {
            router.push("/login");
        } else if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
            // If user logic is needed, redirect or show unauthorized
        }
    }, [currentUser, router, allowedRoles]);

    if (!currentUser) return null;

    if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                <h1 className="text-3xl font-bold text-red-500 mb-4">Yetkisiz Erişim</h1>
                <p className="text-zinc-400">Bu sayfayı görüntülemek için yetkiniz bulunmamaktadır.</p>
            </div>
        );
    }

    return <>{children}</>;
}

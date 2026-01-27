"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!user) {
            router.push("/login");
        } else if (allowedRoles && !allowedRoles.includes(user.role)) {
            // If user logic is needed, redirect or show unauthorized
        }
    }, [user, router, allowedRoles]);

    if (!user) return null;

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                <h1 className="text-3xl font-bold text-red-500 mb-4">Yetkisiz Erişim</h1>
                <p className="text-zinc-400">Bu sayfayı görüntülemek için yetkiniz bulunmamaktadır.</p>
            </div>
        );
    }

    return <>{children}</>;
}

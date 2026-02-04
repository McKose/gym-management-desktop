"use client";

import { useState } from "react";
import { useGym, Role } from "@/context/GymContext";
import { Lock, User } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const { setCurrentUser, staff } = useGym();
    const [username, setUsername] = useState("");
    const [role, setRole] = useState<Role>("manager");
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Find user by name and role (Simple simulation)
        // In reality, we'd check ID or handle explicit login. 
        // For now, let's just find the first user matching the role or create a dummy session if specific user entry is desired.

        // Let's filter by Role as the UI suggests simulating a "Role Login". 
        // We'll pick the first staff member with that role.
        const user = staff.find(s => s.role === role);

        if (user) {
            setCurrentUser(user);
            router.push("/");
        } else {
            alert("Bu rolde kullanıcı bulunamadı!");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#09090b] text-white p-4">
            <div className="w-full max-w-md glass-panel p-8">
                <div className="mb-8 text-center">
                    <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mx-auto mb-4">
                        <span className="font-bold text-xl text-white">G</span>
                    </div>
                    <h1 className="text-2xl font-bold">GymPro Giriş</h1>
                    <p className="text-zinc-400 mt-2">Yönetim paneline erişmek için giriş yapın.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Temporarily simplified login to just Role Selection since we are moving away from username match in simulation */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Giriş Yapılacak Rol</label>
                        <div className="grid grid-cols-2 gap-3">
                            {(['manager', 'trainer', 'admin', 'dietitian'] as Role[]).map(r => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setRole(r)}
                                    className={`py-3 rounded-lg border transition-all capitalize ${role === r
                                        ? "bg-indigo-500/10 border-indigo-500 text-indigo-400"
                                        : "bg-zinc-900 border-zinc-700 text-zinc-500 hover:border-zinc-500"
                                        }`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="w-full btn-primary mt-4">
                        Giriş Yap
                    </button>
                </form>
            </div>
        </div>
    );
}

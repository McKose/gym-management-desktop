"use client";

import { useState } from "react";
import { useAuth, Role } from "@/context/AuthContext";
import { Lock, User } from "lucide-react";

export default function LoginPage() {
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [role, setRole] = useState<Role>("manager");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Logic for demo: password check could be here
        login(username, role);
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
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Kullanıcı Adı</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-zinc-500" size={20} />
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-indigo-500"
                                placeholder="Örn: admin"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Rol (Simülasyon)</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setRole("manager")}
                                className={`py-3 rounded-lg border transition-all ${role === "manager"
                                        ? "bg-indigo-500/10 border-indigo-500 text-indigo-400"
                                        : "bg-zinc-900 border-zinc-700 text-zinc-500 hover:border-zinc-500"
                                    }`}
                            >
                                Yönetici
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole("trainer")}
                                className={`py-3 rounded-lg border transition-all ${role === "trainer"
                                        ? "bg-indigo-500/10 border-indigo-500 text-indigo-400"
                                        : "bg-zinc-900 border-zinc-700 text-zinc-500 hover:border-zinc-500"
                                    }`}
                            >
                                Eğitmen
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Şifre</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-zinc-500" size={20} />
                            <input
                                type="password"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-indigo-500"
                                placeholder="••••••"
                            />
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

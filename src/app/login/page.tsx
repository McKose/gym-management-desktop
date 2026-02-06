"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGym, Role } from "@/context/GymContext";

export default function LoginPage() {
    const { login } = useGym();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [role, setRole] = useState<Role>("manager");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            login(role as any);
            router.push("/");
        } catch {
            // setError("Giriş yapılırken bir hata oluştu.");
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
                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Kullanıcı Adı"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                        <input
                            type="password"
                            placeholder="Şifre"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Giriş Yapılacak Rol</label>
                        <div className="grid grid-cols-2 gap-3">
                            {(['manager', 'trainer', 'admin', 'dietitian'] as Role[]).map(r => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setRole(r)}
                                    className={`flex-1 py-2 rounded-lg border transition-all capitalize ${role === r ? 'bg-black text-white border-black font-bold' : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50'}`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <button type="submit" className="w-full btn-primary mt-4">
                        Giriş Yap
                    </button>
                </form>
            </div>
        </div>
    );
}

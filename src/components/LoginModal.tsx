import { useState, useEffect } from "react";
import { Staff, useGym } from "@/context/GymContext";
import { Lock, User as UserIcon } from "lucide-react";
import Modal from "./Modal";

interface LoginModalProps {
    isOpen: boolean;
    onLogin: (user: Staff) => void;
    targetUser?: Staff | null; // If provided, we are validating this specific user (e.g. role switch)
    onCancel?: () => void;
}

export default function LoginModal({ isOpen, onLogin, targetUser, onCancel }: LoginModalProps) {
    const { staff } = useGym();
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setPassword("");
            setError("");
            if (targetUser) {
                setSelectedUserId(targetUser.id);
            } else if (!selectedUserId && staff.length > 0) {
                // Default to first user if not set
                setSelectedUserId(staff[0].id);
            }
        }
    }, [isOpen, targetUser, staff]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const userToVerify = staff.find(s => s.id === selectedUserId);

        if (!userToVerify) {
            setError("Kullanıcı bulunamadı.");
            return;
        }

        // Check Password (Default "1234" if not set)
        const validPassword = userToVerify.password || "1234";

        if (password === validPassword) {
            onLogin(userToVerify);
        } else {
            setError("Hatalı şifre!");
        }
    };

    if (!isOpen) return null;

    // Determine if this is a "Switch Role" or "Initial Login" scenario
    const isSwitching = !!targetUser;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onCancel || (() => { })} // Prevent closing if no cancel action available
            title={isSwitching ? "Rol Değiştirme Onayı" : "Sisteme Giriş Yap"}
            width="450px"
        >
            <form onSubmit={handleLogin} className="space-y-6">
                {/* User Selection (Only if not switching specific user) */}
                {!isSwitching && (
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Kullanıcı Seçin</label>
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-black text-sm focus:outline-none focus:border-black appearance-none"
                            >
                                {staff.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {/* Target User Info (If switching) */}
                {isSwitching && targetUser && (
                    <div className="flex items-center gap-3 bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 text-sm">
                            {targetUser.name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="font-bold text-black text-sm">{targetUser.name}</h3>
                            <p className="text-xs text-zinc-500 capitalize">{targetUser.role}</p>
                        </div>
                    </div>
                )}

                {/* Password Input */}
                <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                        {isSwitching ? `Parola Girin ("1234")` : `Parola ("1234")`}
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-black text-sm focus:outline-none focus:border-black transition-colors"
                            placeholder="******"
                            autoFocus
                        />
                    </div>
                    {error && (
                        <p className="text-red-500 text-xs font-bold mt-2 flex items-center gap-1">
                            <span>⚠️</span> {error}
                        </p>
                    )}
                </div>

                <div className="flex gap-3 pt-2">
                    {/* Cancel Button */}
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 py-2.5 rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors text-sm font-medium"
                        >
                            İptal
                        </button>
                    )}
                    <button
                        type="submit"
                        className="flex-1 py-2.5 rounded-lg bg-black text-white hover:bg-zinc-800 transition-colors text-sm font-medium shadow-sm active:scale-95"
                    >
                        {isSwitching ? "Onayla ve Geçiş Yap" : "Giriş Yap"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

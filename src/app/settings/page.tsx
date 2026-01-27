"use client";

import { useGym } from "@/context/GymContext";
import { useState } from "react";
import { Lock, Key, Percent, DollarSign, Plus, Trash2, Save, CreditCard, Package as PackageIcon, Info } from "lucide-react";

export default function SettingsPage() {
    const {
        hasPermission,
        staff, updateStaff,
        commissionRates, updateCommissionRate, addCommissionRate, deleteCommissionRate,
        coupons, addCoupon, deleteCoupon
    } = useGym();

    // Permissions
    const canView = hasPermission("view_settings");
    const canManage = hasPermission("manage_settings");

    // Local States for inputs
    const [newInstallment, setNewInstallment] = useState<number | "">("");
    const [newRate, setNewRate] = useState<number | "">("");

    // Coupon States
    const [newCouponCode, setNewCouponCode] = useState("");
    const [newCouponRate, setNewCouponRate] = useState<number | "">("");

    // Password Editing State
    const [passwordEdits, setPasswordEdits] = useState<Record<string, string>>({});

    if (!canView) {
        return (
            <div className="flex h-[50vh] items-center justify-center text-zinc-500">
                <p>Bu sayfayı görüntüleme yetkiniz yok.</p>
            </div>
        );
    }

    const handlePasswordSave = (id: string) => {
        const pass = passwordEdits[id];
        if (pass) {
            updateStaff(id, { password: pass });
            setPasswordEdits(prev => {
                const copy = { ...prev };
                delete copy[id];
                return copy;
            });
            alert("Şifre güncellendi.");
        }
    };

    const handleAddCommission = (e: React.FormEvent) => {
        e.preventDefault();
        if (newInstallment && newRate !== "") {
            const exists = commissionRates.some(c => c.installments === Number(newInstallment));
            if (exists) {
                alert(`Bu taksit sayısı (${newInstallment}) zaten tanımlı! Mevcut oranı listeden güncelleyebilirsiniz.`);
                return;
            }
            addCommissionRate(Number(newInstallment), Number(newRate));
            setNewInstallment("");
            setNewRate("");
            alert("Yeni komisyon oranı eklendi.");
        }
    };

    const handleAddCoupon = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCouponCode && newCouponRate !== "") {
            const exists = coupons.some(c => c.code === newCouponCode.toUpperCase());
            if (exists) {
                alert(`Bu kupon kodu (${newCouponCode}) zaten tanımlı!`);
                return;
            }

            addCoupon({
                code: newCouponCode,
                discountRate: Number(newCouponRate),
                isActive: true
            });
            setNewCouponCode("");
            setNewCouponRate("");
            alert("Kupon eklendi.");
        }
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            <div>
                <h1 className="text-3xl font-bold text-black">Ayarlar</h1>
                <p className="text-zinc-500 mt-1">Sistem genel yapılandırması ve yönetim paneli.</p>
            </div>

            <div className="grid grid-cols-1 gap-8">

                {/* 2. Coupon Configuration (New User Request) */}
                <section className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center border border-pink-100">
                            <Percent size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-black">İndirim Kuponları</h2>
                            <p className="text-xs text-zinc-500">Mağaza satışlarında kullanılabilecek indirim kodları.</p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8">
                        {/* List */}
                        <div className="flex-1 w-full overflow-hidden border border-zinc-200 rounded-lg">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-zinc-50 text-zinc-500 font-medium border-b border-zinc-200">
                                    <tr>
                                        <th className="px-4 py-3">Kupon Kodu</th>
                                        <th className="px-4 py-3">İndirim Oranı</th>
                                        <th className="px-4 py-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {coupons.map((c) => (
                                        <tr key={c.id} className="hover:bg-zinc-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-black tracking-wider font-mono">{c.code}</td>
                                            <td className="px-4 py-3 font-bold text-pink-600">%{c.discountRate}</td>
                                            <td className="px-4 py-3 text-right">
                                                {canManage && (
                                                    <button onClick={() => deleteCoupon(c.id)} className="text-zinc-400 hover:text-red-500">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {coupons.length === 0 && (
                                        <tr><td colSpan={3} className="px-4 py-4 text-center text-zinc-400 italic">Kayıtlı kupon yok.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Add Form */}
                        {canManage && (
                            <div className="w-full md:w-72 bg-zinc-50 p-5 rounded-lg border border-zinc-200 h-fit">
                                <h3 className="text-sm font-bold text-black mb-4 flex items-center gap-2">
                                    <Plus size={16} /> Yeni Kupon Ekle
                                </h3>
                                <form onSubmit={handleAddCoupon} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-500 mb-1">Kupon Kodu</label>
                                        <input
                                            type="text"
                                            required
                                            value={newCouponCode}
                                            onChange={e => setNewCouponCode(e.target.value.toUpperCase())}
                                            placeholder="Örn: YAZ2024"
                                            className="w-full p-2 bg-white border border-zinc-200 rounded text-sm text-black focus:outline-none focus:border-pink-500 uppercase font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-500 mb-1">İndirim Oranı (%)</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            max="100"
                                            value={newCouponRate}
                                            onChange={e => setNewCouponRate(Number(e.target.value))}
                                            placeholder="Örn: 10"
                                            className="w-full p-2 bg-white border border-zinc-200 rounded text-sm text-black focus:outline-none focus:border-pink-500"
                                        />
                                    </div>
                                    <button type="submit" className="w-full py-2 bg-black text-white rounded font-medium text-xs hover:bg-zinc-800 transition-colors">
                                        Ekle
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </section>

                {/* 3. Bank Commissions */}
                <section className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                            <CreditCard size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-black">Banka Komisyon Ayarları</h2>
                            <p className="text-xs text-zinc-500">Kredi kartı ile ödemelerde taksit sayısına göre uygulanacak komisyon oranları.</p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8">
                        {/* List */}
                        <div className="flex-1 w-full overflow-hidden border border-zinc-200 rounded-lg">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-zinc-50 text-zinc-500 font-medium border-b border-zinc-200">
                                    <tr>
                                        <th className="px-4 py-3">Taksit Sayısı</th>
                                        <th className="px-4 py-3">Komisyon Oranı (%)</th>
                                        <th className="px-4 py-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {commissionRates.map((c) => (
                                        <tr key={c.installments} className="hover:bg-zinc-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-black">{c.installments === 1 ? "Tek Çekim" : `${c.installments} Taksit`}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        disabled={!canManage}
                                                        value={c.rate}
                                                        onChange={e => updateCommissionRate(c.installments, Number(e.target.value))}
                                                        className="w-16 bg-transparent border-b border-zinc-300 focus:border-indigo-500 outline-none text-center font-bold text-indigo-600"
                                                    />
                                                    <span className="text-zinc-400">%</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {canManage && (
                                                    <button onClick={() => deleteCommissionRate(c.installments)} className="text-zinc-400 hover:text-red-500">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {commissionRates.length === 0 && (
                                        <tr><td colSpan={3} className="px-4 py-4 text-center text-zinc-400 italic">Kayıtlı oran yok.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Add Form */}
                        {canManage && (
                            <div className="w-full md:w-72 bg-zinc-50 p-5 rounded-lg border border-zinc-200 h-fit">
                                <h3 className="text-sm font-bold text-black mb-4 flex items-center gap-2">
                                    <Plus size={16} /> Yeni Oran Ekle
                                </h3>
                                <form onSubmit={handleAddCommission} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-500 mb-1">Taksit Sayısı</label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            max="12"
                                            value={newInstallment}
                                            onChange={e => setNewInstallment(Number(e.target.value))}
                                            placeholder="Örn: 3"
                                            className="w-full p-2 bg-white border border-zinc-200 rounded text-sm text-black focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-500 mb-1">Komisyon (%)</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            step="0.1"
                                            value={newRate}
                                            onChange={e => setNewRate(Number(e.target.value))}
                                            placeholder="Örn: 2.5"
                                            className="w-full p-2 bg-white border border-zinc-200 rounded text-sm text-black focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <button type="submit" className="w-full py-2 bg-black text-white rounded font-medium text-xs hover:bg-zinc-800 transition-colors">
                                        Ekle
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </section>

                {/* 3. Staff Passwords */}
                <section className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
                            <Key size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-black">Personel Şifreleri</h2>
                            <p className="text-xs text-zinc-500">Personel giriş şifrelerini buradan tanımlayabilirsiniz.</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-zinc-50 text-zinc-500 font-medium border-b border-zinc-200">
                                <tr>
                                    <th className="px-4 py-3">Personel</th>
                                    <th className="px-4 py-3">Rol</th>
                                    <th className="px-4 py-3">Şifre</th>
                                    <th className="px-4 py-3 w-20"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {staff.map((s) => (
                                    <tr key={s.id} className="hover:bg-zinc-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-black">{s.name}</td>
                                        <td className="px-4 py-3 capitalize text-zinc-500">{s.role}</td>
                                        <td className="px-4 py-3">
                                            {canManage ? (
                                                <input
                                                    type="text"
                                                    value={passwordEdits[s.id] !== undefined ? passwordEdits[s.id] : (s.password || "")}
                                                    onChange={e => setPasswordEdits(prev => ({ ...prev, [s.id]: e.target.value }))}
                                                    placeholder="Şifre Belirlenmedi"
                                                    className="w-full max-w-[200px] bg-transparent border-b border-zinc-200 focus:border-orange-500 outline-none py-1 text-zinc-700 placeholder-zinc-300"
                                                />
                                            ) : (
                                                <span className="text-zinc-400">********</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {canManage && passwordEdits[s.id] !== undefined && passwordEdits[s.id] !== s.password && (
                                                <button
                                                    onClick={() => handlePasswordSave(s.id)}
                                                    className="text-orange-600 hover:text-orange-700 font-medium text-xs bg-orange-50 px-3 py-1.5 rounded border border-orange-100"
                                                >
                                                    Kaydet
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div >
        </div >
    );
}

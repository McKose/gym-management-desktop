"use client";

import { useGym, Role, Permission, CommissionRate, Coupon, Staff } from "@/context/GymContext";
import { useState, useEffect } from "react";
import { Key, Percent, Plus, Trash2, Save, CreditCard, ShieldCheck, RefreshCw, Download, CheckCircle2, AlertCircle } from "lucide-react";

export default function SettingsPage() {
    const {
        hasPermission,
        staff, updateStaff,
        commissionRates, updateCommissionRate, addCommissionRate, deleteCommissionRate,
        coupons, addCoupon, deleteCoupon,
        rolePermissions, updateRolePermissions
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

    // Update States
    const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'ready' | 'error'>('idle');
    const [updateInfo, setUpdateInfo] = useState<unknown>(null);
    const [updateProgress, setUpdateProgress] = useState(0);
    const [updateError, setUpdateError] = useState("");

    const electron = (typeof window !== 'undefined' && (window as unknown as { electron: { onUpdateStatus: any, onUpdateProgress: any, checkForUpdate: any, startDownload: any, quitAndInstall: any } }).electron) ? (window as unknown as { electron: { onUpdateStatus: any, onUpdateProgress: any, checkForUpdate: any, startDownload: any, quitAndInstall: any } }).electron : null;

    useEffect(() => {
        if (electron) {
            electron.onUpdateStatus((status: string, info: unknown) => {
                setUpdateStatus(status as 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'ready' | 'error');
                if (info) setUpdateInfo(info as { version?: string });
                if (status === 'error') setUpdateError(String(info));
            });

            electron.onUpdateProgress((percent: number) => {
                setUpdateProgress(percent);
            });
        }
    }, [electron]);

    const handleCheckUpdate = async () => {
        if (electron) {
            setUpdateStatus('checking');
            const res = await electron.checkForUpdate();
            if (res?.error) {
                setUpdateStatus('error');
                setUpdateError(res.error);
            }
        }
    };

    const handleStartDownload = async () => {
        if (electron) {
            setUpdateStatus('downloading');
            const res = await electron.startDownload();
            if (res?.error) {
                setUpdateStatus('error');
                setUpdateError(res.error);
            }
        }
    };

    const handleInstallUpdate = () => {
        if (electron) {
            electron.quitAndInstall();
        }
    };

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

    // const handlePasswordChange = ...;

    const handleAddCommission = (e: React.FormEvent) => {
        e.preventDefault();
        if (newInstallment && newRate !== "") {
            const exists = commissionRates.some((c: CommissionRate) => c.installments === Number(newInstallment));
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
            const exists = coupons.some((c: Coupon) => c.code === newCouponCode.toUpperCase());
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
                {/* 1. Role Permissions (Admin Only) */}
                {canManage && (
                    <section className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-black">Rol Yetkileri</h2>
                                <p className="text-xs text-zinc-500">Hangi rolün nerelere erişebileceğini yapılandırın.</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto border border-zinc-200 rounded-lg">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-zinc-50 text-zinc-500 font-bold border-b border-zinc-200">
                                    <tr>
                                        <th className="px-4 py-3 sticky left-0 bg-zinc-50 border-r border-zinc-200">İzin Adı</th>
                                        {(['manager', 'trainer', 'physio', 'dietitian'] as Role[]).map(role => (
                                            <th key={role} className="px-4 py-3 text-center capitalize">{role}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {[
                                        { id: 'view_stats', label: 'İstatistikleri Gör' },
                                        { id: 'view_packages', label: 'Paketleri Gör' },
                                        { id: 'manage_packages', label: 'Paket Yönetimi' },
                                        { id: 'view_staff', label: 'Personel Listesi' },
                                        { id: 'manage_staff', label: 'Personel Yönetimi' },
                                        { id: 'view_financials', label: 'Finansal Veriler' },
                                        { id: 'manage_financials', label: 'Finans Yönetimi' },
                                        { id: 'view_member', label: 'Üye Listesi' },
                                        { id: 'add_member', label: 'Üye Ekleme' },
                                        { id: 'edit_member', label: 'Üye Düzenleme' },
                                        { id: 'delete_member', label: 'Üye Silme' },
                                        { id: 'view_schedule', label: 'Randevu Takvimi' },
                                        { id: 'add_appointment', label: 'Randevu Ekleme' },
                                        { id: 'view_store', label: 'Mağaza / Satış' },
                                        { id: 'view_settings', label: 'Ayarları Görüntüle' },
                                        { id: 'manage_settings', label: 'Tam Sistem Yönetimi' },
                                    ].map((perm) => (
                                        <tr key={perm.id} className="hover:bg-zinc-50 transition-colors">
                                            <td className="px-4 py-2 font-medium border-r border-zinc-100">{perm.label} (<code>{perm.id}</code>)</td>
                                            {(['manager', 'trainer', 'physio', 'dietitian'] as Role[]).map(role => {
                                                const hasPerm = rolePermissions[role]?.includes(perm.id as Permission);
                                                return (
                                                    <td key={role} className="px-4 py-2 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={hasPerm || false}
                                                            onChange={(e) => {
                                                                const currentPerms = rolePermissions[role] || [];
                                                                let newPerms: Permission[];
                                                                if (e.target.checked) {
                                                                    newPerms = [...currentPerms, perm.id as Permission];
                                                                } else {
                                                                    newPerms = currentPerms.filter((p: Permission) => p !== perm.id);
                                                                }
                                                                updateRolePermissions(role, newPerms);
                                                            }}
                                                            className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-black"
                                                        />
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

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
                                    {coupons.map((c: Coupon) => (
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
                                    {commissionRates.map((c: CommissionRate) => (
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
                                                    <p className="text-zinc-400">Versiyon {(updateInfo as any).version || '1.0.8'}</p>
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
                                {staff.map((s: Staff) => (
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

                {/* 4. Software Update */}
                <section className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                            <RefreshCw size={20} className={updateStatus === 'checking' ? 'animate-spin' : ''} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-black">Yazılım Güncelleme</h2>
                            <p className="text-xs text-zinc-500">Uygulama versiyonunu kontrol edin ve güncelleyin.</p>
                        </div>
                    </div>

                    <div className="bg-zinc-50 rounded-lg p-6 border border-zinc-100">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-1">
                                <div className="text-sm font-bold text-zinc-800">
                                    Mevcut Versiyon: <span className="text-zinc-500 font-mono">v1.0.8</span>
                                </div>
                                <div className="text-xs text-zinc-400">
                                    {updateStatus === 'idle' && "Güncelleştirmeleri kontrol etmek için butona tıklayın."}
                                    {updateStatus === 'checking' && "Sunucu ile bağlantı kuruluyor..."}
                                    {updateStatus === 'not-available' && "Tebrikler! En güncel sürümü kullanıyorsunuz."}
                                    {updateStatus === 'available' && `Yeni sürüm mevcut: v${(updateInfo as any)?.version || '?'}`}
                                    {updateStatus === 'downloading' && `İndiriliyor: %${Math.round(updateProgress)}`}
                                    {updateStatus === 'ready' && "Güncelleme hazır! Kurulum için yeniden başlatın."}
                                    {updateStatus === 'error' && <span className="text-red-500 font-medium">{updateError || "Bir hata oluştu."}</span>}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                {updateStatus === 'idle' || updateStatus === 'not-available' || updateStatus === 'error' ? (
                                    <button
                                        onClick={handleCheckUpdate}
                                        className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-zinc-800 transition-colors"
                                    >
                                        <RefreshCw size={16} /> Güncellemeleri Denetle
                                    </button>
                                ) : null}

                                {updateStatus === 'available' && (
                                    <button
                                        onClick={handleStartDownload}
                                        className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors"
                                    >
                                        <Download size={16} /> Şimdi İndir
                                    </button>
                                )}

                                {updateStatus === 'ready' && (
                                    <button
                                        onClick={handleInstallUpdate}
                                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
                                    >
                                        <Save size={16} /> Şimdi Kur ve Yeniden Başlat
                                    </button>
                                )}
                            </div>
                        </div>

                        {updateStatus === 'downloading' && (
                            <div className="mt-6">
                                <div className="h-2 w-full bg-zinc-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-600 transition-all duration-300"
                                        style={{ width: `${updateProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        {updateStatus === 'not-available' && (
                            <div className="mt-4 flex items-center gap-2 text-emerald-600 text-xs font-bold">
                                <CheckCircle2 size={14} /> En güncel versiyon yüklü.
                            </div>
                        )}

                        {updateStatus === 'error' && (
                            <div className="mt-4 flex items-center gap-2 text-red-500 text-xs font-bold">
                                <AlertCircle size={14} /> Güncelleme kontrolü başarısız oldu.
                            </div>
                        )}
                    </div>
                </section>
            </div >
        </div >
    );
}

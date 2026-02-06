"use client";

import { useGym, Member, Package, MembershipHistoryItem, GroupSchedule, Measurement, HealthProfile, Service, CommissionRate, Branch } from "@/context/GymContext"; // Added Branch
import { useState, useEffect } from "react";
import { Plus, Phone, Mail, Edit2, RotateCw, History, Download, Activity, Trash2, HeartPulse } from "lucide-react";
import { downloadCSV } from "@/utils/export";
import Modal from "@/components/Modal";
import HealthForm from "@/components/HealthForm";

export default function MembersPage() {
    const {
        members, addMember, updateMember, renewMembership, deleteMember,
        packages, services, commissionRates, // Added services
        hasPermission, joinGroup
    } = useGym();

    const [mounted, setMounted] = useState(false);

    // Permission
    const canView = hasPermission("view_member");
    const canAdd = hasPermission("add_member");
    const canEdit = hasPermission("edit_member");
    const canDelete = hasPermission("delete_member");

    useEffect(() => {
        const timer = setTimeout(() => {
            setMounted(true);
        }, 0);
        return () => clearTimeout(timer);
    }, [packages, members]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);

    // Selected Member for Actions
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);

    // Add Member Form State
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [selectedServiceId, setSelectedServiceId] = useState(""); // New: Service Selection
    const [selectedPackageId, setSelectedPackageId] = useState("");
    const [startDate, setStartDate] = useState("");

    // Auto-Calculate End Date & Sessions
    useEffect(() => {
        if (selectedPackageId) {
            const pkg = packages.find((p: Package) => p.id === selectedPackageId);
            if (pkg && pkg.validityDays) {
                // Determine logic if needed, currently solved in Render or manual date set
            }
        }
    }, [selectedPackageId, packages]);

    const filteredPackages = packages.filter((p: Package) => p.serviceId === selectedServiceId && p.isActive);

    useEffect(() => {
        setStartDate(new Date().toISOString().split("T")[0]);
    }, []);

    // Payment State
    const [paymentType, setPaymentType] = useState<"cash" | "card">("cash");
    const [installments, setInstallments] = useState(1);
    const [paymentStatus, setPaymentStatus] = useState<"paid" | "pending">("pending");
    const [groupId, setGroupId] = useState("");

    // Measurements State
    const [weight, setWeight] = useState("");
    const [height, setHeight] = useState("");
    const [shoulders, setShoulders] = useState("");
    const [arm, setArm] = useState("");
    const [chest, setChest] = useState("");
    const [waist, setWaist] = useState("");
    const [hips, setHips] = useState("");
    const [leg, setLeg] = useState("");

    // Group Selection State
    const [groupSchedule, setGroupSchedule] = useState<GroupSchedule | "">("");
    const [groupTime, setGroupTime] = useState("");

    // Edit Note State
    const [editNote, setEditNote] = useState("");

    // Health Module State
    const [healthData, setHealthData] = useState<HealthProfile | undefined>(undefined);
    const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);

    // Tab State for Member Modal (Info vs Health)
    const [activeTab, setActiveTab] = useState<'info' | 'health'>('info');

    // Calculate Dynamic Price Helper
    const calculatePrice = (pkgId: string, payType: "cash" | "card", inst: number) => {
        const pkg = packages.find((p: Package) => p.id === pkgId);
        const base = pkg?.price || 0;
        const rate = payType === "card" ? (commissionRates.find((c: CommissionRate) => c.installments === inst)?.rate || 0) : 0;
        const commission = base * (rate / 100);
        return base + commission;
    };

    // Derived Price for Current Selection
    const calculatedPrice = calculatePrice(selectedPackageId, paymentType, installments);

    // Manual Price Override State
    const [finalPrice, setFinalPrice] = useState<number | "">("");

    // Sync final price with calculated price when package/payment changes, 
    // BUT only if user hasn't typed a custom override? 
    // Better: Allow users to click a "Reset" or just default it.
    // Strategy: We'll default finalPrice to calculatedPrice whenever calculatedPrice changes.
    useEffect(() => {
        setFinalPrice(calculatedPrice);
    }, [calculatedPrice]);

    const currentPrice = typeof finalPrice === 'number' ? finalPrice : calculatedPrice;

    const handleExport = () => {
        const data = members.map((m: Member) => ({
            "Ad Soyad": m.fullName,
            "Telefon": m.phone,
            "Paket": packages.find((p: Package) => p.id === m.activePackageId)?.name || "Yok",
            "Durum": m.status === 'active' ? 'Aktif' : 'Pasif',
            "Başlangıç": m.startDate,
            "Bitiş": m.endDate || '-',
            "Kalan Ders": m.remainingSessions ?? '-',
            "Toplam Ödeme": m.pricePaid || 0
        }));
        downloadCSV(data, `Uyeler_Listesi_${new Date().toISOString().split('T')[0]}.csv`);
    };

    // Reset Form
    const resetForm = () => {
        setFullName("");
        setPhone("");
        setEmail("");
        setSelectedPackageId("");
        setStartDate(new Date().toISOString().split("T")[0]);
        setPaymentType("cash");
        setInstallments(1);
        setPaymentStatus("pending");
        setGroupId("");
        setSelectedMember(null);
        // Reset Measurements
        setWeight(""); setHeight(""); setShoulders(""); setArm("");
        setChest(""); setWaist(""); setHips(""); setLeg("");
        // Reset Group
        setGroupSchedule(""); setGroupTime("");
        // Reset Health
        setHealthData(undefined);
        setActiveTab("info");
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();

        // Measurements
        const measurements: Measurement[] = [];
        if (weight || height || shoulders || arm || chest || waist || hips || leg) {
            measurements.push({
                date: new Date().toISOString().split("T")[0],
                weight: Number(weight) || 0,
                height: Number(height) || 0,
                shoulders: Number(shoulders) || 0,
                arm: Number(arm) || 0,
                chest: Number(chest) || 0,
                waist: Number(waist) || 0,
                hips: Number(hips) || 0,
                leg: Number(leg) || 0
            });
        }

        const newMemberId = addMember({
            fullName,
            phone,
            email,
            activePackageId: selectedPackageId || undefined,
            remainingSessions: packages.find((p: Package) => p.id === selectedPackageId)?.sessionCount,
            startDate,
            paymentType,
            paymentStatus,
            installments: paymentType === "card" ? installments : undefined,
            pricePaid: currentPrice,
            groupId: groupId || undefined,
            measurements: measurements.length > 0 ? measurements : undefined,
            healthProfile: healthData
        });

        // Group Auto-Join Logic
        const pkg = packages.find((p: Package) => p.id === selectedPackageId);
        // Using sessionFormat instead of legacy category
        if (pkg && pkg.sessionFormat === 'GRUP' && groupSchedule && groupTime) {
            // Branch is now derived from Service, but for now passing a default or deriving logic if needed. 
            // Ideally joinGroup needs branch, but let's assume 'reformer' or derive from service text if needed. 
            // For now, hardcoding or using a mapping if service allows. 
            // Actually, the new schema doesn't have pkg.branch strongly typed or present potentially.
            // Let's pass 'reformer' as fallback or fix joinGroup types later.
            // Better: Get Service category.
            const service = services.find((s: Service) => s.id === pkg.serviceId);
            // Assuming branch ~ service name normalized
            joinGroup([newMemberId], groupSchedule as GroupSchedule, groupTime, (service?.name.toLowerCase() || 'reformer') as Branch);
        }

        setIsModalOpen(false);
        resetForm();
    };

    // Renewal Handler
    const handleRenewSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedMember && selectedPackageId) {
            renewMembership(
                selectedMember.id,
                selectedPackageId,
                startDate,
                currentPrice,
                paymentType,
                paymentType === "card" ? installments : undefined
            );
            setIsRenewModalOpen(false);
            resetForm();
            alert("Üyelik başarıyla yenilendi.");
        }
    };

    const handleOpenNoteModal = (member: Member) => {
        setSelectedMember(member);
        setEditNote(member.notes || "");
        setIsNoteModalOpen(true);
    };

    const handleSaveNote = () => {
        if (selectedMember) {
            updateMember(selectedMember.id, { notes: editNote });
            setIsNoteModalOpen(false);
            setSelectedMember(null);
        }
    };

    const openRenewalModal = (member: Member) => {
        setSelectedMember(member);
        // Pre-select current package as default or empty? Let's keep empty to force choice
        setSelectedPackageId("");
        setStartDate(new Date().toISOString().split("T")[0]);
        setIsRenewModalOpen(true);
    };

    const openHistoryModal = (member: Member) => {
        setSelectedMember(member);
        setIsHistoryModalOpen(true);
    };

    const openMeasurementModal = (member: Member) => {
        setSelectedMember(member);
        setIsMeasurementModalOpen(true);
        // Reset measurement form state for new entry
        setWeight(""); setHeight(""); setShoulders(""); setArm("");
        setChest(""); setWaist(""); setHips(""); setLeg("");
    };

    const handleAddMeasurement = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMember) return;

        const newMeasurement: Measurement = {
            date: new Date().toISOString().split("T")[0],
            weight: Number(weight) || 0,
            height: Number(height) || 0,
            shoulders: Number(shoulders) || 0,
            arm: Number(arm) || 0,
            chest: Number(chest) || 0,
            waist: Number(waist) || 0,
            hips: Number(hips) || 0,
            leg: Number(leg) || 0
        };

        const updatedMeasurements = [...(selectedMember.measurements || []), newMeasurement];
        updateMember(selectedMember.id, { measurements: updatedMeasurements });

        // Update local state to reflect change immediately in UI
        setSelectedMember({ ...selectedMember, measurements: updatedMeasurements });

        // Clear form
        setWeight(""); setHeight(""); setShoulders(""); setArm("");
        setChest(""); setWaist(""); setHips(""); setLeg("");
        alert("Ölçüm eklendi!");
    };

    if (!mounted) return <div className="p-8 text-center text-zinc-500">Yükleniyor...</div>;

    // --- RENDER HELPERS ---
    // (Helper functions go here if needed)

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-black">Üyeler</h1>
                    <p className="text-zinc-500 mt-1">Üyelik yönetimi, yenileme ve geçmiş.</p>
                </div>
                <div className="flex gap-3">
                    {canView && (
                        <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
                            <Download size={20} /> Excel&apos;e Aktar
                        </button>
                    )}
                    {canAdd && (
                        <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="btn-primary flex items-center gap-2">
                            <Plus size={20} /> Yeni Üye
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200 text-xs text-zinc-500 font-bold uppercase tracking-wider">
                            <th className="p-4">Ad Soyad</th>
                            <th className="p-4">İletişim</th>
                            <th className="p-4">Sağlık Durumu</th>
                            <th className="p-4">Üyelik Durumu</th>
                            <th className="p-4">Paket</th>
                            <th className="p-4">Bitiş Tarihi</th>
                            <th className="p-4 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {members.map((member: Member) => (
                            <tr key={member.id} className="hover:bg-zinc-50 transition-colors group cursor-pointer" onClick={() => openHistoryModal(member)}>
                                <td className="p-4">
                                    <div className="font-bold text-black">{member.fullName}</div>
                                    <div className="flex gap-2 items-center mt-1">
                                        {member.notes && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">Not Var</span>}
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-zinc-600">
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex items-center gap-2"><Phone size={14} className="text-zinc-400" /> {member.phone}</div>
                                    </div>
                                    {member.email && <div className="flex items-center gap-2 mt-0.5"><Mail size={14} className="text-zinc-400" /> {member.email}</div>}
                                </td>

                                <td className="p-4">
                                    {member.healthProfile ? (
                                        <div className="flex flex-col gap-0.5">
                                            {/* Risk Level Text */}
                                            <span className={`text - xs font - bold ${member.healthProfile.riskLevel === 'high' ? 'text-red-600' :
                                                member.healthProfile.riskLevel === 'medium' ? 'text-orange-600' :
                                                    'text-emerald-600'
                                                } `}>
                                                {member.healthProfile.riskLevel === 'high' ? 'Yüksek Risk' :
                                                    member.healthProfile.riskLevel === 'medium' ? 'Orta Risk' :
                                                        'Düşük Risk'}
                                            </span>

                                            {/* Issues Text */}
                                            <span className="text-[11px] text-zinc-500 max-w-[150px] truncate">
                                                {[
                                                    ...(member.healthProfile.ortho || []),
                                                    ...(member.healthProfile.cardio || []),
                                                    ...(member.healthProfile.metabolic || []),
                                                    ...(member.healthProfile.respiratory || []),
                                                    ...(member.healthProfile.special || [])
                                                ].join(', ') || ((member.healthProfile.riskLevel === 'low' && !member.healthProfile.other) ? 'Sorun Yok' : 'Diğer')}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-zinc-500">{(member as any).branchId || '-'}</span>
                                    )}
                                </td>

                                {/* Membership Status Column */}
                                <td className="p-4">
                                    <span className={`text - xs font - bold ${member.status === 'active' ? 'text-emerald-600' : 'text-red-500'} `}>
                                        {member.status === 'active' ? 'AKTİF' : 'PASİF'}
                                    </span>
                                </td>

                                <td className="p-4">
                                    <div className="text-sm font-medium text-black">
                                        {packages.find((p: Package) => p.id === member.activePackageId)?.name || "Paket Yok"}
                                    </div>
                                    <div className="text-xs text-zinc-500 mt-0.5">Başlangıç: {member.startDate}</div>
                                </td>
                                <td className="p-4">
                                    <div className="text-sm font-bold text-zinc-700">{member.endDate || '-'}</div>
                                    {member.remainingSessions !== undefined && (
                                        <div className="text-xs text-indigo-600 font-medium mt-0.5">
                                            {member.remainingSessions} Ders Kaldı
                                        </div>
                                    )}
                                </td>
                                <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => openRenewalModal(member)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-black text-white text-xs font-bold rounded-lg hover:bg-zinc-800 transition-colors"
                                        >
                                            <RotateCw size={12} /> Yenile
                                        </button>
                                        <button
                                            onClick={() => handleOpenNoteModal(member)}
                                            className="p-1.5 text-zinc-400 hover:text-black hover:bg-zinc-200 rounded-lg transition-colors"
                                            title="Not Düzenle"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => openHistoryModal(member)}
                                            className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Geçmiş"
                                        >
                                            <History size={16} />
                                        </button>
                                        <button
                                            onClick={() => openMeasurementModal(member)}
                                            className="p-1.5 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                            title="Ölçümler"
                                        >
                                            <Activity size={16} />
                                        </button>
                                        <button
                                            onClick={() => { setSelectedMember(member); setIsHealthModalOpen(true); }}
                                            className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Sağlık Bilgisi"
                                        >
                                            <HeartPulse size={16} />
                                        </button>
                                        {canDelete && (
                                            <button
                                                onClick={() => {
                                                    if (window.confirm(`${member.fullName} isimli üyeyi silmek istediğinize emin misiniz ? `)) {
                                                        deleteMember(member.id);
                                                    }
                                                }}
                                                className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Sil"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {members.length === 0 && <div className="p-12 text-center text-zinc-400 italic">Kayıtlı üye bulunamadı.</div>}
            </div>

            {/* --- MODALS --- */}

            {/* 1. CREATE MODAL */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yeni Üye Kaydı" width="600px">
                <form onSubmit={handleCreate} className="space-y-6">
                    {/* Personal Info */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Kişisel Bilgiler</h3>
                        <div className="space-y-3">
                            <input type="text" placeholder="Ad Soyad" value={fullName} onChange={e => setFullName(e.target.value)} className="input-field" required />
                            <div className="grid grid-cols-2 gap-3">
                                <input type="tel" placeholder="Telefon" value={phone} onChange={e => setPhone(e.target.value)} className="input-field" required />
                                <input type="email" placeholder="E-posta" value={email} onChange={e => setEmail(e.target.value)} className="input-field" />
                            </div>
                            <input type="text" placeholder="Grup ID (Opsiyonel)" value={groupId} onChange={e => setGroupId(e.target.value)} className="input-field" />
                        </div>
                    </div>


                    {/* Measurements Section */}
                    <div className="space-y-4 pt-4 border-t border-zinc-100">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Vücut Ölçüleri (Cm / Kg)</h3>
                        <div className="grid grid-cols-4 gap-3">
                            <input type="number" placeholder="Boy (cm)" value={height} onChange={e => setHeight(e.target.value)} className="input-field" />
                            <input type="number" placeholder="Kilo (kg)" value={weight} onChange={e => setWeight(e.target.value)} className="input-field" />
                            <input type="number" placeholder="Omuz" value={shoulders} onChange={e => setShoulders(e.target.value)} className="input-field" />
                            <input type="number" placeholder="Kol" value={arm} onChange={e => setArm(e.target.value)} className="input-field" />
                            <input type="number" placeholder="Göğüs" value={chest} onChange={e => setChest(e.target.value)} className="input-field" />
                            <input type="number" placeholder="Karın" value={waist} onChange={e => setWaist(e.target.value)} className="input-field" />
                            <input type="number" placeholder="Kalça" value={hips} onChange={e => setHips(e.target.value)} className="input-field" />
                            <input type="number" placeholder="Bacak" value={leg} onChange={e => setLeg(e.target.value)} className="input-field" />
                        </div>
                    </div>

                    {/* Membership Details */}
                    <div className="space-y-4 pt-4 border-t border-zinc-100">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Üyelik Detayları</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {/* Service Selection */}
                            <div>
                                <label className="label">Hizmet</label>
                                <select
                                    value={selectedServiceId}
                                    onChange={e => { setSelectedServiceId(e.target.value); setSelectedPackageId(""); }}
                                    className="input-field"
                                    required
                                >
                                    <option value="">Seçiniz</option>
                                    {services.filter((s: Service) => s.isActive).map((s: Service) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>

                            {/* Package Selection (Filtered) */}
                            <div>
                                <label className="label">Paket</label>
                                <select
                                    value={selectedPackageId}
                                    onChange={e => setSelectedPackageId(e.target.value)}
                                    className="input-field"
                                    required
                                    disabled={!selectedServiceId}
                                >
                                    <option value="">{selectedServiceId ? 'Paket Seçiniz' : 'Önce Hizmet Seçin'}</option>
                                    {filteredPackages.map((p: Package) => <option key={p.id} value={p.id}>{p.name} - {p.price} TL</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Package Info View (Auto Calculated) */}
                        {selectedPackageId && (
                            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-sm grid grid-cols-2 gap-4">
                                <div>
                                    <span className="block text-xs font-bold text-indigo-800 uppercase mb-1">Başlangıç</span>
                                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-white border border-indigo-200 rounded px-2 py-1 w-full text-indigo-900 font-medium" required />
                                </div>
                                <div>
                                    <span className="block text-xs font-bold text-indigo-800 uppercase mb-1">Bitiş Tarihi</span>
                                    <div className="bg-white/50 border border-indigo-200 rounded px-2 py-1 text-indigo-900 font-bold">
                                        {(() => {
                                            const d = new Date(startDate);
                                            const pkg = packages.find((p: Package) => p.id === selectedPackageId);
                                            d.setDate(d.getDate() + (pkg?.validityDays || 30));
                                            return d.toLocaleDateString('tr-TR');
                                        })()}
                                    </div>
                                    <div className="text-[10px] text-indigo-500 mt-0.5">
                                        {packages.find((p: Package) => p.id === selectedPackageId)?.validityDays} Gün Geçerli
                                    </div>
                                </div>

                                {packages.find((p: Package) => p.id === selectedPackageId)?.type === 'DERS_PAKETI' && (
                                    <div className="col-span-2 border-t border-indigo-200 pt-2 mt-1">
                                        <span className="block text-xs font-bold text-indigo-800 uppercase mb-1">Ders Hakkı</span>
                                        <div className="font-bold text-indigo-900">
                                            {packages.find((p: Package) => p.id === selectedPackageId)?.sessionCount} Ders
                                        </div>
                                        <p className="text-[10px] text-indigo-600 italic mt-1">
                                            * Süre dolarsa ({packages.find((p: Package) => p.id === selectedPackageId)?.validityDays} gün), kalan dersler yanar.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Group Selection - Show only if Group Format is selected */}
                        {packages.find((p: Package) => p.id === selectedPackageId)?.sessionFormat === 'GRUP' && (
                            <div className="grid grid-cols-2 gap-3 mt-3 bg-white p-3 rounded-lg border border-zinc-200">
                                <div>
                                    <label className="label text-zinc-800">Ders Günleri</label>
                                    <select value={groupSchedule} onChange={e => setGroupSchedule(e.target.value as GroupSchedule)} className="input-field" required>
                                        <option value="">Seçiniz</option>
                                        <option value="MWF">Pazartesi - Çarşamba - Cuma</option>
                                        <option value="TTS">Salı - Perşembe - Cumartesi</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label text-zinc-800">Saat</label>
                                    <select value={groupTime} onChange={e => setGroupTime(e.target.value)} className="input-field" required>
                                        <option value="">Seçiniz</option>
                                        <option value="09:00">09:00</option>
                                        <option value="10:00">10:00</option>
                                        <option value="11:00">11:00</option>
                                        <option value="12:00">12:00</option>
                                        <option value="18:00">18:00</option>
                                        <option value="19:00">19:00</option>
                                        <option value="20:00">20:00</option>
                                        <option value="21:00">21:00</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Payment */}
                    <div className="space-y-4 pt-4 border-t border-zinc-100">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Ödeme</h3>
                        <div className="flex p-1 bg-zinc-100 rounded-lg">
                            <button type="button" onClick={() => setPaymentType("cash")} className={`flex - 1 py - 2 text - sm font - bold rounded - md transition - all ${paymentType === "cash" ? "bg-white shadow-sm text-emerald-600" : "text-zinc-500"} `}>Nakit</button>
                            <button type="button" onClick={() => setPaymentType("card")} className={`flex - 1 py - 2 text - sm font - bold rounded - md transition - all ${paymentType === "card" ? "bg-white shadow-sm text-indigo-600" : "text-zinc-500"} `}>Kredi Kartı</button>
                        </div>

                        {paymentType === "card" && (
                            <select value={installments} onChange={e => setInstallments(Number(e.target.value))} className="input-field">
                                {commissionRates.map((c: CommissionRate) => <option key={c.installments} value={c.installments}>{c.installments === 1 ? 'Tek Çekim' : `${c.installments} Taksit`} {c.rate > 0 && `(+% ${c.rate})`}</option>)}
                            </select>
                        )}

                        <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 flex justify-between items-center">
                            <span className="text-sm font-medium text-zinc-500">Toplam Tutar:</span>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={finalPrice}
                                    placeholder={Math.round(calculatedPrice).toString()}
                                    onChange={(e) => setFinalPrice(e.target.value === '' ? '' : Number(e.target.value))}
                                    className="w-24 text-right p-1 border border-zinc-300 rounded font-bold text-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                                <span className="text-xl font-bold">TL</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 btn-secondary">İptal</button>
                        <button type="submit" className="flex-1 btn-primary">Kaydet</button>
                    </div>
                </form>
            </Modal>

            {/* 2. NOTE MODAL */}
            <Modal isOpen={isNoteModalOpen} onClose={() => setIsNoteModalOpen(false)} title="Not Düzenle" width="400px">
                <div className="space-y-4">
                    <textarea
                        value={editNote}
                        onChange={e => setEditNote(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-sm min-h-[120px] focus:ring-2 focus:ring-black focus:outline-none resize-none"
                        placeholder="Notlar..."
                    />
                    <div className="flex gap-3">
                        <button onClick={() => setIsNoteModalOpen(false)} className="flex-1 btn-secondary">İptal</button>
                        <button onClick={handleSaveNote} className="flex-1 btn-primary">Kaydet</button>
                    </div>
                </div>
            </Modal>

            {/* 3. RENEWAL MODAL */}
            <Modal isOpen={isRenewModalOpen} onClose={() => setIsRenewModalOpen(false)} title="Üyelik Yenileme" width="500px">
                <form onSubmit={handleRenewSubmit} className="space-y-6">
                    <p className="text-zinc-500 text-sm -mt-4">{selectedMember?.fullName} için yeni paket satışı.</p>

                    <div className="space-y-4">
                        {/* Service Selection */}
                        <div>
                            <label className="label">Hizmet</label>
                            <select
                                value={selectedServiceId}
                                onChange={e => { setSelectedServiceId(e.target.value); setSelectedPackageId(""); }}
                                className="input-field"
                                required
                            >
                                <option value="">Seçiniz</option>
                                {services.filter((s: Service) => s.isActive).map((s: Service) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        {/* Package Selection */}
                        <div>
                            <label className="label">Paket</label>
                            <select value={selectedPackageId} onChange={e => setSelectedPackageId(e.target.value)} className="input-field" required disabled={!selectedServiceId}>
                                <option value="">Önce Hizmet Seçiniz</option>
                                {packages.filter((p: Package) => p.serviceId === selectedServiceId && p.isActive).map((p: Package) => (
                                    <option key={p.id} value={p.id}>{p.name} - {p.price} TL</option>
                                ))}
                            </select>
                        </div>

                        {/* Package Details Info Box */}
                        {selectedPackageId && (
                            <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 flex gap-4 text-xs text-indigo-800">
                                {packages.find((p: Package) => p.id === selectedPackageId)?.validityDays && (
                                    <div className="flex items-center gap-1">
                                        <span className="font-bold">Süre:</span>
                                        {packages.find((p: Package) => p.id === selectedPackageId)?.validityDays} Gün
                                    </div>
                                )}
                                {packages.find((p: Package) => p.id === selectedPackageId)?.sessionCount && (
                                    <div className="flex items-center gap-1">
                                        <span className="font-bold">Ders:</span>
                                        {packages.find((p: Package) => p.id === selectedPackageId)?.sessionCount} Adet
                                    </div>
                                )}
                            </div>
                        )}

                        <div>
                            <label className="label">Başlangıç Tarihi</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-field" required />
                            {/* Auto-calc End Date Display */}
                            {selectedPackageId && packages.find((p: Package) => p.id === selectedPackageId)?.validityDays && startDate && (
                                <p className="text-xs text-zinc-400 mt-1">
                                    Bitiş Tarihi: <span className="font-medium text-zinc-600">
                                        {(() => {
                                            const d = new Date(startDate);
                                            d.setDate(d.getDate() + (packages.find((p: Package) => p.id === selectedPackageId)?.validityDays || 0));
                                            return d.toLocaleDateString('tr-TR');
                                        })()}
                                    </span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Payment Section (Reused) */}
                    <div className="space-y-4 pt-4 border-t border-zinc-100">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Ödeme</h3>
                        <div className="flex p-1 bg-zinc-100 rounded-lg">
                            <button type="button" onClick={() => setPaymentType("cash")} className={`flex - 1 py - 2 text - sm font - bold rounded - md transition - all ${paymentType === "cash" ? "bg-white shadow-sm text-emerald-600" : "text-zinc-500"} `}>Nakit</button>
                            <button type="button" onClick={() => setPaymentType("card")} className={`flex - 1 py - 2 text - sm font - bold rounded - md transition - all ${paymentType === "card" ? "bg-white shadow-sm text-indigo-600" : "text-zinc-500"} `}>Kredi Kartı</button>
                        </div>

                        {paymentType === "card" && (
                            <select value={installments} onChange={e => setInstallments(Number(e.target.value))} className="input-field">
                                {commissionRates.map((c: CommissionRate) => <option key={c.installments} value={c.installments}>{c.installments === 1 ? 'Tek Çekim' : `${c.installments} Taksit`} {c.rate > 0 && `(+% ${c.rate})`}</option>)}
                            </select>
                        )}

                        <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 flex justify-between items-center">
                            <span className="text-sm font-medium text-zinc-500">Toplam Tutar:</span>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={finalPrice}
                                    placeholder={Math.round(calculatedPrice).toString()}
                                    onChange={(e) => setFinalPrice(e.target.value === '' ? '' : Number(e.target.value))}
                                    className="w-24 text-right p-1 border border-zinc-300 rounded font-bold text-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                                <span className="text-xl font-bold">TL</span>
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="btn-primary w-full">Yenile ve Kaydet</button>
                </form>
            </Modal>

            {/* 4. HISTORY MODAL */}
            <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title="Üyelik Geçmişi" width="600px">
                <div className="space-y-6">
                    <p className="text-zinc-500 text-xs -mt-4 border-b border-zinc-100 pb-4">{selectedMember?.fullName}</p>

                    {/* Current Membership */}
                    <div>
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Mevcut Üyelik</h3>
                        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex justify-between items-center">
                            <div>
                                <div className="font-bold text-emerald-900">{packages.find((p: Package) => p.id === selectedMember?.activePackageId)?.name || 'Paket adı bulunamadı'}</div>
                                <div className="text-xs text-emerald-700 mt-1">Başlangıç: {selectedMember?.startDate} • Bitiş: {selectedMember?.endDate || 'Süresiz'}</div>
                            </div>
                            <div className="text-emerald-600 font-bold bg-white px-3 py-1 rounded-lg shadow-sm text-sm">Aktif</div>
                        </div>
                    </div>

                    {/* History List */}
                    <div>
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Geçmiş Satın Almalar</h3>
                        {(!selectedMember?.history || selectedMember.history.length === 0) ? (
                            <div className="text-center py-6 text-zinc-400 text-sm italic border-2 border-dashed border-zinc-100 rounded-xl">Geçmiş kayıt bulunamadı.</div>
                        ) : (
                            <div className="space-y-3">
                                {selectedMember.history.slice().reverse().map((item: MembershipHistoryItem, idx: number) => (
                                    <div key={idx} className="bg-white border border-zinc-200 p-3 rounded-lg flex justify-between items-center hover:bg-zinc-50 transition-colors">
                                        <div>
                                            <div className="font-bold text-zinc-800 text-sm">{item.packageName}</div>
                                            <div className="text-xs text-zinc-500 mt-0.5">
                                                {item.startDate} - {item.endDate}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-black text-sm">{item.pricePaid} TL</div>
                                            <div className="text-[10px] text-zinc-400">İşlem: {new Date(item.purchaseDate).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* 5. MEASUREMENT MODAL */}
            <Modal isOpen={isMeasurementModalOpen} onClose={() => setIsMeasurementModalOpen(false)} title="Vücut Ölçümleri" width="700px">
                <div className="space-y-6">
                    <p className="text-zinc-500 text-xs -mt-4 border-b border-zinc-100 pb-4">{selectedMember?.fullName}</p>

                    {/* New Measurement Form */}
                    <form onSubmit={handleAddMeasurement} className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Yeni Ölçüm Ekle</h3>
                        <div className="grid grid-cols-4 gap-3 mb-3">
                            <input type="number" placeholder="Kilo (kg)" value={weight} onChange={e => setWeight(e.target.value)} className="input-field" required />
                            <input type="number" placeholder="Boy (cm)" value={height} onChange={e => setHeight(e.target.value)} className="input-field" />
                            <input type="number" placeholder="Omuz" value={shoulders} onChange={e => setShoulders(e.target.value)} className="input-field" />
                            <input type="number" placeholder="Kol" value={arm} onChange={e => setArm(e.target.value)} className="input-field" />
                            <input type="number" placeholder="Göğüs" value={chest} onChange={e => setChest(e.target.value)} className="input-field" />
                            <input type="number" placeholder="Karın" value={waist} onChange={e => setWaist(e.target.value)} className="input-field" />
                            <input type="number" placeholder="Kalça" value={hips} onChange={e => setHips(e.target.value)} className="input-field" />
                            <input type="number" placeholder="Bacak" value={leg} onChange={e => setLeg(e.target.value)} className="input-field" />
                        </div>
                        <button type="submit" className="w-full btn-primary py-2 text-xs">Kaydet</button>
                    </form>

                    {/* Measurement History */}
                    <div>
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Geçmiş Ölçümler</h3>
                        {(!selectedMember?.measurements || selectedMember.measurements.length === 0) ? (
                            <div className="text-center py-6 text-zinc-400 text-sm italic border-2 border-dashed border-zinc-100 rounded-xl">Kayıtlı ölçüm yok.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-zinc-100 text-zinc-500 text-xs uppercase">
                                            <th className="p-2 rounded-l-lg">Tarih</th>
                                            <th className="p-2">Kilo</th>
                                            <th className="p-2">Boy</th>
                                            <th className="p-2">Omuz</th>
                                            <th className="p-2">Kol</th>
                                            <th className="p-2">Göğüs</th>
                                            <th className="p-2">Karın</th>
                                            <th className="p-2">Kalça</th>
                                            <th className="p-2 rounded-r-lg">Bacak</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                        {selectedMember.measurements.slice().reverse().map((m: Measurement, i: number) => (
                                            <tr key={i} className="hover:bg-zinc-50">
                                                <td className="p-2 font-bold text-zinc-700">{m.date}</td>
                                                <td className="p-2">{m.weight}</td>
                                                <td className="p-2">{m.height}</td>
                                                <td className="p-2">{m.shoulders}</td>
                                                <td className="p-2">{m.arm}</td>
                                                <td className="p-2">{m.chest}</td>
                                                <td className="p-2">{m.waist}</td>
                                                <td className="p-2">{m.hips}</td>
                                                <td className="p-2">{m.leg}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* 6. HEALTH DETAILS MODAL (View/Edit) */}
            <Modal isOpen={isHealthModalOpen} onClose={() => setIsHealthModalOpen(false)} title="Sağlık Değerlendirmesi" width="700px">
                {selectedMember && (
                    <div className="space-y-4">
                        <HealthForm
                            initialData={selectedMember.healthProfile}
                            readOnly={!canEdit}
                            onChange={(newData: HealthProfile) => {
                                // Real-time update
                                updateMember(selectedMember.id, { healthProfile: newData });
                                setSelectedMember({ ...selectedMember, healthProfile: newData });
                            }}
                        />
                        <button onClick={() => setIsHealthModalOpen(false)} className="w-full btn-primary">Kapat</button>
                    </div>
                )}
            </Modal>
            {/* Custom Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
    .input - field {
    width: 100 %;
    background - color: #f4f4f5;
    border: 1px solid #e4e4e7;
    border - radius: 0.5rem;
    padding: 0.75rem;
    color: black;
    outline: none;
    font - size: 0.875rem;
    transition: all 0.2s;
}
                .input - field:focus {
    ring: 2px;
    ring - color: black;
}
                .label {
    display: block;
    font - size: 0.75rem;
    font - weight: 700;
    color: #71717a;
    margin - bottom: 0.375rem;
    text - transform: uppercase;
}
                .btn - primary {
    background - color: black;
    color: white;
    font - weight: 700;
    padding: 0.75rem 1rem;
    border - radius: 0.75rem;
    transition: all 0.2s;
    box - shadow: 0 10px 15px - 3px rgba(0, 0, 0, 0.1);
    font - size: 0.875rem;
}
                .btn - primary:hover {
    background - color: #27272a;
}
                .btn - secondary {
    background - color: #f4f4f5;
    color: #3f3f46;
    font - weight: 700;
    padding: 0.75rem 1rem;
    border - radius: 0.75rem;
    transition: all 0.2s;
    font - size: 0.875rem;
}
                .btn - secondary:hover {
    background - color: #e4e4e7;
}
`}} />
        </div>
    );
}

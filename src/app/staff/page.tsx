"use client";

import { useGym, Member, Package, MembershipHistoryItem, GroupSchedule, Measurement, HealthProfile, Service, CommissionRate, Branch, Staff, Role } from "@/context/GymContext";
import { useState, useEffect } from "react";
import { Plus, Trash2, UserCog, Shield, Activity, Stethoscope, Utensils, Lock, Edit2, Phone, Mail, Calendar, ChevronDown, Check, Briefcase, Percent } from "lucide-react";
import { createPortal } from "react-dom";

// Helper for Role Icons/Colors
const getRoleDetails = (role: Role) => {
    switch (role) {
        case 'admin': return { icon: Lock, color: 'text-red-500', bg: 'bg-red-50 border-red-200', label: 'Admin' };
        case 'manager': return { icon: Shield, color: 'text-purple-500', bg: 'bg-purple-50 border-purple-200', label: 'Yönetici' };
        case 'trainer': return { icon: Activity, color: 'text-indigo-500', bg: 'bg-indigo-50 border-indigo-200', label: 'Antrenör' };
        case 'physio': return { icon: Stethoscope, color: 'text-teal-500', bg: 'bg-teal-50 border-teal-200', label: 'Fizyoterapist' };
        case 'dietitian': return { icon: Utensils, color: 'text-green-500', bg: 'bg-green-50 border-green-200', label: 'Diyetisyen' };
        default: return { icon: UserCog, color: 'text-gray-500', bg: 'bg-gray-50', label: 'Personel' };
    }
}

const ALL_BRANCHES: Branch[] = ["fitness", "reformer", "pilates", "yoga", "functional", "cardio", "boxing", "swimming"];

type PaymentModel = 'salaried' | 'commission' | 'partner';

export default function StaffPage() {
    const { staff, addStaff, updateStaff, deleteStaff, currentUser, hasPermission } = useGym();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    // Permission Check
    const canManageAll = hasPermission("manage_staff");

    // Form State
    const [name, setName] = useState("");
    const [role, setRole] = useState<Role>("trainer");
    const [gender, setGender] = useState<"male" | "female">("male");
    const [selectedBranches, setSelectedBranches] = useState<Branch[]>([]);
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [birthDate, setBirthDate] = useState("");

    // Payment Config State
    const [paymentModel, setPaymentModel] = useState<PaymentModel>('commission');
    const [salaryAmount, setSalaryAmount] = useState(0);
    const [commissionRate, setCommissionRate] = useState(0);
    const [profitShareRate, setProfitShareRate] = useState(0);

    const handleBranchToggle = (branch: Branch) => {
        if (selectedBranches.includes(branch)) {
            setSelectedBranches(selectedBranches.filter(b => b !== branch));
        } else {
            setSelectedBranches([...selectedBranches, branch]);
        }
    };

    const openCreateModal = () => {
        setEditingId(null);
        setName("");
        setRole("trainer");
        setGender("male");
        setSelectedBranches([]);
        setEmail("");
        setPhone("");
        setBirthDate("");

        // Defaults
        setPaymentModel('commission');
        setSalaryAmount(0);
        setCommissionRate(0);
        setProfitShareRate(0);

        setIsModalOpen(true);
    };

    const openEditModal = (s: Staff) => {
        setEditingId(s.id);
        setName(s.name);
        setRole(s.role);
        setGender(s.gender);
        setSelectedBranches(s.branches);
        setEmail(s.email || "");
        setPhone(s.phone || "");
        setBirthDate(s.birthDate || "");

        // Load Payment Config
        const config = s.paymentConfig || { model: 'commission' };
        setPaymentModel(config.model);
        setSalaryAmount(config.salaryAmount || 0);
        setCommissionRate(config.commissionRate || s.commissionRate || 0); // fallback to old prop
        setProfitShareRate(config.profitShareRate || 0);

        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const paymentConfig = {
            model: paymentModel,
            salaryAmount: paymentModel === 'salaried' ? salaryAmount : 0,
            commissionRate: (paymentModel === 'commission' || paymentModel === 'salaried') ? commissionRate : 0, // Allow commission for salaried too? Maybe not based on strict types request. Sticking to primary.
            profitShareRate: paymentModel === 'partner' ? profitShareRate : 0
        };

        const baseData: any = {
            name,
            role,
            gender,
            commissionRate: paymentConfig.commissionRate, // Keep for backward compatibility
            branches: (['trainer', 'physio', 'manager', 'admin'].includes(role)) ? selectedBranches : [],
            email,
            phone,
            birthDate,
            paymentConfig
        };

        if (editingId) {
            updateStaff(editingId, baseData);
        } else {
            addStaff(baseData);
        }
        setIsModalOpen(false);
    };

    const isRoleEditable = canManageAll;

    // Portal Modal
    const Modal = mounted ? createPortal(
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                zIndex: 999999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(2px)'
            }}
        >
            <div
                style={{
                    backgroundColor: 'white',
                    width: '100%',
                    maxWidth: '600px',
                    padding: '24px',
                    borderRadius: '16px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    border: '1px solid #e4e4e7',
                    maxHeight: '90vh',
                    overflowY: 'auto'
                }}
            >
                <h2 className="text-lg font-bold text-black mb-6">{editingId ? "Bilgileri Düzenle" : "Yeni Personel Ekle"}</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                    {/* Left Column: Personal Info */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase border-b border-zinc-100 pb-2 mb-2">Kişisel Bilgiler</h3>
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">Ad Soyad</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-black focus:outline-none focus:border-indigo-500 focus:bg-white text-sm"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">Rol</label>
                            <select
                                value={role}
                                onChange={e => setRole(e.target.value as Role)}
                                disabled={!isRoleEditable}
                                className={`w - full border border - zinc - 200 rounded - lg p - 2.5 text - black text - sm focus: outline - none focus: border - indigo - 500 ${!isRoleEditable ? 'bg-zinc-200 text-zinc-500' : 'bg-zinc-50 focus:bg-white'} `}
                            >
                                <option value="admin">Admin</option>
                                <option value="manager">Yönetici</option>
                                <option value="trainer">Antrenör</option>
                                <option value="physio">Fizyoterapist</option>
                                <option value="dietitian">Diyetisyen</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">Cinsiyet</label>
                            <select
                                value={gender}
                                onChange={e => setGender(e.target.value as "male" | "female")}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-black focus:outline-none focus:border-indigo-500 focus:bg-white text-sm"
                            >
                                <option value="male">Erkek</option>
                                <option value="female">Kadın</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">Doğum Tarihi</label>
                            <input
                                type="date"
                                value={birthDate}
                                onChange={e => setBirthDate(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-black focus:outline-none focus:border-indigo-500 focus:bg-white text-sm"
                            />
                        </div>
                    </div>

                    {/* Right Column: Contact & Employment */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase border-b border-zinc-100 pb-2 mb-2">İletişim & Ödeme</h3>
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">E-posta</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-black focus:outline-none focus:border-indigo-500 focus:bg-white text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">Telefon</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-black focus:outline-none focus:border-indigo-500 focus:bg-white text-sm"
                            />
                        </div>

                        {canManageAll && (
                            <div className="col-span-2 pt-2">
                                <label className="block text-xs font-medium text-zinc-700 mb-1">Ödeme Modeli</label>
                                <div className="grid grid-cols-3 gap-2 mb-3">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentModel('partner')}
                                        className={`p - 2 rounded border text - xs font - medium text - center transition - colors ${paymentModel === 'partner' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-zinc-200 text-zinc-600'} `}
                                    >
                                        Ortak (Kâr Payı)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentModel('commission')}
                                        className={`p - 2 rounded border text - xs font - medium text - center transition - colors ${paymentModel === 'commission' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-zinc-200 text-zinc-600'} `}
                                    >
                                        Prim (Hizmet)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentModel('salaried')}
                                        className={`p - 2 rounded border text - xs font - medium text - center transition - colors ${paymentModel === 'salaried' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-zinc-200 text-zinc-600'} `}
                                    >
                                        Ücretli (Maaş)
                                    </button>
                                </div>

                                {/* Dynamic Fields based on Model */}
                                {paymentModel === 'partner' && (
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-700 mb-1 flex justify-between">
                                            <span>Ortaklık Payı (%)</span>
                                            <span className="text-zinc-400">Net Kâr Üzerinden</span>
                                        </label>
                                        <input
                                            type="number"
                                            value={profitShareRate}
                                            onChange={e => setProfitShareRate(Number(e.target.value))}
                                            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-black focus:outline-none focus:border-indigo-500 focus:bg-white text-sm"
                                        />
                                    </div>
                                )}

                                {paymentModel === 'commission' && (
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-700 mb-1">Hizmet Primi (%)</label>
                                        <input
                                            type="number"
                                            value={commissionRate}
                                            onChange={e => setCommissionRate(Number(e.target.value))}
                                            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-black focus:outline-none focus:border-indigo-500 focus:bg-white text-sm"
                                        />
                                    </div>
                                )}

                                {paymentModel === 'salaried' && (
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-700 mb-1">Aylık Maaş (TL)</label>
                                        <input
                                            type="number"
                                            value={salaryAmount}
                                            onChange={e => setSalaryAmount(Number(e.target.value))}
                                            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-black focus:outline-none focus:border-indigo-500 focus:bg-white text-sm"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {(['trainer', 'physio', 'manager', 'admin'].includes(role)) && (
                            <div className="col-span-2 pt-2">
                                <label className="block text-xs font-medium text-zinc-700 mb-2">Branşlar</label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        disabled={!isRoleEditable}
                                        onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
                                        className={`w - full flex items - center justify - between bg - zinc - 50 border border - zinc - 200 rounded - lg p - 2.5 text - sm transition - all
                                            ${!isRoleEditable ? 'opacity-50 cursor-not-allowed bg-zinc-100' : 'hover:bg-zinc-100 focus:bg-white focus:border-indigo-500'}
`}
                                    >
                                        <span className={selectedBranches.length === 0 ? "text-zinc-500" : "text-black"}>
                                            {selectedBranches.length > 0
                                                ? `${selectedBranches.length} Seçim: ${selectedBranches.map(b => b.charAt(0).toUpperCase() + b.slice(1)).join(", ").substring(0, 30)}${selectedBranches.join(", ").length > 30 ? "..." : ""} `
                                                : "Branş Seçiniz"
                                            }
                                        </span>
                                        <ChevronDown size={16} className="text-zinc-400" />
                                    </button>

                                    {/* Dropdown Options */}
                                    {isBranchDropdownOpen && (
                                        <>
                                            <div className="fixed inset-0 z-[100]" onClick={() => setIsBranchDropdownOpen(false)}></div>
                                            <div className="absolute top-full left-0 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-xl z-[101] max-h-[150px] overflow-y-auto">
                                                {ALL_BRANCHES.map(branch => {
                                                    const isSelected = selectedBranches.includes(branch);
                                                    return (
                                                        <button
                                                            key={branch}
                                                            type="button"
                                                            onClick={() => handleBranchToggle(branch)}
                                                            className={`w - full text - left px - 3 py - 2 text - sm flex items - center justify - between hover: bg - zinc - 50 transition - colors
                                                                ${isSelected ? "bg-indigo-50 text-indigo-700" : "text-zinc-700"}
`}
                                                        >
                                                            <span className="capitalize font-medium">{branch}</span>
                                                            {isSelected && <Check size={16} />}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 mt-8 col-span-2">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 py-2.5 rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors text-sm font-medium"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            className="flex-1 btn-primary py-2.5 text-sm"
                        >
                            {editingId ? "Güncelle" : "Kaydet"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-black">Personel</h1>
                    <p className="text-zinc-500 mt-1">Eğitmenler ve çalışan kadrosu.</p>
                </div>
                {canManageAll && (
                    <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
                        <Plus size={20} /> Yeni Personel
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {staff.map((employee: Staff) => {
                    const roleDetails = getRoleDetails(employee.role);
                    const RoleIcon = roleDetails.icon;
                    // Edit Permission: Manage All OR Self
                    const canEditThis = canManageAll || (currentUser?.id === employee.id);
                    const payConf = employee.paymentConfig || { model: 'commission' };

                    return (
                        <div key={employee.id} className="bg-white border border-zinc-200 rounded-xl p-6 relative group shadow-sm hover:shadow-md transition-shadow">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {canEditThis && (
                                    <button
                                        onClick={() => openEditModal(employee)}
                                        className="text-zinc-400 hover:text-indigo-600 p-1"
                                        title="Düzenle"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                )}
                                {canManageAll && (
                                    <button
                                        onClick={() => deleteStaff(employee.id)}
                                        className="text-zinc-400 hover:text-red-500 p-1"
                                        title="Sil"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-4 mb-4">
                                <div className={`w - 12 h - 12 rounded - full flex items - center justify - center border ${roleDetails.bg} ${roleDetails.color} `}>
                                    <RoleIcon size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-black text-lg">{employee.name}</h3>
                                    <span className={`text - xs font - medium px - 2 py - 0.5 rounded border ${roleDetails.bg} ${roleDetails.color} `}>
                                        {roleDetails.label}
                                    </span>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="space-y-3 mt-4">
                                {(employee.email || employee.phone) && (
                                    <div className="text-xs text-zinc-600 space-y-1">
                                        {employee.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail size={12} className="text-zinc-400" />
                                                <span>{employee.email}</span>
                                            </div>
                                        )}
                                        {employee.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone size={12} className="text-zinc-400" />
                                                <span>{employee.phone}</span>
                                            </div>
                                        )}
                                        {employee.birthDate && (
                                            <div className="flex items-center gap-2">
                                                <Calendar size={12} className="text-zinc-400" />
                                                <span>{employee.birthDate}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="pt-2 border-t border-zinc-50 space-y-2">
                                    {/* Payment Model Badge */}
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-zinc-500">Çalışma Modeli:</span>
                                        <span className="font-bold text-black capitalize flex items-center gap-1">
                                            {payConf.model === 'partner' && <><Percent size={12} className="text-blue-500" /> Ortak</>}
                                            {payConf.model === 'commission' && <><Activity size={12} className="text-indigo-500" /> Prim</>}
                                            {payConf.model === 'salaried' && <><Briefcase size={12} className="text-emerald-500" /> Ücretli</>}
                                        </span>
                                    </div>

                                    {/* Details */}
                                    <div className="bg-zinc-50 rounded p-2 text-xs text-zinc-600">
                                        {payConf.model === 'partner' && (
                                            <div className="flex justify-between">
                                                <span>Kâr Payı:</span>
                                                <span className="font-bold text-black">%{payConf.profitShareRate}</span>
                                            </div>
                                        )}
                                        {payConf.model === 'commission' && (
                                            <div className="flex justify-between">
                                                <span>Prim:</span>
                                                <span className="font-bold text-black">%{payConf.commissionRate}</span>
                                            </div>
                                        )}
                                        {payConf.model === 'salaried' && (
                                            <div className="flex justify-between">
                                                <span>Maaş:</span>
                                                <span className="font-bold text-black">{payConf.salaryAmount} ₺</span>
                                            </div>
                                        )}
                                    </div>

                                    {(['trainer', 'physio', 'manager', 'admin'].includes(employee.role) && employee.branches?.length > 0) && (
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {employee.branches?.map((branch: Branch) => (
                                                <span key={branch} className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200 capitalize">
                                                    {branch}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {isModalOpen && Modal}
        </div>
    );
}

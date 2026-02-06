"use client";

import { useGym, Appointment, Branch, Member, Staff, Package } from "@/context/GymContext";
import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus, Clock, Trash2 } from "lucide-react";
import { createPortal } from "react-dom";

// Helper to get the start of the current week (Monday)
const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
};

const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

const formatDate = (date: Date) => date.toISOString().split('T')[0];

const TIME_SLOTS = [
    "09:00", "10:00", "11:00", "12:00", "13:00", "14:00",
    "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"
];

const DAYS_OF_WEEK = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

const ACTIVITY_TYPES: Branch[] = ["fitness", "reformer", "pilates", "yoga", "functional", "cardio", "boxing", "swimming"];

export default function SchedulePage() {
    const { trainers, members, appointments, addAppointment, cancelAppointment, updateAppointment, hasPermission, packages } = useGym();
    const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));
    const [selectedTrainerId, setSelectedTrainerId] = useState<string>("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    // Permissions
    const canView = hasPermission("view_schedule");
    const canAdd = hasPermission("add_appointment");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [modalData, setModalData] = useState<{
        date: string; // YYYY-MM-DD
        time: string; // HH:MM
        memberId: string;
        trainerId: string;
        type: string;
        description: string;
    }>({
        date: "",
        time: "",
        memberId: "",
        trainerId: "",
        type: "fitness",
        description: ""
    });

    // Generate days for the current view
    const weekDays = useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => {
            const date = addDays(currentWeekStart, i);
            return {
                name: DAYS_OF_WEEK[i],
                date: formatDate(date),
                displayDate: date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
            };
        });
    }, [currentWeekStart]);

    // Navigation Handlers
    const prevWeek = () => setCurrentWeekStart(addDays(currentWeekStart, -7));
    const nextWeek = () => setCurrentWeekStart(addDays(currentWeekStart, 7));
    const goToday = () => setCurrentWeekStart(getStartOfWeek(new Date()));

    // Handlers
    const handleEmptyCellClick = (date: string, time: string) => {
        if (!canAdd) return;
        setEditingId(null);
        setModalData({
            date,
            time,
            memberId: "",
            trainerId: selectedTrainerId || "",
            type: "fitness",
            description: ""
        });
        setIsModalOpen(true);
    };

    const handleAppointmentClick = (e: React.MouseEvent, appointment: Appointment) => {
        e.stopPropagation(); // Prevent cell click
        if (!canAdd) return;

        setEditingId(appointment.id);

        setModalData({
            date: appointment.date,
            time: appointment.time,
            memberId: appointment.memberId,
            trainerId: appointment.trainerId,
            type: appointment.type,
            description: appointment.description || ""
        });
        setIsModalOpen(true);
    };

    const updateTypeForMember = (memberId: string) => {
        const member = members.find((m: Member) => m.id === memberId);
        if (member && member.activePackageId) {
            const pkg = packages.find((p: Package) => p.id === member.activePackageId);
            if (pkg && pkg.branch) {
                setModalData(prev => ({ ...prev, memberId, type: pkg.branch as string }));
                return;
            }
        }
        setModalData(prev => ({ ...prev, memberId }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!modalData.memberId || !modalData.trainerId) {
            alert("Lütfen üye ve eğitmen seçiniz.");
            return;
        }

        if (editingId) {
            // Update Existing
            updateAppointment(editingId, {
                memberId: modalData.memberId,
                trainerId: modalData.trainerId,
                date: modalData.date,
                time: modalData.time,
                type: modalData.type as Branch,
                description: modalData.description,
                status: 'scheduled'
            });
        } else {
            // Create New
            const selectedMember = members.find((m: Member) => m.id === modalData.memberId);
            const selectedPackage = selectedMember?.activePackageId ? packages.find((p: Package) => p.id === selectedMember.activePackageId) : null;

            // Check if it's a group/duet session
            if (selectedMember?.groupId && selectedPackage && selectedPackage.sessionFormat !== 'BIREYSEL') {
                const groupMembers = members.filter((m: Member) => m.groupId === selectedMember.groupId);
                groupMembers.forEach((m: Member) => {
                    addAppointment({
                        memberId: m.id,
                        trainerId: modalData.trainerId,
                        date: modalData.date,
                        time: modalData.time,
                        type: modalData.type as Branch,
                        description: modalData.description
                    });
                });
            } else {
                addAppointment({
                    memberId: modalData.memberId,
                    trainerId: modalData.trainerId,
                    date: modalData.date,
                    time: modalData.time,
                    type: modalData.type as Branch,
                    description: modalData.description
                });
            }
        }
        setIsModalOpen(false);
    };

    const handleCancel = () => {
        if (editingId && confirm("Bu randevuyu İPTAL etmek istediğinize emin misiniz? (Ders sayısı düşülecektir)")) {
            cancelAppointment(editingId);
            setIsModalOpen(false);
        }
    };

    if (!canView) {
        return (
            <div className="flex h-[50vh] items-center justify-center text-zinc-500">
                <p>Bu sayfayı görüntüleme yetkiniz yok.</p>
            </div>
        );
    }

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
            onClick={() => setIsModalOpen(false)}
        >
            <div
                style={{
                    backgroundColor: 'white',
                    width: '100%',
                    maxWidth: '450px',
                    padding: '24px',
                    borderRadius: '16px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    border: '1px solid #e4e4e7',
                }}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-black">
                        {editingId ? "Randevu Düzenle" : "Randevu Oluştur"}
                    </h2>
                    {editingId && (
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors flex items-center gap-1 text-xs font-semibold"
                            title="İptal Et"
                        >
                            <Trash2 size={16} />
                            İPTAL ET
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">Tarih</label>
                            <input
                                type="date"
                                required
                                value={modalData.date}
                                onChange={e => setModalData({ ...modalData, date: e.target.value })}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-black focus:outline-none focus:border-indigo-500 focus:bg-white text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">Saat</label>
                            <select
                                value={modalData.time}
                                onChange={e => setModalData({ ...modalData, time: e.target.value })}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-black focus:outline-none focus:border-indigo-500 focus:bg-white text-sm"
                            >
                                <option value="">Seçiniz</option>
                                {TIME_SLOTS.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">Üye</label>
                            <select
                                value={modalData.memberId}
                                onChange={e => updateTypeForMember(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-black focus:outline-none focus:border-indigo-500 focus:bg-white text-sm"
                                required
                            >
                                <option value="">Üye Seçiniz</option>
                                {members.map((m: Member) => (
                                    <option key={m.id} value={m.id}>{m.fullName}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">Eğitmen</label>
                            <select
                                value={modalData.trainerId}
                                onChange={e => setModalData({ ...modalData, trainerId: e.target.value })}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-black focus:outline-none focus:border-indigo-500 focus:bg-white text-sm"
                                required
                            >
                                <option value="">Eğitmen Seçiniz</option>
                                {trainers.map((t: Staff) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">Ders Tipi</label>
                        <select
                            value={modalData.type}
                            onChange={e => setModalData({ ...modalData, type: e.target.value })}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-black focus:outline-none focus:border-indigo-500 focus:bg-white text-sm capitalize"
                        >
                            {ACTIVITY_TYPES.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">Not</label>
                        <textarea
                            value={modalData.description}
                            onChange={e => setModalData({ ...modalData, description: e.target.value })}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-black focus:outline-none focus:border-indigo-500 focus:bg-white text-sm min-h-[80px]"
                            placeholder="Detaylar..."
                        />
                    </div>

                    <div className="flex gap-3 mt-8">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 py-2.5 rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors text-sm font-medium"
                        >
                            Vazgeç
                        </button>
                        <button
                            type="submit"
                            className="flex-1 btn-primary py-2.5 text-sm"
                        >
                            {editingId ? "Güncelle" : "Oluştur"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <div className="h-[calc(100vh-2rem)] flex flex-col gap-4">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-black">Randevu Takvimi</h1>
                    <p className="text-zinc-500 mt-1">Haftalık ders programı ve detayları.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-white rounded-lg border border-zinc-200 p-1 shadow-sm">
                        <button onClick={prevWeek} className="p-2 hover:bg-zinc-100 rounded text-zinc-600 transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={goToday} className="px-4 text-sm font-medium text-black hover:bg-zinc-100 rounded transition-colors">
                            Bugün
                        </button>
                        <button onClick={nextWeek} className="p-2 hover:bg-zinc-100 rounded text-zinc-600 transition-colors">
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <select
                        value={selectedTrainerId}
                        onChange={e => setSelectedTrainerId(e.target.value)}
                        className="bg-white border border-zinc-200 rounded-lg px-4 py-2 text-black focus:outline-none focus:border-indigo-500 text-sm shadow-sm h-[40px]"
                    >
                        <option value="">Tüm Eğitmenler</option>
                        {trainers.map((t: Staff) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>

                    {canAdd && (
                        <button
                            onClick={() => {
                                setEditingId(null);
                                setModalData({
                                    date: formatDate(new Date()),
                                    time: "09:00",
                                    memberId: "",
                                    trainerId: selectedTrainerId || "",
                                    type: "fitness",
                                    description: ""
                                });
                                setIsModalOpen(true);
                            }}
                            className="px-4 py-2 bg-black text-white hover:bg-zinc-800 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-sm h-[40px]"
                        >
                            <Plus size={18} />
                            <span>Randevu Ekle</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Weekly Calendar Grid */}
            <div className="flex-1 overflow-auto bg-white border border-zinc-200 rounded-xl flex flex-col shadow-sm">
                {/* Header Row (Days) */}
                <div className="sticky top-0 z-10 grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] bg-zinc-50 border-b border-zinc-200">
                    <div className="p-4 border-r border-zinc-200 flex items-center justify-center text-zinc-400">
                        <Clock size={20} />
                    </div>
                    {weekDays.map(day => (
                        <div key={day.date} className="p-3 text-center border-r border-zinc-200 min-w-[120px]">
                            <div className="font-medium text-black">{day.name}</div>
                            <div className="text-xs text-zinc-500 mt-1">{day.displayDate}</div>
                        </div>
                    ))}
                </div>

                {/* Time Slots Rows */}
                <div className="flex-1">
                    {TIME_SLOTS.map(time => (
                        <div key={time} className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] min-h-[100px] border-b border-zinc-100">
                            {/* Time Label */}
                            <div className="sticky left-0 bg-white border-r border-zinc-200 flex items-center justify-center text-sm font-medium text-zinc-400">
                                {time}
                            </div>

                            {/* Days Cells */}
                            {weekDays.map(day => {
                                // Find appointment(s) for this slot
                                const slotAppointments = appointments.filter((a: Appointment) =>
                                    a.date === day.date &&
                                    a.time === time &&
                                    (!selectedTrainerId || a.trainerId === selectedTrainerId)
                                );

                                const hasActive = slotAppointments.some((a: Appointment) => a.status !== 'cancelled');

                                return (
                                    <div
                                        key={`${day.date}-${time}`}
                                        onClick={() => handleEmptyCellClick(day.date, time)}
                                        className={`
                                            border-r border-zinc-100 p-2 relative group transition-colors min-h-[100px]
                                            ${hasActive ? 'bg-indigo-50/10' : 'hover:bg-zinc-50 cursor-pointer'}
                                        `}
                                    >
                                        <div className="flex flex-col gap-2 h-full z-10 relative">
                                            {slotAppointments.map((app: Appointment) => {
                                                const trainer = trainers.find((t: Staff) => t.id === app.trainerId);
                                                const member = members.find((m: Member) => m.id === app.memberId);
                                                const isCancelled = app.status === 'cancelled';

                                                return (
                                                    <div
                                                        key={app.id}
                                                        onClick={(e) => handleAppointmentClick(e, app)}
                                                        className={`
                                                            border shadow-sm p-2 rounded text-xs overflow-hidden transition-all cursor-pointer hover:shadow-md
                                                            ${isCancelled ? 'bg-red-50 border-red-100 opacity-60 grayscale' : 'bg-white border-indigo-100 hover:border-indigo-300'}
                                                        `}
                                                    >
                                                        <div className={`font-bold truncate ${isCancelled ? 'text-zinc-500 line-through' : 'text-black'}`}>
                                                            {member?.fullName}
                                                        </div>
                                                        <div className="text-indigo-600 truncate text-[10px]">{trainer?.name}</div>
                                                        <div className="text-zinc-500 truncate text-[10px] mt-1 capitalize flex justify-between">
                                                            <span>{app.type}</span>
                                                            {isCancelled && <span className="font-bold text-red-500 text-[9px]">İPTAL</span>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Show Plus if no ACTIVE appointment (allows booking over cancelled slots) */}
                                        {canAdd && !hasActive && (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                                                <Plus size={16} className="text-zinc-300" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {isModalOpen && Modal}
        </div>
    );
}

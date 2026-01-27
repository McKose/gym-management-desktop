"use client";

import { useGym } from "@/context/GymContext";
import { Users, TrendingUp, Calendar, DollarSign, AlertTriangle, Package as PackageIcon, Clock } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";

export default function Home() {
  const { members, packages, appointments, trainers, products, productSales, hasPermission } = useGym();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Permissions
  const canViewStats = hasPermission("view_stats");
  const canAddMember = hasPermission("add_member");

  // --- METRICS ---
  const totalMembers = members.length;
  const activeMembersOnly = members.filter(m => m.activePackageId && m.status === 'active').length;
  const passiveMembers = totalMembers - activeMembersOnly;
  const todaysAppointments = appointments.filter(a => a.date === new Date().toISOString().split("T")[0]).length;

  // --- WEEKLY SCHEDULE HELPER ---
  const getWeekDates = () => {
    const today = new Date();
    const day = today.getDay(); // 0 (Sun) - 6 (Sat)
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
    const monday = new Date(today.setDate(diff));

    const week = [];
    for (let i = 0; i < 6; i++) { // Mon-Sat (6 days)
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      week.push(d.toISOString().split('T')[0]);
    }
    return week;
  };

  const weekDays = getWeekDates();
  const weekDayNames = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  // 9 Time Slots as requested (6*9 matrix) - Assuming standard day 10:00 - 18:00 or similar. 
  // Let's go with 10:00 to 18:00 + one more? Or 09:00 - 17:00?
  // Let's try to cover the groups we made (09:00, 10:00... 21:00). 
  // If we need exactly 9 rows: 09, 10, 11, 12, 13, 14, 15, 16, 17. 
  const timeSlots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

  const getCellStatus = (date: string, time: string) => {
    // Find appointments for this slot
    const apps = appointments.filter(a => a.date === date && a.time === time);
    if (apps.length === 0) return null;

    // Priority: Cancelled -> Completed -> Scheduled? 
    // If ANY is scheduled, show blue. If mostly completed, green.
    // Simplification: Show stats of first one or count.
    // User asked for colors: Completed(Green), Upcoming(Blue), Rescheduled(Yellow), Cancelled(Red).

    const hasCompleted = apps.some(a => a.status === 'completed');
    const hasCancelled = apps.some(a => a.status === 'cancelled');
    const hasScheduled = apps.some(a => a.status === 'scheduled');

    if (hasCompleted) return { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Tamamlandı' };
    if (hasCancelled) return { color: 'bg-red-100 text-red-700 border-red-200', label: 'İptal' }; // Assuming cancelled is prioritized if no completion

    // Determine if "Upcoming" or "Delayed/Rescheduled" based on time?
    // Since we don't have "Rescheduled" status, maybe we check if date is in past and still scheduled?
    const slotDate = new Date(`${date}T${time}`);
    const now = new Date();
    if (slotDate < now && hasScheduled) return { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Ertelendi?' }; // Past scheduled = Yellow (Ertelenen/Missed)

    return { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Planlı' };
  };

  // --- ALERTS ---
  const lowStockProducts = products.filter(p => p.stock < 5);

  const expiringMembers = members.filter(m => {
    if (!m.endDate || m.status !== 'active') return false;
    const end = new Date(m.endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  });


  if (!mounted) return null;

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">Dashboard</h1>
          <p className="text-zinc-500 mt-1">Haftalık görünüm ve genel durum.</p>
        </div>
        {canAddMember && (
          <Link href="/members" className="btn-primary">
            + Yeni Üye Ekle
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      {canViewStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Custom Member Stats Card */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={20} /></div>
                <span className="font-bold text-zinc-500 text-sm uppercase tracking-wider">Üye Durumu</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <div className="text-3xl font-bold text-emerald-600">{activeMembersOnly}</div>
                  <div className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Aktif</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-zinc-400">{passiveMembers}</div>
                  <div className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Pasif</div>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-100 flex justify-between items-center">
              <span className="text-zinc-400 text-sm">Toplam Kayıt</span>
              <span className="text-2xl font-black text-black">{totalMembers}</span>
            </div>
          </div>

          {/* Other Stats */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Calendar size={20} /></div>
                <span className="font-bold text-zinc-500 text-sm uppercase tracking-wider">Bugün</span>
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-black mt-4">{todaysAppointments}</div>
              <div className="text-sm text-zinc-400 mt-1">Planlanan Ders</div>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Users size={20} /></div>
                <span className="font-bold text-zinc-500 text-sm uppercase tracking-wider">Eğitmenler</span>
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-black mt-4">{trainers.length}</div>
              <div className="text-sm text-zinc-400 mt-1">Aktif Personel</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* WEEKLY SCHEDULE MATRIX (3 Columns Wide) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-black">Haftalık Ders Programı</h3>
              <div className="flex gap-2 text-[10px] font-bold uppercase">
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded border border-emerald-200">Tamamlanan</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded border border-blue-200">Yaklaşan</span>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded border border-yellow-200">Ertelenen</span>
                <span className="px-2 py-1 bg-red-100 text-red-700 rounded border border-red-200">İptal</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="p-2 border-b border-r border-zinc-100 bg-zinc-50 w-16"></th>
                    {weekDayNames.map((d, i) => (
                      <th key={d} className="p-3 border-b border-zinc-100 bg-zinc-50 text-zinc-500 font-bold uppercase text-xs w-1/6">
                        <div>{d}</div>
                        <div className="text-[10px] font-normal text-zinc-400">{weekDays[i].split('-').slice(1).join('/')}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map(time => (
                    <tr key={time}>
                      <td className="p-2 border-r border-b border-zinc-100 font-bold text-zinc-400 text-xs text-center">{time}</td>
                      {weekDays.map(date => {
                        const status = getCellStatus(date, time);
                        const apps = appointments.filter(a => a.date === date && a.time === time);
                        const count = apps.length;

                        // Resolve Trainer Name for the first appointment (or show 'Mixed' if multiple?)
                        // For now, show the first one's trainer.
                        let trainerName = '';
                        if (apps.length > 0) {
                          const tId = apps[0].trainerId;
                          const trainer = trainers.find(t => t.id === tId);
                          trainerName = trainer?.name || '';
                          // Formatting: "Ahmet Hoca" -> "Ahmet H." or full name if space permits
                          // Let's split first name
                          if (trainerName.includes(' ')) {
                            const parts = trainerName.split(' ');
                            trainerName = `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
                          }
                        }

                        return (
                          <td key={`${date}-${time}`} className="p-1 border-b border-zinc-100 h-16 min-w-[100px] align-top">
                            {status ? (
                              <div className={`w-full h-full rounded-lg p-1.5 border flex flex-col justify-center items-center ${status.color} text-center`}>
                                <span className="font-bold text-xs truncate w-full">{count > 1 ? `${count} Ders` : (apps[0]?.type || 'Ders')}</span>
                                {count === 1 && trainerName && (
                                  <span className="text-[10px] opacity-80 truncate w-full mt-0.5 font-medium">{trainerName}</span>
                                )}
                              </div>
                            ) : (
                              <div className="w-full h-full rounded-lg bg-zinc-50/50"></div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ALERTS COLUMN (1 Column Wide) */}
        <div className="space-y-6">
          {canViewStats && (
            <>
              {/* Expiring Members Alert */}
              <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="text-red-500" size={18} />
                  <h3 className="text-sm font-bold text-black uppercase tracking-wider">Yaklaşan Bitişler</h3>
                </div>
                <div className="space-y-2">
                  {expiringMembers.slice(0, 5).map(m => (
                    <div key={m.id} className="flex justify-between items-center text-xs p-2 bg-red-50 rounded text-red-900 border border-red-100">
                      <div className="flex flex-col">
                        <span className="font-bold truncate max-w-[100px]">{m.fullName}</span>
                        <span className="opacity-70 scale-90 origin-left">{packages.find(p => p.id === m.activePackageId)?.name}</span>
                      </div>
                      <span className="font-bold">{m.endDate}</span>
                    </div>
                  ))}
                  {expiringMembers.length === 0 && <p className="text-zinc-400 text-xs italic">Kayıt yok.</p>}
                </div>
              </div>

              {/* Low Stock Alert */}
              <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="text-amber-500" size={18} />
                  <h3 className="text-sm font-bold text-black uppercase tracking-wider">Stok Uyarıları</h3>
                </div>
                <div className="space-y-2">
                  {lowStockProducts.slice(0, 5).map(p => (
                    <div key={p.id} className="flex justify-between items-center text-xs p-2 bg-amber-50 rounded text-amber-900 border border-amber-100">
                      <span className="font-medium truncate">{p.name}</span>
                      <span className="font-bold">{p.stock} Adet</span>
                    </div>
                  ))}
                  {lowStockProducts.length === 0 && <p className="text-zinc-400 text-xs italic">Stoklar yeterli.</p>}
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

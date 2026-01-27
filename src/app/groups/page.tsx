"use client";

import { useGym } from "@/context/GymContext";
import { useState } from "react";
import { Search, Users, Calendar, Clock, MoreVertical, Plus } from "lucide-react";

export default function GroupsPage() {
    const { groups, members, hasPermission } = useGym();
    const [searchTerm, setSearchTerm] = useState("");

    const canView = hasPermission("view_schedule"); // Reusing schedule permission
    // const canAdd = hasPermission("manage_schedule");

    const filteredGroups = groups.filter(g =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!canView) return <div className="p-10 text-center text-zinc-500">Yetkiniz yok.</div>;

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-black">Grup Yönetimi</h1>
                    <p className="text-zinc-500 mt-1">Grup derslerini ve katılımcıları yönetin.</p>
                </div>
                {/* Future: Add Group Button */}
                {/* <button className="btn-primary flex items-center gap-2">
                    <Plus size={20} /> Yeni Grup
                </button> */}
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                <input
                    type="text"
                    placeholder="Grup ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                />
            </div>

            {/* Groups Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGroups.map(group => {
                    const activeMembersCount = members.filter(m => m.groupId === group.id && m.status === 'active').length;

                    return (
                        <div key={group.id} className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-black">{group.name}</h3>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${group.active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                        {group.active ? 'Aktif' : 'Pasif'}
                                    </span>
                                </div>
                                <button className="text-zinc-400 hover:text-black">
                                    <MoreVertical size={20} />
                                </button>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3 text-sm text-zinc-600">
                                    <Calendar size={16} className="text-zinc-400" />
                                    <span>{group.schedule === 'MWF' ? 'Pazartesi - Çarşamba - Cuma' : 'Salı - Perşembe - Cumartesi'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-zinc-600">
                                    <Clock size={16} className="text-zinc-400" />
                                    <span>{group.time}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-zinc-600">
                                    <Users size={16} className="text-zinc-400" />
                                    <span>{activeMembersCount} / {group.capacity} Üye</span>
                                </div>
                            </div>

                            {/* Members Preview */}
                            <div>
                                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Katılımcılar</h4>
                                <div className="flex -space-x-2 overflow-hidden">
                                    {members.filter(m => m.groupId === group.id).slice(0, 5).map(m => (
                                        <div key={m.id} className="w-8 h-8 rounded-full bg-zinc-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-zinc-600" title={m.fullName}>
                                            {m.fullName.charAt(0)}
                                        </div>
                                    ))}
                                    {members.filter(m => m.groupId === group.id).length > 5 && (
                                        <div className="w-8 h-8 rounded-full bg-zinc-50 border-2 border-white flex items-center justify-center text-[10px] font-bold text-zinc-400">
                                            +{members.filter(m => m.groupId === group.id).length - 5}
                                        </div>
                                    )}
                                    {members.filter(m => m.groupId === group.id).length === 0 && (
                                        <span className="text-xs text-zinc-400 italic pl-2">Henüz üye yok.</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredGroups.length === 0 && (
                <div className="text-center py-20 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                    <Users className="mx-auto text-zinc-300 mb-4" size={48} />
                    <h3 className="text-lg font-bold text-zinc-900">Grup Bulunamadı</h3>
                    <p className="text-zinc-500 max-w-sm mx-auto mt-2">
                        Arama kriterlerine uygun grup bulunamadı veya henüz hiç grup oluşturulmadı.
                    </p>
                </div>
            )}
        </div>
    );
}

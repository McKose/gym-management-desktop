"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, UserCog, Calendar, CreditCard, LogOut, Package as PackageIcon, RefreshCw, Settings, ShoppingBag, Layers } from "lucide-react";
import { useGym, Staff } from "@/context/GymContext";
import { useState, useEffect } from "react";
import LoginModal from "./LoginModal";
import React from 'react';

interface SidebarMenuItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    permission: string | null;
}

export default function Sidebar() {
    const pathname = usePathname();
    const { currentUser, setCurrentUser, staff, hasPermission, isLoaded } = useGym();

    // Login / Role Switch State
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [switchTarget, setSwitchTarget] = useState<Staff | null>(null);

    // Force Login on Mount if no user (Wait for load)
    useEffect(() => {
        if (!isLoaded) return;

        if (!currentUser) {
            const timer = setTimeout(() => setIsLoginModalOpen(true), 0);
            return () => clearTimeout(timer);
        } else {
            if (!switchTarget) {
                const timer = setTimeout(() => setIsLoginModalOpen(false), 0);
                return () => clearTimeout(timer);
            }
        }
    }, [currentUser, switchTarget, isLoaded]);

    const handleSwitchRequest = (target: Staff) => {
        setSwitchTarget(target);
        setIsLoginModalOpen(true);
    };

    const handleLoginSuccess = (user: Staff) => {
        setCurrentUser(user);
        setSwitchTarget(null);
        setIsLoginModalOpen(false);
    };

    const handleCancelSwitch = () => {
        setSwitchTarget(null);
        if (currentUser) setIsLoginModalOpen(false); // Only close if we have a user (don't close on initial login)
    };

    // Define all possible items with their required permission
    // "Dashboard" is always visible (null permission requirement)
    const allMenuItems = [
        { name: "Dashboard", href: "/", icon: LayoutDashboard, permission: null },
        { name: "Üyeler", href: "/members", icon: Users, permission: "view_member" },
        { name: "Gruplar", href: "/groups", icon: Layers, permission: "view_schedule" }, // Using view_schedule for now
        { name: "Paketler", href: "/packages", icon: PackageIcon, permission: "view_packages" },
        { name: "Personel", href: "/staff", icon: UserCog, permission: "view_staff" },
        { name: "Randevular", href: "/schedule", icon: Calendar, permission: "view_schedule" },
        { name: "Mağaza", href: "/store", icon: ShoppingBag, permission: "view_store" }, // Updated to use specific view_store permission
        { name: "Finans", href: "/financials", icon: CreditCard, permission: "view_financials" },
        { name: "Ayarlar", href: "/settings", icon: Settings, permission: "view_settings" },
    ];

    // Filter items based on current user's permissions
    const visibleItems = allMenuItems.filter((item: SidebarMenuItem) => {
        if (!item.permission) return true;
        return hasPermission(item.permission as string);
    });

    return (
        <header className="fixed top-0 left-0 w-full h-28 bg-white border-b border-zinc-200 z-50">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center px-6 h-full">

                {/* Left: User Info (Current) */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                        {currentUser?.name.charAt(0) || "?"}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-black">{currentUser?.name || "Misafir"}</span>
                        <span className="text-xs text-zinc-500 capitalize">{currentUser?.role || "Giriş Yapılmadı"}</span>
                    </div>
                </div>

                {/* Centered Navigation */}
                <nav className="flex items-center gap-[30px]">
                    {visibleItems.map((item: SidebarMenuItem) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-black text-white shadow-lg' : 'text-zinc-500 hover:bg-zinc-100 hover:text-black'}`}
                            >
                                <Icon size={18} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Right Section: User Switcher & Quit */}
                <div className="flex justify-end items-center gap-4">
                    {/* User Switcher (For Testing) */}
                    <div className="relative group">
                        <button className="flex items-center gap-2 text-xs bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-full hover:bg-zinc-100 transition-colors text-zinc-600">
                            <RefreshCw size={14} />
                            <span>Rol Değiştir</span>
                        </button>

                        {/* Dropdown */}
                        <div className="absolute right-0 top-full pt-2 w-48 hidden group-hover:block z-[60]">
                            <div className="bg-white border border-zinc-200 rounded-lg shadow-xl p-2">
                                <p className="text-[10px] uppercase text-zinc-400 font-bold px-2 py-1">Kullanıcı Seç</p>
                                {staff.map((s: Staff) => (
                                    <button
                                        key={s.id}
                                        onClick={() => handleSwitchRequest(s)}
                                        className={`w-full text-left px-2 py-2 rounded text-xs flex items-center justify-between ${currentUser?.id === s.id ? "bg-indigo-50 text-indigo-700" : "hover:bg-zinc-50 text-zinc-700"}`}
                                    >
                                        <span>{s.name}</span>
                                        <span className="text-[10px] opacity-70 border border-current px-1 rounded capitalize">{s.role}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="h-8 w-px bg-zinc-200 mx-2"></div>

                    <button
                        onClick={() => setCurrentUser(null)} // Logout
                        className="flex items-center gap-2 text-zinc-500 hover:text-red-600 transition-colors text-xs font-medium"
                    >
                        <LogOut size={16} />
                        <span>Çıkış</span>
                    </button>
                </div>
            </div>

            {/* Global Login Modal */}
            <LoginModal
                isOpen={isLoginModalOpen}
                onLogin={handleLoginSuccess}
                targetUser={switchTarget} // If null, acts as initial login for any user
                onCancel={currentUser ? handleCancelSwitch : undefined} // Can only cancel if already logged in
            />
        </header>
    );
}

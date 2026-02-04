"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Member, Package, Service, Staff, Appointment } from "@/types";

interface MemberContextType {
    members: Member[];
    packages: Package[];
    services: Service[];
    staff: Staff[]; // Needed for trainer selection, but managed by Auth/Admin usually. Kept here for read-access.

    addMember: (member: Omit<Member, "id" | "status" | "history">) => string;
    updateMember: (id: string, data: Partial<Member>) => void;
    deleteMember: (id: string) => void;
    renewMembership: (memberId: string, newPackageId: string, startDate: string, pricePaid: number, paymentType: "cash" | "card", installments?: number) => void;

    // Package Actions
    addPackage: (pkg: Omit<Package, "id">) => void;
    updatePackage: (id: string, pkg: Partial<Package>) => void;
    deletePackage: (id: string) => void;

    // Service Actions
    addService: (service: Omit<Service, "id">) => void;
    updateService: (id: string, updates: Partial<Service>) => void;

    // Staff Read (Write should be in generic or admin context?) Let's keep write here for simplicity or split to StaffContext?
    // Let's keep simple: MemberContext handles the "Gym Business" entities.
    addStaff: (staff: Omit<Staff, "id">) => void;
    updateStaff: (id: string, staff: Partial<Staff>) => void;
    deleteStaff: (id: string) => void;
}

const MemberContext = createContext<MemberContextType | undefined>(undefined);

export function MemberProvider({ children }: { children: ReactNode }) {
    // --- State Initialization (Empty for now, logic to be migrated) ---
    const [members, setMembers] = useState<Member[]>([]);
    const [packages, setPackages] = useState<Package[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);

    // --- Actions --- (Placement holders)
    const addMember = (m: any) => { return "temp-id" };
    const updateMember = (id: string, data: any) => { };
    const deleteMember = (id: string) => { };
    const renewMembership = (id: string) => { };

    const addPackage = (p: any) => { };
    const updatePackage = (id: string, p: any) => { };
    const deletePackage = (id: string) => { };

    const addService = (s: any) => { };
    const updateService = (id: string, s: any) => { };

    const addStaff = (s: any) => { };
    const updateStaff = (id: string, s: any) => { };
    const deleteStaff = (id: string) => { };

    return (
        <MemberContext.Provider value={{
            members, packages, services, staff,
            addMember, updateMember, deleteMember, renewMembership,
            addPackage, updatePackage, deletePackage,
            addService, updateService,
            addStaff, updateStaff, deleteStaff
        }}>
            {children}
        </MemberContext.Provider>
    );
}

export function useMembers() {
    const context = useContext(MemberContext);
    if (!context) throw new Error("useMembers must be used within MemberProvider");
    return context;
}

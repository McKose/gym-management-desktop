"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Member, Package, Service, Staff } from "@/context/GymContext";

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
    const addMember = (_m: Omit<Member, "id" | "status" | "history">) => { return "temp-id" };
    const updateMember = (_id: string, _data: Partial<Member>) => { };
    const deleteMember = (_id: string) => { };
    const renewMembership = (_memberId: string, _newPackageId: string, _startDate: string, _pricePaid: number, _paymentType: "cash" | "card", _installments?: number) => { };

    const addPackage = (_p: Omit<Package, "id">) => { };
    const updatePackage = (_id: string, _p: Partial<Package>) => { };
    const deletePackage = (_id: string) => { };

    const addService = (_s: Omit<Service, "id">) => { };
    const updateService = (_id: string, _s: Partial<Service>) => { };

    const addStaff = (_s: Omit<Staff, "id">) => { };
    const updateStaff = (_id: string, _s: Partial<Staff>) => { };
    const deleteStaff = (_id: string) => { };

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

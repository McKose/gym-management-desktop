"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// --- Types ---
export type PackageType = "ABONMAN" | "DERS_PAKETI";
export type ServiceCategory = "SELF_SERVICE" | "COACHING";
export type SessionFormat = "BIREYSEL" | "DUET" | "GRUP" | "SERBEST";
export type Branch = "fitness" | "reformer" | "pilates" | "yoga" | "functional" | "cardio" | "boxing" | "swimming";
export type GroupSchedule = "MWF" | "TTS";

// Legacy Type Support Removed


// RBAC Types
export type Role = "admin" | "manager" | "trainer" | "dietitian" | "physio";
export type Permission =
    | "view_stats"
    | "view_packages"
    | "manage_packages"
    | "view_staff"
    | "manage_staff"
    | "view_financials"
    | "manage_financials"
    | "add_member"
    | "edit_member"
    | "view_member"
    | "add_appointment"
    | "view_schedule"
    | "view_settings"
    | "manage_settings"
    | "view_store"
    | "delete_member";

export interface Service {
    id: string;
    name: string;
    category: ServiceCategory;
    description?: string;
    isActive: boolean;
}

export interface Package {
    id: string;
    serviceId: string; // Link to Service
    name: string;
    type: PackageType;
    price: number;
    // Details
    sessionCount?: number; // Required for DERS_PAKETI
    sessionFormat?: SessionFormat;
    validityDays?: number; // Validity in days
    validityRequired: boolean; // True for COACHING
    // Legacy fields (keeping for compatibility during refactor, will deprecate)
    unitPrice?: number;
    branch?: Branch;
    durationMonths?: number;
    // UI Helpers
    isActive: boolean;
    sortOrder: number;
}
// Removed "ServiceType" alias to force update to "Service"
export interface CommissionRate {
    installments: number;
    rate: number;
}

export interface Staff {
    id: string;
    name: string;
    role: Role;
    gender: "male" | "female";
    branches: Branch[];
    commissionRate: number;
    email?: string;
    phone?: string;
    birthDate?: string;
    hireDate?: string; // New: To track earnings from start date
    password?: string; // New: For login simulation
    paymentConfig?: {
        model: 'salaried' | 'commission' | 'partner';
        salaryAmount?: number;
        commissionRate?: number;
        profitShareRate?: number;
    };
}

export interface Measurement {
    date: string;
    weight: number; // kg
    height: number; // cm
    shoulders: number; // cm
    arm: number; // cm
    chest: number; // cm
    waist: number; // cm
    hips: number; // cm
    leg: number; // cm
}

export interface HealthProfile {
    cardio: string[]; // Hipertansiyon, Ritim Bozukluğu, etc.
    ortho: string[]; // Bel, Boyun, Diz, etc.
    metabolic: string[]; // Diyabet, Obezite, etc.
    respiratory: string[]; // Astım, KOAH, etc.
    special: string[]; // Gebelik, Epilepsi, etc.
    other: string;
    riskLevel: 'low' | 'medium' | 'high';
}

export interface Member {
    id: string;
    fullName: string;
    phone: string;
    email: string;
    activePackageId?: string;
    remainingSessions?: number;
    startDate: string;
    notes?: string;
    // New Payment Fields
    paymentType?: "cash" | "card";
    paymentStatus?: "paid" | "pending";
    installments?: number; // If card
    pricePaid?: number; // Final price paid (after commission)
    groupId?: string; // New: For duet/group linking
    cancelCount?: number;
    rescheduleCount?: number;
    // New Renewal Fields
    status: 'active' | 'passive';
    endDate?: string; // Calculated from startDate + validity
    history?: MembershipHistoryItem[];
    // Measurements
    measurements?: Measurement[]; // History of measurements
    // Health
    healthProfile?: HealthProfile;
}

export interface Group {
    id: string;
    name: string; // e.g. "MWF 19:00 - A"
    schedule: GroupSchedule;
    time: string; // "19:00"
    memberIds: string[];
    capacity: number;
    active: boolean;
}

export interface MembershipHistoryItem {
    packageId: string;
    packageName: string;
    startDate: string;
    endDate?: string;
    pricePaid: number;
    purchaseDate: string;
}

export interface Appointment {
    id: string;
    memberId: string;
    trainerId: string;
    date: string;
    time: string;
    type: Branch;
    description?: string;
    status: "scheduled" | "cancelled" | "completed";
}

export interface Product {
    id: string;
    name: string;
    category: 'supplement' | 'drink' | 'clothing' | 'equipment' | 'other';
    price: number;
    stock: number;
    cost: number;
    taxRate: 0 | 1 | 10 | 20;
}

export interface ProductSale {
    id: string;
    date: string;
    items: { productId: string; name: string; quantity: number; priceAtSale: number }[];
    totalAmount: number;
    staffId: string;
}

export interface Expense {
    id: string;
    title: string;
    description?: string;
    amount: number;
    category: "rent" | "bill" | "salary" | "maintenance" | "stock_purchase" | "consumable" | "tax" | "other";
    date: string;
    // New optional fields for installment purchases
    installments?: number;          // total number of installments
    paidInstallments?: number;      // how many installments have been paid
    status?: "pending" | "paid"; // derived from installments
}

export interface FixedExpense {
    id: string;
    title: string;
    amount: number;
    description?: string;
    dayOfMonth: number;
    type: 'fixed' | 'variable'; // fixed: Kira (amount fixed), variable: Fatura (reminder)
    endDate?: string; // Optional: When the recurrence ends
}

// Permission Definitions
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    admin: [
        "view_stats", "view_packages", "manage_packages", "view_staff", "manage_staff",
        "view_financials", "manage_financials", "add_member", "edit_member", "view_member", "delete_member",
        "add_appointment", "view_schedule", "view_settings", "manage_settings", "view_store"
    ],
    manager: [
        "view_stats", "view_packages", "manage_packages", "view_staff", "manage_staff",
        "view_financials", "manage_financials", "add_member", "edit_member", "view_member", "delete_member",
        "add_appointment", "view_schedule", "view_settings", "manage_settings", "view_store"
    ],
    trainer: [
        "add_member", "view_member", "add_appointment", "view_schedule", "view_store"
    ],
    physio: [
        "add_member", "view_member", "add_appointment", "view_schedule", "view_store"
    ],
    dietitian: [
        "view_member", "edit_member", "view_store"
    ]
};

export interface Coupon {
    id: string;
    code: string;
    discountRate: number; // Percentage
    isActive: boolean;
}

export interface GymContextType {
    // Packages
    packages: Package[];
    addPackage: (pkg: Omit<Package, "id">) => void;
    deletePackage: (id: string) => void;
    updatePackage: (id: string, pkg: Partial<Package>) => void; // Keeping if it exists, otherwise add

    // Services (New)
    services: Service[];
    addService: (service: Omit<Service, "id">) => void;
    updateService: (id: string, updates: Partial<Service>) => void;
    deleteService: (id: string) => void;

    // Configs
    commissionRates: CommissionRate[];
    updateCommissionRate: (installments: number, rate: number) => void;
    addCommissionRate: (installments: number, rate: number) => void;
    deleteCommissionRate: (installments: number) => void;

    // Staff
    staff: Staff[];
    addStaff: (staff: Omit<Staff, "id">) => void;
    updateStaff: (id: string, staff: Partial<Staff>) => void;
    deleteStaff: (id: string) => void;
    trainers: Staff[];

    // Auth
    currentUser: Staff | null;
    setCurrentUser: (user: Staff | null) => void;
    hasPermission: (perm: Permission) => boolean;

    // Members
    members: Member[];
    addMember: (member: Omit<Member, "id" | "status" | "history">) => string;
    updateMember: (id: string, data: Partial<Member>) => void;
    deleteMember: (id: string) => void;
    renewMembership: (memberId: string, newPackageId: string, startDate: string, pricePaid: number, paymentType: "cash" | "card", installments?: number) => void;

    // Others
    appointments: Appointment[];
    addAppointment: (appointment: Omit<Appointment, "id" | "status">) => void;
    deleteAppointment: (id: string, isRefund?: boolean) => void;
    cancelAppointment: (id: string) => void;
    updateAppointment: (id: string, appointment: Partial<Appointment>) => void;

    expenses: Expense[];
    addExpense: (expense: Omit<Expense, "id">) => void;
    deleteExpense: (id: string) => void;

    fixedExpenses: FixedExpense[];
    addFixedExpense: (expense: Omit<FixedExpense, "id">) => void;
    deleteFixedExpense: (id: string) => void;
    updateFixedExpense: (id: string, expense: Partial<FixedExpense>) => void;

    // Store
    products: Product[];
    addProduct: (product: Omit<Product, "id">) => void;
    updateProduct: (id: string, product: Partial<Product>) => void;
    deleteProduct: (id: string) => void;

    productSales: ProductSale[];
    addProductSale: (sale: Omit<ProductSale, "id">) => void;

    // Coupons
    coupons: Coupon[];
    addCoupon: (coupon: Omit<Coupon, "id">) => void;
    updateCoupon: (id: string, updates: Partial<Coupon>) => void;
    deleteCoupon: (id: string) => void;

    // Groups
    groups: Group[];
    joinGroup: (memberIds: string[], schedule: GroupSchedule, time: string, branch: Branch) => void;
}

const GymContext = createContext<GymContextType | undefined>(undefined);

export function GymProvider({ children }: { children: ReactNode }) {
    const [packages, setPackages] = useState<Package[]>([
        // FITNESS (Self Service)
        {
            id: "fit_1mo", serviceId: "fitness", name: "Aylık Abonman", type: "ABONMAN",
            price: 1500, validityDays: 30, validityRequired: false, isActive: true, sortOrder: 1, sessionFormat: "SERBEST"
        },
        {
            id: "fit_3mo", serviceId: "fitness", name: "3 Aylık Abonman", type: "ABONMAN",
            price: 4000, validityDays: 90, validityRequired: false, isActive: true, sortOrder: 2, sessionFormat: "SERBEST"
        },
        // FUNCTIONAL (Coaching)
        {
            id: "func_8_pt", serviceId: "functional", name: "8 Ders Bireysel", type: "DERS_PAKETI",
            price: 6000, sessionCount: 8, validityDays: 30, validityRequired: true, isActive: true, sortOrder: 3, sessionFormat: "BIREYSEL"
        },
        // REFORMER (Coaching)
        {
            id: "ref_8_pt", serviceId: "reformer", name: "8 Ders Bireysel", type: "DERS_PAKETI",
            price: 7000, sessionCount: 8, validityDays: 30, validityRequired: true, isActive: true, sortOrder: 6, sessionFormat: "BIREYSEL"
        },
    ]);

    // 1. SERVICES SEED
    const [services, setServices] = useState<Service[]>([
        { id: "fitness", name: "Fitness", category: "SELF_SERVICE", isActive: true, description: "Bireysel spor salonu kullanımı." },
        { id: "functional", name: "Fonksiyonel", category: "COACHING", isActive: true, description: "Fonksiyonel antrenman dersleri." },
        { id: "reformer", name: "Reformer", category: "COACHING", isActive: true, description: "Aletli pilates dersleri." },
    ]);

    // Service Actions
    const addService = (service: Omit<Service, "id">) => {
        setServices([...services, { ...service, id: service.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now() }]);
    };

    const updateService = (id: string, updates: Partial<Service>) => {
        setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const deleteService = (id: string) => {
        setServices(services.filter(s => s.id !== id));
    };
    const [staff, setStaff] = useState<Staff[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
    // Store State
    const [products, setProducts] = useState<Product[]>([]);
    const [productSales, setProductSales] = useState<ProductSale[]>([]);

    // Coupon State
    const [coupons, setCoupons] = useState<Coupon[]>([
        { id: '1', code: 'PROMO10', discountRate: 10, isActive: true },
        { id: '2', code: 'YAZINDIRIMI', discountRate: 20, isActive: true }
    ]);

    // Group State
    const [groups, setGroups] = useState<Group[]>([]);


    // Unit Prices and Service Types removed (Legacy)

    const [commissionRates, setCommissionRates] = useState<CommissionRate[]>([
        { installments: 1, rate: 0 },
        { installments: 3, rate: 5 },
        { installments: 6, rate: 10 },
        { installments: 9, rate: 15 },
        { installments: 12, rate: 20 },
    ]);

    const [currentUser, setCurrentUser] = useState<Staff | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Helper for API storage
    // Helper for API storage
    const saveToStorage = async (key: string, data: any) => {
        try {
            if (typeof window !== 'undefined' && window.electron) {
                await window.electron.saveData(key, data);
            } else {
                await fetch('/api/storage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key, data })
                });
            }
        } catch (error) {
            console.error('Failed to save', key, error);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            const fetchData = async (key: string) => {
                try {
                    if (typeof window !== 'undefined' && window.electron) {
                        return await window.electron.readData(key);
                    } else {
                        const res = await fetch(`/api/storage?key=${key}`);
                        const json = await res.json();
                        return json.data;
                    }
                } catch (e) {
                    console.error("Failed to load", key, e);
                    return null;
                }
            };

            const savedPackages = await fetchData("gym_packages");
            const savedStaff = await fetchData("gym_staff");
            const savedMembers = await fetchData("gym_members");
            const savedAppointments = await fetchData("gym_appointments");
            const savedExpenses = await fetchData("gym_expenses");
            const savedFixedExpenses = await fetchData("gym_fixed_expenses");
            const savedCommissions = await fetchData("gym_commissions");
            const savedServices = await fetchData("gym_services_v2");
            const savedProducts = await fetchData("gym_products");
            const savedProductSales = await fetchData("gym_product_sales");
            const savedGroups = await fetchData("gym_groups");
            const savedCoupons = await fetchData("gym_coupons"); // Added missing coupon load


            if (savedPackages) {
                setPackages(savedPackages);
            } else {
                setPackages([
                    { id: "1", serviceId: "fitness", name: "Aylık Abonman", type: "ABONMAN", price: 1500, validityDays: 30, validityRequired: false, isActive: true, sortOrder: 1, sessionFormat: "SERBEST" },
                ]);
            }

            if (savedStaff) {
                // Ensure dates and arrays are correct if needed, but JSON usually handles strings fine
                const loadedStaff = savedStaff.map((s: any) => ({
                    ...s,
                    branches: s.branches || [],
                    role: s.role || 'trainer',
                    hireDate: s.hireDate || '2024-01-01'
                }));
                setStaff(loadedStaff);
            } else {
                const defaults: Staff[] = [
                    { id: "admin1", name: "Sistem Admin", role: "admin", gender: "male", branches: [], commissionRate: 0, email: "admin@gym.com", hireDate: "2024-01-01", paymentConfig: { model: 'salaried', salaryAmount: 30000 }, password: "1234" },
                    { id: "manager1", name: "Mehmet Yönetici", role: "manager", gender: "male", branches: ["fitness"], commissionRate: 0, hireDate: "2024-01-01", paymentConfig: { model: 'salaried', salaryAmount: 25000 }, password: "1234" },
                    { id: "trainer1", name: "Ahmet Hoca", role: "trainer", gender: "male", branches: ["fitness", "functional", "boxing"], commissionRate: 40, hireDate: "2024-01-01", paymentConfig: { model: 'commission', commissionRate: 40 }, password: "1234" },
                    { id: "physio1", name: "Ayşe Fizyo", role: "physio", gender: "female", branches: ["reformer", "pilates"], commissionRate: 50, hireDate: "2024-01-01", paymentConfig: { model: 'commission', commissionRate: 50 }, password: "1234" },
                ];
                setStaff(defaults);
            }

            if (!savedPackages) { // Fallback contents if completely empty
                setPackages([
                    { id: "p8", name: "8 Derslik Paket", type: "DERS_PAKETI", serviceId: "fitness", price: 2000, sessionCount: 8, validityDays: 30, validityRequired: true, sortOrder: 1, sessionFormat: "BIREYSEL", isActive: true },
                    { id: "p12", name: "12 Derslik Paket", type: "DERS_PAKETI", serviceId: "fitness", price: 2800, sessionCount: 12, validityDays: 45, validityRequired: true, sortOrder: 1, sessionFormat: "BIREYSEL", isActive: true },
                    { id: "g8", name: "Reformer Grup (8 Ders)", type: "DERS_PAKETI", serviceId: "reformer", price: 1500, sessionCount: 8, validityDays: 30, validityRequired: true, sortOrder: 1, sessionFormat: "GRUP", isActive: true },
                    { id: "1", name: "Aylık Abonman", type: "ABONMAN", serviceId: "fitness", price: 1500, validityDays: 30, validityRequired: false, sortOrder: 1, sessionFormat: "SERBEST", isActive: true },
                ]);
            }

            if (savedMembers) setMembers(savedMembers);
            if (savedAppointments) setAppointments(savedAppointments);
            if (savedExpenses) setExpenses(savedExpenses);
            if (savedFixedExpenses) {
                setFixedExpenses(savedFixedExpenses);
            } else {
                setFixedExpenses([
                    { id: "fx1", title: "Kira", amount: 15000, dayOfMonth: 1, type: 'fixed' },
                    { id: "fx2", title: "Elektrik Faturası", amount: 0, dayOfMonth: 17, type: 'variable' },
                    { id: "fx3", title: "Su Faturası", amount: 0, dayOfMonth: 20, type: 'variable' }
                ]);
            }
            if (savedCommissions) setCommissionRates(savedCommissions);
            if (savedServices) setServices(savedServices);

            if (savedProducts) setProducts(savedProducts);
            if (savedProductSales) setProductSales(savedProductSales);
            if (savedGroups) setGroups(savedGroups);
            if (savedCoupons) setCoupons(savedCoupons);

            setIsLoaded(true);
        };
        loadData();
    }, []);

    // --- Persistence Effects (Optimized) ---
    useEffect(() => { if (isLoaded) saveToStorage("gym_packages", packages); }, [packages, isLoaded]);
    useEffect(() => { if (isLoaded) saveToStorage("gym_staff", staff); }, [staff, isLoaded]);
    useEffect(() => { if (isLoaded) saveToStorage("gym_members", members); }, [members, isLoaded]);
    useEffect(() => { if (isLoaded) saveToStorage("gym_appointments", appointments); }, [appointments, isLoaded]);
    useEffect(() => { if (isLoaded) saveToStorage("gym_expenses", expenses); }, [expenses, isLoaded]);
    useEffect(() => { if (isLoaded) saveToStorage("gym_fixed_expenses", fixedExpenses); }, [fixedExpenses, isLoaded]);
    useEffect(() => { if (isLoaded) saveToStorage("gym_commissions", commissionRates); }, [commissionRates, isLoaded]);
    useEffect(() => { if (isLoaded) saveToStorage("gym_products", products); }, [products, isLoaded]);
    useEffect(() => { if (isLoaded) saveToStorage("gym_product_sales", productSales); }, [productSales, isLoaded]);
    useEffect(() => { if (isLoaded) saveToStorage("gym_groups", groups); }, [groups, isLoaded]);
    useEffect(() => { if (isLoaded) saveToStorage("gym_coupons", coupons); }, [coupons, isLoaded]); // Added
    // Services v2
    useEffect(() => { if (isLoaded) saveToStorage("gym_services_v2", services); }, [services, isLoaded]);

    const addPackage = (pkg: Omit<Package, "id">) => setPackages(prev => [...prev, { ...pkg, id: Math.random().toString(36).substr(2, 9) }]);
    const updatePackage = (id: string, pkg: Partial<Package>) => setPackages(prev => prev.map(p => p.id === id ? { ...p, ...pkg } : p));
    const deletePackage = (id: string) => setPackages(prev => prev.filter(p => p.id !== id));

    const addStaff = (s: Omit<Staff, "id">) => setStaff(prev => [...prev, { ...s, id: Math.random().toString(36).substr(2, 9) }]);
    const updateStaff = (id: string, s: Partial<Staff>) => setStaff(prev => prev.map(staff => staff.id === id ? { ...staff, ...s } : staff));
    const deleteStaff = (id: string) => setStaff(prev => prev.filter(s => s.id !== id));

    const addMember = (m: Omit<Member, "id" | "status" | "history">): string => {
        const id = Math.random().toString(36).substr(2, 9);
        // Calculate End Date
        let endDate = undefined;
        let status: 'active' | 'passive' = 'active';

        if (m.activePackageId && m.startDate) {
            const pkg = packages.find(p => p.id === m.activePackageId);
            if (pkg && pkg.validityDays) {
                const start = new Date(m.startDate);
                const end = new Date(start);
                end.setDate(end.getDate() + pkg.validityDays);
                endDate = end.toISOString().split('T')[0];
            }
        }

        setMembers(prev => [...prev, {
            ...m,
            id,
            startDate: m.startDate || new Date().toISOString().split('T')[0],
            status,
            endDate,
            history: []
        }]);
        return id;
    };

    const updateMember = (id: string, data: Partial<Member>) => setMembers(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));

    const renewMembership = (memberId: string, newPackageId: string, startDate: string, pricePaid: number, paymentType: "cash" | "card", installments?: number) => {
        setMembers(prev => prev.map(m => {
            if (m.id !== memberId) return m;

            // Archive current membership to history
            const historyItem: MembershipHistoryItem = {
                packageId: m.activePackageId || '',
                packageName: packages.find(p => p.id === m.activePackageId)?.name || 'Unknown',
                startDate: m.startDate,
                endDate: m.endDate,
                pricePaid: m.pricePaid || 0,
                purchaseDate: new Date().toISOString()
            };

            // Calculate new end date
            const newPkg = packages.find(p => p.id === newPackageId);
            let newEndDate = undefined;
            if (newPkg && newPkg.validityDays) {
                const start = new Date(startDate);
                const end = new Date(start);
                end.setDate(end.getDate() + newPkg.validityDays);
                newEndDate = end.toISOString().split('T')[0];
            }

            return {
                ...m,
                activePackageId: newPackageId,
                remainingSessions: newPkg?.sessionCount, // Reset sessions to new package count
                startDate: startDate,
                endDate: newEndDate,
                status: 'active',
                paymentStatus: 'paid', // Assuming renewal is paid immediately or pending? Let's say paid for simplicity or pending allowed.
                pricePaid: pricePaid, // Store for history
                installments,
                history: [...(m.history || []), historyItem]
            };
        }));
    };

    const deleteMember = (id: string) => {
        setMembers(prev => prev.filter(m => m.id !== id));
    };

    const addAppointment = (a: Omit<Appointment, "id" | "status">) => {
        // Validation: Check Package Validity
        const member = members.find(m => m.id === a.memberId);
        if (member && member.activePackageId) {
            const pkg = packages.find(p => p.id === member.activePackageId);
            if (pkg && pkg.validityDays && member.startDate) {
                const start = new Date(member.startDate);
                const end = new Date(start);
                end.setDate(end.getDate() + pkg.validityDays);
                const appDate = new Date(a.date);
                if (appDate > end) {
                    alert(`Uyarı: Bu randevu paketin geçerlilik süresi dışındadır! (Son Gün: ${end.toLocaleDateString('tr-TR')})`);
                    // We allow adding but warn, or we could block. User said "Requires completion within time".
                    // Let's just Warn for flexibility.
                }
            }

            // Deduct Session
            if (member.remainingSessions !== undefined && member.remainingSessions > 0) {
                updateMember(member.id, { remainingSessions: member.remainingSessions - 1 });
            }
        }

        setAppointments(prev => [...prev, { ...a, id: Math.random().toString(36).substr(2, 9), status: 'scheduled' }]);
    };

    const updateAppointment = (id: string, a: Partial<Appointment>) => {
        setAppointments(prev => prev.map(app => {
            if (app.id === id) {
                // Check if rescheduled (date/time changed)
                if ((a.date && a.date !== app.date) || (a.time && a.time !== app.time)) {
                    // Track Reschedule Count
                    const member = members.find(m => m.id === app.memberId);
                    if (member) {
                        updateMember(member.id, { rescheduleCount: (member.rescheduleCount || 0) + 1 });
                    }
                }
                return { ...app, ...a };
            }
            return app;
        }));
    };

    const deleteAppointment = (id: string, isRefund = true) => {
        const app = appointments.find(a => a.id === id);
        if (app && isRefund) {
            const member = members.find(m => m.id === app.memberId);
            if (member && member.remainingSessions !== undefined) {
                updateMember(member.id, { remainingSessions: member.remainingSessions + 1 });
            }
        }
        setAppointments(prev => prev.filter(a => a.id !== id));
    };

    const cancelAppointment = (id: string) => {
        setAppointments(prev => prev.map(app => {
            if (app.id === id) {
                // Increment Cancel Count on Member
                const member = members.find(m => m.id === app.memberId);
                if (member) {
                    updateMember(member.id, { cancelCount: (member.cancelCount || 0) + 1 });
                }
                // Do NOT refund session (Penalty)
                return { ...app, status: 'cancelled' };
            }
            return app;
        }));
    };

    const addExpense = (e: Omit<Expense, "id">) => setExpenses(prev => [...prev, { ...e, id: Math.random().toString(36).substr(2, 9) }]);
    const deleteExpense = (id: string) => setExpenses(prev => prev.filter(e => e.id !== id));

    const addFixedExpense = (e: Omit<FixedExpense, "id">) => setFixedExpenses(prev => [...prev, { ...e, id: Math.random().toString(36).substr(2, 9) }]);
    const deleteFixedExpense = (id: string) => setFixedExpenses(prev => prev.filter(e => e.id !== id));
    const updateFixedExpense = (id: string, e: Partial<FixedExpense>) => setFixedExpenses(prev => prev.map(ex => ex.id === id ? { ...ex, ...e } : ex));

    // Local Config Logic Removed

    const updateCommissionRate = (installments: number, rate: number) => {
        setCommissionRates(prev => prev.map(c => c.installments === installments ? { ...c, rate } : c));
    };

    const addCommissionRate = (installments: number, rate: number) => {
        if (commissionRates.some(c => c.installments === installments)) return;
        setCommissionRates(prev => [...prev, { installments, rate }].sort((a, b) => a.installments - b.installments));
    };

    const deleteCommissionRate = (installments: number) => {
        setCommissionRates(prev => prev.filter(c => c.installments !== installments));
    };

    const hasPermission = (perm: Permission): boolean => {
        if (!currentUser) return false;
        const perms = ROLE_PERMISSIONS[currentUser.role];
        return perms?.includes(perm) || false;
    };

    const trainers = staff.filter(s => ['trainer', 'physio', 'manager', 'admin'].includes(s.role));

    // Store Actions
    const addProduct = (p: Omit<Product, "id">) => setProducts(prev => [...prev, { ...p, taxRate: p.taxRate || 20, id: Math.random().toString(36).substr(2, 9) }]);
    const updateProduct = (id: string, p: Partial<Product>) => setProducts(prev => prev.map(prod => prod.id === id ? { ...prod, ...p } : prod));
    const deleteProduct = (id: string) => setProducts(prev => prev.filter(p => p.id !== id));

    const addProductSale = (s: Omit<ProductSale, "id">) => {
        const newSale = { ...s, id: Math.random().toString(36).substr(2, 9) };
        setProductSales(prev => [...prev, newSale]);
        // Update stock
        s.items.forEach(item => {
            setProducts(prev => prev.map(p => {
                if (p.id === item.productId) {
                    return { ...p, stock: p.stock - item.quantity };
                }
                return p;
            }));
        });
    };

    const addCoupon = (coupon: Omit<Coupon, "id">) => {
        setCoupons(prev => [...prev, { ...coupon, id: Math.random().toString(36).substr(2, 9) }]);
    };

    const updateCoupon = (id: string, updates: Partial<Coupon>) => {
        setCoupons(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    const deleteCoupon = (id: string) => {
        setCoupons(prev => prev.filter(c => c.id !== id));
    };

    const joinGroup = (memberIds: string[], schedule: GroupSchedule, time: string, branch: Branch) => {
        // 1. Find suitable group
        let targetGroup = groups.find(g =>
            g.schedule === schedule &&
            g.time === time &&
            g.active &&
            (g.capacity - g.memberIds.length) >= memberIds.length
        );

        // 2. Create new group if none found (Local Object Creation)
        let groupToUpdate = targetGroup;
        let isNew = false;

        if (!groupToUpdate) {
            isNew = true;
            groupToUpdate = {
                id: Math.random().toString(36).substr(2, 9),
                name: `${schedule === 'MWF' ? 'Pzt-Çar-Cum' : 'Sal-Per-Cum'} ${time} Grubu ${groups.length + 1}`,
                schedule,
                time,
                memberIds: [],
                capacity: 10,
                active: true
            };
        }

        // 3. Prepare final group object
        const finalGroup = {
            ...groupToUpdate!,
            memberIds: [...(groupToUpdate?.memberIds || []), ...memberIds]
        };

        // Single State Update
        setGroups(prev => {
            if (isNew) {
                return [...prev, finalGroup];
            } else {
                return prev.map(g => g.id === finalGroup.id ? finalGroup : g);
            }
        });

        // Update members with groupId
        setMembers(prev => prev.map(m => memberIds.includes(m.id) ? { ...m, groupId: finalGroup.id } : m));

        // 4. Generate Appointments
        // Calculate dates for the next 30 days based on schedule
        const newAppointments: Appointment[] = [];
        const today = new Date();
        const endDate = new Date();
        endDate.setDate(today.getDate() + 30); // Generate for 1 month

        let loopDate = new Date(today);
        while (loopDate <= endDate) {
            const day = loopDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
            let isClassDay = false;
            if (schedule === 'MWF' && (day === 1 || day === 3 || day === 5)) isClassDay = true;
            if (schedule === 'TTS' && (day === 2 || day === 4 || day === 6)) isClassDay = true;

            if (isClassDay) {
                const dateStr = loopDate.toISOString().split('T')[0];
                memberIds.forEach(mid => {
                    // Check if member has sessions left (optional optimization, but let's generate schedule first)
                    newAppointments.push({
                        id: Math.random().toString(36).substr(2, 9),
                        memberId: mid,
                        trainerId: 'trainer1', // Placeholder: Needs to be assigned or picked. For now assigning default trainer.
                        date: dateStr,
                        time: time,
                        type: branch,
                        status: 'scheduled',
                        description: 'Otomatik Grup Dersi'
                    });
                });
            }
            loopDate.setDate(loopDate.getDate() + 1);
        }

        setAppointments(prev => [...prev, ...newAppointments]);

        // Note: Deducting sessions is handled when they attend or we can batch deduct now? 
        // Usually session count is deducted on attendance or booking. Since these are booked, we update count.
        // We'll trust the "addAppointment" logic or manually update here to be safe and consistent.
        // For mass update:
        setMembers(prev => prev.map(m => {
            if (memberIds.includes(m.id)) {
                const newCount = (m.remainingSessions || 0) - newAppointments.filter(a => a.memberId === m.id).length;
                return { ...m, remainingSessions: newCount > 0 ? newCount : 0 };
            }
            return m;
        }));
    };

    if (!isLoaded) return null;

    return (
        <GymContext.Provider value={{
            packages, addPackage, deletePackage, updatePackage,

            services, addService, updateService, deleteService,

            commissionRates, addCommissionRate, updateCommissionRate, deleteCommissionRate,
            staff, addStaff, deleteStaff, updateStaff, trainers,
            currentUser, setCurrentUser, hasPermission,
            members, addMember, updateMember, deleteMember, renewMembership,
            appointments, addAppointment, deleteAppointment, cancelAppointment, updateAppointment,
            expenses, addExpense, deleteExpense,
            fixedExpenses, addFixedExpense, deleteFixedExpense, updateFixedExpense,
            products, addProduct, updateProduct, deleteProduct,
            productSales, addProductSale,
            coupons, addCoupon, updateCoupon, deleteCoupon,
            groups, joinGroup
        }}>
            {children}
        </GymContext.Provider>
    );
}

export function useGym() {
    const context = useContext(GymContext);
    if (context === undefined) {
        throw new Error("useGym must be used within a GymProvider");
    }
    return context;
}

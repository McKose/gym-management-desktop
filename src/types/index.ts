export type PackageType = "ABONMAN" | "DERS_PAKETI";
export type ServiceCategory = "SELF_SERVICE" | "COACHING";
export type SessionFormat = "BIREYSEL" | "DUET" | "GRUP" | "SERBEST";
export type Branch = "fitness" | "reformer" | "pilates" | "yoga" | "functional" | "cardio" | "boxing" | "swimming";
export type GroupSchedule = "MWF" | "TTS";

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
    serviceId: string;
    name: string;
    type: PackageType;
    price: number;
    sessionCount?: number;
    sessionFormat?: SessionFormat;
    validityDays?: number;
    validityRequired: boolean;
    unitPrice?: number;
    branch?: Branch;
    durationMonths?: number;
    isActive: boolean;
    sortOrder: number;
}

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
    hireDate?: string;
    password?: string;
    paymentConfig?: {
        model: 'salaried' | 'commission' | 'partner';
        salaryAmount?: number;
        commissionRate?: number;
        profitShareRate?: number;
    };
}

export interface Measurement {
    date: string;
    weight: number;
    height: number;
    shoulders: number;
    arm: number;
    chest: number;
    waist: number;
    hips: number;
    leg: number;
}

export interface HealthProfile {
    cardio: string[];
    ortho: string[];
    metabolic: string[];
    respiratory: string[];
    special: string[];
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
    paymentType?: "cash" | "card";
    paymentStatus?: "paid" | "pending";
    installments?: number;
    pricePaid?: number;
    groupId?: string;
    cancelCount?: number;
    rescheduleCount?: number;
    status: 'active' | 'passive';
    endDate?: string;
    history?: MembershipHistoryItem[];
    measurements?: Measurement[];
    healthProfile?: HealthProfile;
}

export interface Group {
    id: string;
    name: string;
    schedule: GroupSchedule;
    time: string;
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
    installments?: number;
    paidInstallments?: number;
    status?: "pending" | "paid";
}

export interface FixedExpense {
    id: string;
    title: string;
    amount: number;
    description?: string;
    dayOfMonth: number;
    type: 'fixed' | 'variable';
    endDate?: string;
}

export interface Coupon {
    id: string;
    code: string;
    discountRate: number;
    isActive: boolean;
}

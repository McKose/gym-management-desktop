"use client";

import { useGym, Expense, Product, Staff } from "@/context/GymContext";
import { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, TrendingUp, TrendingDown, DollarSign, Wallet, CreditCard, Banknote, Calendar, ArrowRight, ArrowDownRight, ArrowUpRight, Download, Edit2 } from "lucide-react";
import { createPortal } from "react-dom";
import { downloadCSV } from "@/utils/export";
import Modal from "@/components/Modal";

export default function FinancialsPage() {
    const {
        expenses, addExpense, deleteExpense,
        fixedExpenses, addFixedExpense, deleteFixedExpense,
        members, packages, productSales,
        products, staff, trainers,
        appointments,
        hasPermission
    } = useGym();

    // Date Filter
    const [selectedDate, setSelectedDate] = useState("");

    useEffect(() => {
        setSelectedDate(new Date().toISOString().slice(0, 7));
    }, []); // YYYY-MM
    const [year, month] = selectedDate.split('-').map(Number); // 2025, 12

    // Permissions
    const canView = hasPermission("view_stats");
    const canManage = hasPermission("manage_financials");

    // Modal State
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [expenseType, setExpenseType] = useState<'normal' | 'fixed' | 'variable'>('normal');
    const [newExpense, setNewExpense] = useState({
        title: "",
        amount: 0,
        category: "other",
        date: new Date().toISOString().slice(0, 10),
        dayOfMonth: 1,
        installments: 1,
        paidInstallments: 1,
        status: "paid" as "pending" | "paid"
    });

    // Bill Payment Modal State
    const [isBillPaymentModalOpen, setIsBillPaymentModalOpen] = useState(false);
    const [payingBill, setPayingBill] = useState<{ id: string, title: string } | null>(null);
    const [billAmount, setBillAmount] = useState<number>(0);

    // Edit Expense Modal State
    const [isEditExpenseModalOpen, setIsEditExpenseModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [editExpenseForm, setEditExpenseForm] = useState({
        title: "",
        amount: 0,
        category: "other",
        date: "",
        installments: 1,
        paidInstallments: 1,
        status: "paid" as "pending" | "paid"
    });

    // Open edit modal
    const openEditExpenseModal = (expense: Expense) => {
        setEditingExpense(expense);
        setEditExpenseForm({
            title: expense.title,
            amount: expense.amount,
            category: expense.category,
            date: expense.date,
            installments: expense.installments || 1,
            paidInstallments: expense.paidInstallments || 1,
            status: expense.status || "paid"
        });
        setIsEditExpenseModalOpen(true);
    };

    // Handle edit submit
    const handleEditExpenseSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingExpense) {
            deleteExpense(editingExpense.id);
            addExpense({
                ...editExpenseForm,
                id: editingExpense.id
            } as any);
            setIsEditExpenseModalOpen(false);
            setEditingExpense(null);
            alert("Gider güncellendi.");
        }
    };

    // Toggle Installment Payment
    const handleTogglePayment = (expense: Expense) => {
        const nextPaid = (expense.paidInstallments || 1) + 1;
        const total = expense.installments || 1;
        const newStatus = nextPaid >= total ? "paid" : "pending";

        deleteExpense(expense.id);
        addExpense({
            ...expense,
            paidInstallments: nextPaid > total ? total : nextPaid,
            status: newStatus
        } as any);
    };

    // --- CALCULATIONS ---

    // 1. Income (Gelirler)
    const monthlyMembershipIncome = useMemo(() => {
        return members
            .filter(m => m.startDate && m.startDate.startsWith(selectedDate))
            .reduce((sum, m) => {
                const pkg = packages.find(p => p.id === m.activePackageId);
                return sum + (pkg ? pkg.price : 0);
            }, 0);
    }, [members, packages, selectedDate]);

    const monthlyProductIncome = useMemo(() => {
        return productSales
            .filter(s => s.date && s.date.startsWith(selectedDate))
            .reduce((sum, s) => sum + s.totalAmount, 0);
    }, [productSales, selectedDate]);

    const totalIncome = monthlyMembershipIncome + monthlyProductIncome;

    // 2. Expenses (İşletme Giderleri)
    const currentMonthExpenses = useMemo(() => {
        return expenses.filter(e => e.date && e.date.startsWith(selectedDate));
    }, [expenses, selectedDate]);

    // Dynamic Stopaj (20% of Rent)
    const rentAmount = useMemo(() => {
        const rentExpense = fixedExpenses.find(e => e.title.toLowerCase().includes("kira"));
        return rentExpense ? rentExpense.amount : 0;
    }, [fixedExpenses]);

    const monthlyStopaj = useMemo(() => {
        if (!rentAmount) return 0;
        // Calculation: 20% of rent amount is standard Stopaj in Turkey
        return rentAmount * 0.20;
    }, [rentAmount]);

    // Fixed Expenses
    const totalFixedExpenses = useMemo(() => {
        return fixedExpenses.reduce((sum, e) => sum + e.amount, 0);
    }, [fixedExpenses]);

    // Variable Expenses Sums
    const expenseSums = useMemo(() => {
        const sums = {
            stock_purchase: 0,
            consumable: 0,
            other: 0
        };
        currentMonthExpenses.forEach(e => {
            const cat = e.category as string;
            if (cat === 'stock_purchase') sums.stock_purchase += e.amount;
            else if (cat === 'consumable') sums.consumable += e.amount;
            else if (cat !== 'tax') sums.other += e.amount; // Taxes handled separately
        });
        return sums;
    }, [currentMonthExpenses]);

    // Total Operating Expenses (Minus Taxes/Staff)
    const totalOperatingExpenses = totalFixedExpenses + expenseSums.stock_purchase + expenseSums.consumable + expenseSums.other;

    // 3. Staff Costs (Maaşlar + Primler)
    // We calculate this early to deduct before Tax/Profit
    const staffCosts = useMemo(() => {
        let totalSalaries = 0;
        let totalCommissions = 0;

        const staffEarnings_ = staff.map(st => {
            const payConf = st.paymentConfig || { model: 'commission' };
            const isTrainer = ['trainer', 'physio', 'manager', 'admin'].includes(st.role);

            // Commission
            const trAppointments = appointments.filter(a =>
                a.trainerId === st.id &&
                a.date &&
                a.date.startsWith(selectedDate) &&
                a.status !== 'cancelled'
            );

            let lessonEarning = 0;
            if (isTrainer) {
                trAppointments.forEach(appt => {
                    const member = members.find(m => m.id === appt.memberId);
                    if (member && member.activePackageId) {
                        const pkg = packages.find(p => p.id === member.activePackageId);
                        if (pkg) {
                            const unitPrice = pkg.price / (pkg.sessionCount || 1);
                            const rate = (payConf.commissionRate || st.commissionRate || 0);
                            lessonEarning += unitPrice * (rate / 100);
                        }
                    }
                });
            }

            // Fixed Salary
            const salary = payConf.model === 'salaried' ? (payConf.salaryAmount || 0) : 0;

            // Only sum up if NOT partner (Partners get share of Net Profit, not operational cost unless mixed)
            // But wait, "Ücretli" gets salary. "Ortak" gets profit share.
            // If an "Ortak" also has a salary defined, it should be an expense.
            // Generally Partner Share is distribution of profit, Salary is expense.

            totalSalaries += salary;
            totalCommissions += lessonEarning;

            return {
                id: st.id,
                name: st.name,
                role: st.role,
                model: payConf.model,
                count: trAppointments.length,
                lessonEarning,
                salary,
                // Profit share calc needs Final Net Profit, so we just return partial here
                profitShareRate: payConf.model === 'partner' ? (payConf.profitShareRate || 0) : 0
            };
        });

        return {
            totalSalaries,
            totalCommissions,
            total: totalSalaries + totalCommissions,
            detail: staffEarnings_
        };
    }, [staff, appointments, members, packages, selectedDate]);

    // 4. Taxes (KDV + Stopaj + Kurumlar Vergisi)
    const taxCalc = useMemo(() => {
        // VAT Liability (Estimated 20% on all Income)
        // Ideally: Product Sales have specific taxRate. Memberships default 20%.
        let vatLiability = 0;

        // Membership VAT
        vatLiability += monthlyMembershipIncome * 0.20; // Assuming 18% or 20%

        // Product VAT
        productSales.filter(s => s.date && s.date.startsWith(selectedDate)).forEach(s => {
            // Simplify: 20% VAT on total amount
            vatLiability += s.totalAmount * 0.20;
        });

        const stopaj = monthlyStopaj;

        // Corporate Tax Base = Income - Ops Expenses - Staff Costs - VAT - Stopaj
        // Note: VAT collected is liability, but expense invoices also have VAT to deduct (KDV İndirimi).
        // For simplicity in this dashboard: We treat "VAT Liability" as a pure cashout (expense).
        const preTaxProfit = totalIncome - totalOperatingExpenses - staffCosts.total - vatLiability - stopaj;

        const corporateTax = preTaxProfit > 0 ? preTaxProfit * 0.25 : 0; // 25%

        return {
            vat: vatLiability,
            stopaj,
            corporate: corporateTax,
            total: vatLiability + stopaj + corporateTax
        };
    }, [totalIncome, monthlyMembershipIncome, productSales, selectedDate, monthlyStopaj, totalOperatingExpenses, staffCosts.total]);


    // 5. Final Net Profit
    const finalNetProfit = totalIncome - totalOperatingExpenses - staffCosts.total - taxCalc.total;

    // 6. Partner Distribution
    const staffCompleteEarnings = useMemo(() => {
        return staffCosts.detail.map(s => {
            const profitShare = s.profitShareRate > 0 && finalNetProfit > 0
                ? finalNetProfit * (s.profitShareRate / 100)
                : 0;
            return {
                ...s,
                profitShare,
                totalEarnings: s.lessonEarning + s.salary + profitShare
            };
        });
    }, [staffCosts.detail, finalNetProfit]);


    const handleExportFinancials = () => {
        // 1. Summary Data
        const summaryData = [
            { Kalem: "Toplam Gelir", Tutar: totalIncome },
            { Kalem: "İşletme Giderleri", Tutar: totalOperatingExpenses },
            { Kalem: "Personel Maliyeti (Maaş+Prim)", Tutar: staffCosts.total },
            { Kalem: "Vergi Öncesi Kar", Tutar: totalIncome - totalOperatingExpenses - staffCosts.total }, // This is preTaxProfit from taxCalc, but re-calculated here for clarity in export
            { Kalem: "Toplam Vergi", Tutar: taxCalc.total },
            { Kalem: "NET KAR (Dağıtılabilir)", Tutar: finalNetProfit }
        ];
        downloadCSV(summaryData, `Finansal_Ozet_${selectedDate}.csv`);
    };

    const handleExportStaff = () => {
        const data = staffCompleteEarnings.map(s => ({
            "Personel": s.name,
            "Rol": s.role,
            "Model": s.model === 'partner' ? 'Ortak' : s.model === 'salaried' ? 'Maaşlı' : 'Prim',
            "Ders Hakediş / Maaş": s.salary + s.lessonEarning,
            "Kar Payı": s.profitShare || 0,
            "TOPLAM ÖDEME": s.totalEarnings
        }));
        downloadCSV(data, `Personel_Odemeleri_${selectedDate}.csv`);
    };

    // --- SUMMARIES FOR DISPLAY ---

    // Membership sales summary
    const monthlyMembershipSummary = useMemo(() => {
        const summary: Record<string, number> = {};
        members.forEach(m => {
            if (m.startDate && m.activePackageId) {
                const [year, month] = m.startDate.split('-').map(Number);
                if (year === Number(selectedDate.split('-')[0]) && month === Number(selectedDate.split('-')[1])) {
                    const pkg = packages.find(p => p.id === m.activePackageId);
                    if (pkg) {
                        summary[pkg.name] = (summary[pkg.name] || 0) + 1;
                    }
                }
            }
        });
        return summary;
    }, [members, packages, selectedDate]);

    // Product sales summary
    const monthlyProductSummary = useMemo(() => {
        let gross = 0;
        let cost = 0;
        productSales.forEach(s => {
            if (s.date && s.date.startsWith(selectedDate)) {
                gross += s.totalAmount;
                s.items.forEach(item => {
                    const prod = products.find(p => p.id === item.productId);
                    if (prod) {
                        cost += prod.cost * item.quantity;
                    }
                });
            }
        });
        return { gross, cost, profit: gross - cost };
    }, [productSales, products, selectedDate]);


    if (!canView) return <div className="p-10 text-center text-zinc-500">Yetkiniz yok.</div>;

    return (
        <div className="min-h-screen pb-20 px-[30px]">
            {/* Expense Modal (Unchanged Logically) */}
            {isExpenseModalOpen && (
                <Modal
                    isOpen={isExpenseModalOpen}
                    onClose={() => setIsExpenseModalOpen(false)}
                    title="Gider Ekle"
                    width="450px"
                >
                    <div className="flex gap-2 mb-4 bg-zinc-100 p-1 rounded-lg">
                        {(['normal', 'fixed', 'variable'] as const).map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setExpenseType(t)}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${expenseType === t ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                            >
                                {t === 'normal' ? 'Normal' : t === 'fixed' ? 'Sabit' : 'Fatura'}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={(e) => {
                        e.preventDefault();
                        if (expenseType === 'normal') {
                            addExpense({ ...newExpense, status: newExpense.paidInstallments >= newExpense.installments ? "paid" : "pending" } as any);
                        } else {
                            addFixedExpense({
                                title: newExpense.title,
                                amount: newExpense.amount,
                                dayOfMonth: newExpense.dayOfMonth,
                                type: expenseType
                            } as any);
                        }
                        setIsExpenseModalOpen(false);
                    }} className="space-y-3">
                        <input autoFocus type="text" placeholder="Gider Adı (Kira, Elektrik vb.)" required value={newExpense.title} onChange={e => setNewExpense({ ...newExpense, title: e.target.value })} className="w-full p-2 border rounded" />

                        {(expenseType !== 'variable') && (
                            <input type="number" placeholder="Tutar" required={expenseType === 'fixed'} value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: Number(e.target.value) })} className="w-full p-2 border rounded" />
                        )}

                        {expenseType === 'normal' && (
                            <>
                                <select value={newExpense.category} onChange={e => setNewExpense({ ...newExpense, category: e.target.value })} className="w-full p-2 border rounded">
                                    <option value="other">Diğer / Genel</option>
                                    <option value="stock_purchase">Ürün/Stok Alımı</option>
                                    <option value="consumable">Sarf Malzeme</option>
                                    <option value="bills">Fatura</option>
                                </select>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] text-zinc-400 font-bold uppercase">Toplam Taksit</label>
                                        <input type="number" min="1" required value={newExpense.installments} onChange={e => setNewExpense({ ...newExpense, installments: Number(e.target.value) })} className="w-full p-2 border rounded" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-zinc-400 font-bold uppercase">Ödenmiş Taksit</label>
                                        <input type="number" min="0" required value={newExpense.paidInstallments} onChange={e => setNewExpense({ ...newExpense, paidInstallments: Number(e.target.value) })} className="w-full p-2 border rounded" />
                                    </div>
                                </div>
                                <input type="date" required value={newExpense.date} onChange={e => setNewExpense({ ...newExpense, date: e.target.value })} className="w-full p-2 border rounded" />
                            </>
                        )}

                        {expenseType !== 'normal' && (
                            <div>
                                <label className="text-[10px] text-zinc-400 font-bold uppercase">Her Ayın Kaçında? (Örn: 17)</label>
                                <input type="number" min="1" max="31" required value={newExpense.dayOfMonth} onChange={e => setNewExpense({ ...newExpense, dayOfMonth: Number(e.target.value) })} className="w-full p-2 border rounded" />
                                {expenseType === 'variable' && (
                                    <p className="text-[10px] text-zinc-500 mt-1 italic">* Faturalar her ay ödendiğinde tutarı girilir.</p>
                                )}
                            </div>
                        )}

                        <button type="submit" className="w-full bg-black text-white py-2 rounded font-bold">
                            {expenseType === 'normal' ? 'Gider Kaydet' : expenseType === 'fixed' ? 'Sabit Gider Tanımla' : 'Fatura Hatırlatıcı Ekle'}
                        </button>
                    </form>
                </Modal>
            )}

            {/* Bill Payment Modal */}
            {isBillPaymentModalOpen && payingBill && (
                <Modal
                    isOpen={isBillPaymentModalOpen}
                    onClose={() => setIsBillPaymentModalOpen(false)}
                    title={`${payingBill.title} Ödemesi`}
                    width="400px"
                >
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        addExpense({
                            title: payingBill.title,
                            amount: billAmount,
                            category: 'bill',
                            date: new Date().toISOString().slice(0, 10),
                            installments: 1,
                            paidInstallments: 1,
                            status: 'paid'
                        });
                        setIsBillPaymentModalOpen(false);
                        setPayingBill(null);
                        setBillAmount(0);
                        alert("Fatura ödendi ve gidere işlendi.");
                    }} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-zinc-500 block mb-1">Fatura Tutarı (₺)</label>
                            <input
                                autoFocus
                                type="number"
                                required
                                value={billAmount || ""}
                                onChange={e => setBillAmount(Number(e.target.value))}
                                className="w-full p-2 border rounded text-lg font-bold"
                                placeholder="0"
                            />
                        </div>
                        <button type="submit" className="w-full bg-emerald-600 text-white py-2 rounded font-bold hover:bg-emerald-700 transition-colors">
                            Ödemeyi Onayla
                        </button>
                    </form>
                </Modal>
            )}

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-black">Finansal Durum</h1>
                        <p className="text-zinc-500 mt-1">Gelir, Gider, Vergi ve Net Kar Analizi.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <input
                            type="month"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-white border border-zinc-200 p-2 rounded-lg font-bold text-zinc-700 focus:outline-none focus:ring-2 focus:ring-black"
                        />
                        <button onClick={handleExportFinancials} className="btn-secondary flex items-center gap-2 text-sm">
                            <Download size={16} /> Özet İndir
                        </button>
                        <button onClick={handleExportStaff} className="btn-secondary flex items-center gap-2 text-sm">
                            <Download size={16} /> Personel İndir
                        </button>
                        {canManage && (
                            <button onClick={() => setIsExpenseModalOpen(true)} className="btn-primary flex items-center gap-2">
                                <Plus size={18} /> Gider Ekle
                            </button>
                        )}
                    </div>
                </div>

                {/* MAIN DASHBOARD */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* LEFT: PROFIT & INCOME */}
                    <div className="space-y-6">

                        {/* NET PROFIT (THE BIG RESULT) */}
                        <div className="bg-black text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
                            <div className="relative z-10">
                                <h2 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">{selectedDate} Dağıtılabilir Net Kar</h2>
                                <div className={`text-5xl font-bold tracking-tight mb-6 ${finalNetProfit < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {finalNetProfit.toLocaleString('tr-TR')} ₺
                                </div>

                                {/* High Level Breakdown */}
                                <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm pt-6 border-t border-white/10">
                                    <div className="flex justify-between">
                                        <span className="text-zinc-400">Toplam Gelir</span>
                                        <span className="font-bold text-emerald-400">+{totalIncome.toLocaleString('tr-TR')} ₺</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-400">İşletme Giderleri</span>
                                        <span className="font-bold text-red-400">-{totalOperatingExpenses.toLocaleString('tr-TR')} ₺</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-400">Personel Maaş/Prim</span>
                                        <span className="font-bold text-red-400">-{staffCosts.total.toLocaleString('tr-TR')} ₺</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-400">Toplam Vergi</span>
                                        <span className="font-bold text-red-400">-{taxCalc.total.toLocaleString('tr-TR')} ₺</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* DETAILED BREAKDOWN */}
                        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-zinc-100 bg-zinc-50">
                                <h3 className="font-bold text-sm text-black uppercase">Hesap Detayı (Waterfall)</h3>
                            </div>
                            <div className="p-4 space-y-3 text-sm">
                                {/* Income */}
                                <div className="flex justify-between font-bold">
                                    <span>TOPLAM GELİR</span>
                                    <span>{totalIncome.toLocaleString('tr-TR')} ₺</span>
                                </div>
                                <div className="pl-4 text-xs text-zinc-500 space-y-1">
                                    <div className="flex justify-between"><span>Üyelik Satışları</span><span>{monthlyMembershipIncome.toLocaleString('tr-TR')} ₺</span></div>
                                    <div className="flex justify-between"><span>Ürün Satışları</span><span>{monthlyProductIncome.toLocaleString('tr-TR')} ₺</span></div>
                                </div>
                                <hr className="border-dashed border-zinc-200" />

                                {/* Deductions */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-red-600 font-medium">
                                        <span>- İŞLETME GİDERLERİ</span>
                                        <span>{totalOperatingExpenses.toLocaleString('tr-TR')} ₺</span>
                                    </div>
                                    <div className="flex justify-between text-red-600 font-medium">
                                        <span>- PERSONEL GİDERLERİ</span>
                                        <span>{staffCosts.total.toLocaleString('tr-TR')} ₺</span>
                                    </div>
                                    <div className="flex justify-between text-red-600 font-medium">
                                        <span>- VERGİLER</span>
                                        <span>{taxCalc.total.toLocaleString('tr-TR')} ₺</span>
                                    </div>
                                    <div className="pl-4 text-xs text-zinc-500 space-y-1">
                                        <div className="flex justify-between"><span>KDV (%20)</span><span>{taxCalc.vat.toLocaleString('tr-TR')} ₺</span></div>
                                        <div className="flex justify-between"><span>Stopaj (%20)</span><span>{taxCalc.stopaj.toLocaleString('tr-TR')} ₺</span></div>
                                        <div className="flex justify-between"><span>Kurumlar V. (%25)</span><span>{taxCalc.corporate.toLocaleString('tr-TR')} ₺</span></div>
                                    </div>
                                </div>
                                <hr className="border-black" />

                                {/* Final */}
                                <div className="flex justify-between font-bold text-lg">
                                    <span>NET KAR</span>
                                    <span className={finalNetProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}>{finalNetProfit.toLocaleString('tr-TR')} ₺</span>
                                </div>
                            </div>
                        </div>

                        {/* Staff Earnings Table */}
                        <div className="bg-white p-4 rounded-xl border border-zinc-200 overflow-x-auto">
                            <h3 className="font-bold text-sm mb-3 uppercase tracking-tight">Personel Hakedişleri (Dağıtım)</h3>
                            <table className="w-full text-left text-[11px]">
                                <thead className="bg-zinc-50 border-b border-zinc-100 uppercase text-zinc-400">
                                    <tr>
                                        <th className="p-2">Personel</th>
                                        <th className="p-2 text-right">Maaş + Prim</th>
                                        <th className="p-2 text-right">Kar Payı</th>
                                        <th className="p-2 text-right">Toplam Ödeme</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {staffCompleteEarnings.filter(e => e.totalEarnings > 0 || e.model === 'salaried' || e.model === 'partner').map(row => (
                                        <tr key={row.id} className="hover:bg-zinc-50 transition-colors">
                                            <td className="p-2 font-medium text-zinc-800">
                                                {row.name}
                                                <div className="text-[10px] text-zinc-400 capitalize">{row.model}</div>
                                            </td>
                                            <td className="p-2 text-right text-zinc-600">
                                                {(row.salary + row.lessonEarning).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                                            </td>
                                            <td className="p-2 text-right text-emerald-600 font-medium">
                                                {row.profitShare > 0 ? row.profitShare.toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + ' ₺' : '-'}
                                                {row.profitShareRate > 0 && <span className="text-[9px] text-zinc-400 block">(%{row.profitShareRate})</span>}
                                            </td>
                                            <td className="p-2 text-right font-bold text-black">
                                                {row.totalEarnings.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                    </div>


                    {/* RIGHT: EXPENSE MANAGEMENT (Simplified View) */}
                    <div className="space-y-6">
                        {/* Payments & Installments Section */}
                        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
                            <div className="p-4 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center">
                                <h3 className="font-bold text-sm text-black uppercase">Taksitli Ödemeler</h3>
                                <CreditCard size={18} className="text-zinc-300" />
                            </div>
                            <div className="divide-y divide-zinc-100">
                                {expenses.filter(e => (e.installments || 1) > 1).map(exp => (
                                    <div key={exp.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                                        <div>
                                            <div className="font-bold text-sm">{exp.title}</div>
                                            <div className="text-[10px] text-zinc-400 uppercase tracking-tighter">
                                                {exp.paidInstallments} / {exp.installments} Taksit Ödendi
                                                <span className={`ml - 2 px - 1 rounded ${exp.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'} `}>
                                                    {exp.status === 'paid' ? 'Tamamlandı' : 'Beklemede'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <div className="font-bold text-sm">{exp.amount} ₺</div>
                                                <div className="text-[10px] text-zinc-400 italic">Toplam Tutar</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {exp.status !== 'paid' && (
                                                    <button
                                                        onClick={() => handleTogglePayment(exp)}
                                                        className="px-2 py-1 bg-black text-white text-[10px] font-bold rounded hover:bg-zinc-800 transition-colors"
                                                    >
                                                        Taksit Öde
                                                    </button>
                                                )}
                                                <button onClick={() => openEditExpenseModal(exp)} className="p-1 hover:bg-zinc-100 rounded text-zinc-300 hover:text-blue-500">
                                                    <Edit2 size={12} />
                                                </button>
                                                <button onClick={() => deleteExpense(exp.id)} className="p-1 hover:bg-red-50 rounded text-zinc-300 hover:text-red-500">
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {expenses.filter(e => (e.installments || 1) > 1).length === 0 && (
                                    <div className="p-8 text-center text-zinc-400 text-xs italic">Taksitli ödeme bulunamadı.</div>
                                )}
                            </div>
                        </div>

                        {/* Monthly Expenses List */}
                        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
                            <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex justify-between items-center">
                                <h3 className="font-bold text-black text-sm uppercase">Tüm Giderler (Aylık)</h3>
                                <span className="text-xs font-bold text-red-500">-{totalOperatingExpenses.toLocaleString('tr-TR')} ₺</span>
                            </div>
                            <div className="divide-y divide-zinc-100 max-h-[400px] overflow-y-auto">
                                {[...currentMonthExpenses].map((e: any) => (
                                    <div key={e.id} className="p-3 px-4 flex justify-between items-center hover:bg-zinc-50">
                                        <div>
                                            <div className="font-medium text-xs text-zinc-800">{e.title}</div>
                                            <div className="text-[10px] text-zinc-400 uppercase tracking-tighter">{e.dayOfMonth ? 'Sabit Gider' : e.category}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-red-500 text-xs text-right">-{e.amount} ₺</span>
                                            {e.category && (
                                                <button onClick={() => deleteExpense(e.id)} className="p-1 hover:bg-red-50 rounded text-zinc-300 hover:text-red-500 transition-colors">
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Fixed Expenses & Bill Reminders Section */}
                        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
                            <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex justify-between items-center">
                                <h3 className="font-bold text-black text-sm uppercase">Sabit Giderler & Faturalar</h3>
                                <Calendar size={18} className="text-zinc-300" />
                            </div>
                            <div className="divide-y divide-zinc-100">
                                {fixedExpenses.map((e) => (
                                    <div key={e.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 flex items-center justify-center bg-zinc-100 rounded-lg text-zinc-500 font-bold text-xs">
                                                {e.dayOfMonth}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm text-zinc-800">{e.title}</div>
                                                <div className="text-[10px] text-zinc-400 uppercase">
                                                    {e.type === 'fixed' ? 'Sabit Gider (Otomatik)' : 'Fatura (Hatırlatıcı)'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                {e.type === 'fixed' ? (
                                                    <div className="font-bold text-sm text-red-500">-{e.amount} ₺</div>
                                                ) : (
                                                    <div className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">Ödeme Bekliyor</div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {e.type === 'variable' && (
                                                    <button
                                                        onClick={() => {
                                                            setPayingBill({ id: e.id, title: e.title });
                                                            setIsBillPaymentModalOpen(true);
                                                        }}
                                                        className="p-1.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 transition-colors"
                                                        title="Fatura Öde"
                                                    >
                                                        <Banknote size={14} />
                                                    </button>
                                                )}
                                                <button onClick={() => deleteFixedExpense(e.id)} className="p-1.5 hover:bg-red-50 rounded text-zinc-300 hover:text-red-500 transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {fixedExpenses.length === 0 && (
                                    <div className="p-8 text-center text-zinc-400 text-xs italic">Tanımlı sabit gider veya fatura bulunamadı.</div>
                                )}
                            </div>
                        </div>

                    </div>

                </div>

            </div>
        </div>
    );
}

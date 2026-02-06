"use client";

import { useGym, Product, Coupon, CommissionRate } from "@/context/GymContext";
import { useState } from "react";
import { Plus, Search, Trash2, ShoppingCart, Minus, CreditCard, Banknote, Landmark, Percent, Edit2 } from "lucide-react";
import Modal from "@/components/Modal";

export default function StorePage() {
    const {
        products, addProduct, updateProduct,
        addProductSale, currentUser, hasPermission, commissionRates, coupons
    } = useGym();



    // Modals
    const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [editForm, setEditForm] = useState({
        name: "",
        category: "supplement" as Product['category'],
        price: 0,
        stock: 0,
        cost: 0,
        taxRate: 20
    });

    // Stock Update State
    const [stockUpdates, setStockUpdates] = useState<Record<string, { addStock: number, newCost: number }>>({});

    // Cart State
    const [cart, setCart] = useState<{ product: Product, quantity: number }[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
    const [installment, setInstallment] = useState(1);

    // Inventory Form State
    const [prodName, setProdName] = useState("");
    const [prodCategory, setProdCategory] = useState<Product['category']>("supplement");
    const [prodPrice, setProdPrice] = useState(0);
    const [prodStock, setProdStock] = useState(0);
    const [prodCost, setProdCost] = useState(0);
    const [prodTaxRate, setProdTaxRate] = useState<number>(20);

    // Search & Filter
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState<string>("all");

    // Discount State
    const [manualDiscount, setManualDiscount] = useState<number | "">("");
    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

    // Calculator Logic
    // Calculator Logic
    // 1. Calculate Raw Gross Total (Price + VAT)
    const rawGrossTotal = cart.reduce((acc, item) => {
        const itemNet = item.product.price * item.quantity;
        const itemVat = itemNet * ((item.product.taxRate || 20) / 100);
        return acc + itemNet + itemVat;
    }, 0);

    // 2. Determine Discount
    // Coupon might be percentage of Gross or Net? Usually Gross if applied at checkout. Assuming Gross for consistency.
    const couponDiscount = appliedCoupon ? (rawGrossTotal * appliedCoupon.discountRate / 100) : 0;
    const totalDiscount = (Number(manualDiscount) || 0) + couponDiscount;

    // 3. Apply Discount to Gross logic
    const effectiveGrossTotal = Math.max(0, rawGrossTotal - totalDiscount);
    const discountRatio = rawGrossTotal > 0 ? (effectiveGrossTotal / rawGrossTotal) : 1;

    // 4. Back-calculate Breakdown
    const vatBreakdown = cart.reduce((acc, item) => {
        const originalItemNet = item.product.price * item.quantity;
        const rate = item.product.taxRate || 20;
        const originalItemGross = originalItemNet * (1 + rate / 100);

        const discountedItemGross = originalItemGross * discountRatio;
        const discountedItemNet = discountedItemGross / (1 + rate / 100);
        const itemVat = discountedItemGross - discountedItemNet;

        acc[rate] = (acc[rate] || 0) + itemVat;
        return acc;
    }, {} as Record<number, number>);

    const totalVat = Object.values(vatBreakdown).reduce((a, b) => a + b, 0);
    const discountedSubTotal = effectiveGrossTotal - totalVat; // New Net Subtotal

    const commissionRate = paymentMethod === 'card'
        ? (commissionRates.find((c: CommissionRate) => c.installments === installment)?.rate || 0)
        : 0;

    // effectiveGrossTotal IS the Total With VAT
    const totalWithVat = effectiveGrossTotal;
    const commissionAmount = totalWithVat * (commissionRate / 100);
    const finalTotal = totalWithVat + commissionAmount;

    // Handlers
    const handleApplyCoupon = () => {
        const coupon = coupons.find((c: Coupon) => c.code === couponCode && c.isActive);
        if (coupon) {
            setAppliedCoupon(coupon);
            setCouponCode("");
        } else {
            alert("Geçersiz kupon kodu!");
        }
    };

    const handleCheckout = () => {
        // ... existing checkout logic ...
        // We will updated checkout logic in place
        if (cart.length === 0) return;

        const saleData = {
            date: new Date().toISOString(),
            items: cart.map(c => ({
                productId: c.product.id,
                name: c.product.name,
                quantity: c.quantity,
                priceAtSale: c.product.price
            })),
            totalAmount: finalTotal,
            staffId: currentUser?.id || 'unknown'
        };

        addProductSale(saleData);
        setCart([]);
        setManualDiscount("");
        setAppliedCoupon(null);
        alert(`Satış Başarılı! Toplam: ${finalTotal.toLocaleString('tr-TR')} ₺`);
    };

    const canManage = hasPermission("manage_settings");

    // --- STYLES REMOVED (Converted to Tailwind) ---

    // --- HANDLERS ---

    // Stock Update Handlers
    const handleStockUpdateChange = (id: string, field: 'addStock' | 'newCost', value: number) => {
        setStockUpdates(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value,
                ...(field === 'addStock' ? { newCost: prev[id]?.newCost ?? products.find((p: Product) => p.id === id)?.cost ?? 0 } : { addStock: prev[id]?.addStock ?? 0 })
            }
        }));
    };

    const saveStockUpdates = () => {
        Object.entries(stockUpdates).forEach(([id, data]) => {
            if (data.addStock !== 0 || data.newCost !== 0) {
                const product = products.find(p => p.id === id);
                if (product) {
                    updateProduct(id, {
                        stock: product.stock + data.addStock,
                        cost: data.newCost > 0 ? data.newCost : product.cost,
                    });
                }
            }
        });
        setIsStockModalOpen(false);
        setStockUpdates({});
        alert("Stok ve maliyetler güncellendi!");
    };

    // Inventory Handlers
    const handleAddProduct = (e: React.FormEvent) => {
        e.preventDefault();
        addProduct({
            name: prodName,
            category: prodCategory,
            price: prodPrice,
            stock: prodStock,
            cost: prodCost,
            taxRate: prodTaxRate as any
        });
        setIsInventoryModalOpen(false);
        setProdName("");
        setProdPrice(0);
        setProdStock(0);
        setProdCost(0);
        setProdTaxRate(20);
        alert("Ürün başarıyla eklendi.");
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setEditForm({
            name: product.name,
            category: product.category,
            price: product.price,
            stock: product.stock,
            cost: product.cost,
            taxRate: product.taxRate || 20
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingProduct) {
            updateProduct(editingProduct.id, {
                ...editForm,
                taxRate: editForm.taxRate as any
            });
            setIsEditModalOpen(false);
            setEditingProduct(null);
            alert("Ürün güncellendi.");
        }
    };

    // --- MODALS ---
    const StockModal = (
        <Modal
            isOpen={isStockModalOpen}
            onClose={() => setIsStockModalOpen(false)}
            title="Toplu Stok Girişi"
            width="900px"
        >
            <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto border border-zinc-200 rounded-lg mb-6">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-50 border-b border-zinc-200 sticky top-0">
                            <tr>
                                <th className="p-3 font-bold text-zinc-500">Ürün</th>
                                <th className="p-3 font-bold text-zinc-500">Mevcut Stok</th>
                                <th className="p-3 font-bold text-zinc-500">Eklenecek Adet</th>
                                <th className="p-3 font-bold text-zinc-500">Yeni Maliyet</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {products.map((product: Product) => {
                                const updates = stockUpdates[product.id] || { addStock: 0, newCost: product.cost };
                                return (
                                    <tr key={product.id} className="hover:bg-zinc-50">
                                        <td className="p-3 font-medium">{product.name}</td>
                                        <td className="p-3 text-zinc-600">{product.stock}</td>
                                        <td className="p-3">
                                            <input
                                                type="number"
                                                min="0"
                                                className="w-24 border border-zinc-200 rounded p-1"
                                                placeholder="0"
                                                value={updates.addStock || ''}
                                                onChange={(e) => handleStockUpdateChange(product.id, 'addStock', Number(e.target.value))}
                                            />
                                        </td>
                                        <td className="p-3">
                                            <input
                                                type="number"
                                                min="0"
                                                className="w-24 border border-zinc-200 rounded p-1"
                                                placeholder={product.cost ? product.cost.toString() : '0'}
                                                value={updates.newCost || ''}
                                                onChange={(e) => handleStockUpdateChange(product.id, 'newCost', Number(e.target.value))}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end gap-3">
                    <button onClick={() => setIsStockModalOpen(false)} className="px-4 py-2 rounded-lg bg-zinc-100 text-zinc-700 font-medium hover:bg-zinc-200">İptal</button>
                    <button onClick={saveStockUpdates} className="px-4 py-2 rounded-lg bg-black text-white font-medium hover:bg-zinc-800">Güncelle</button>
                </div>
            </div>
        </Modal>
    );
    // --- Cart Handlers ---
    const addToCart = (product: Product) => {
        if (product.stock <= 0) return;
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                if (existing.quantity >= product.stock) {
                    alert("Stok yetersiz!");
                    return prev;
                }
                return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    const decreaseQuantity = (productId: string) => {
        setCart(prev => {
            return prev.map(item => {
                if (item.product.id === productId) {
                    return { ...item, quantity: item.quantity - 1 };
                }
                return item;
            }).filter(item => item.quantity > 0);
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.product.id !== productId));
    };



    const InventoryModal = (
        <Modal
            isOpen={isInventoryModalOpen}
            onClose={() => setIsInventoryModalOpen(false)}
            title="Yeni Ürün Ekle"
            width="450px"
        >
            <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">Ürün Adı</label>
                    <input type="text" required value={prodName} onChange={e => setProdName(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-black focus:outline-none focus:border-indigo-500 focus:bg-white text-sm" placeholder="Örn: Protein Tozu" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">Kategori</label>
                        <select value={prodCategory} onChange={e => setProdCategory(e.target.value as Product['category'])} className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-black focus:outline-none focus:border-indigo-500 focus:bg-white text-sm">
                            <option value="supplement">Supplement</option>
                            <option value="drink">İçecek</option>
                            <option value="clothing">Giyim</option>
                            <option value="equipment">Ekipman</option>
                            <option value="other">Diğer</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">Stok Adedi</label>
                        <input type="number" required min="0" value={prodStock} onChange={e => setProdStock(Number(e.target.value))} className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-black focus:outline-none focus:border-indigo-500 focus:bg-white text-sm" />
                    </div>
                </div>

                {/* VAT Selection */}
                <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">KDV Oranı (%)</label>
                    <div className="flex gap-2">
                        {[0, 1, 8, 10, 18, 20].map(rate => (
                            <button
                                key={rate}
                                type="button"
                                onClick={(e) => { e.preventDefault(); setProdTaxRate(rate); }}
                                style={{
                                    backgroundColor: prodTaxRate === rate ? 'black' : 'white',
                                    color: prodTaxRate === rate ? 'white' : '#52525b', // zinc-600
                                    borderColor: prodTaxRate === rate ? 'black' : '#e4e4e7' // zinc-200
                                }}
                                className="flex-1 py-2 rounded-lg text-sm font-bold border transition-colors hover:bg-zinc-50"
                            >
                                %{rate}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">Satış Fiyatı</label>
                        <input type="number" required min="0" value={prodPrice} onChange={e => setProdPrice(Number(e.target.value))} className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-black focus:outline-none focus:border-indigo-500 focus:bg-white text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">Maliyet (Opsiyonel)</label>
                        <input type="number" min="0" value={prodCost} onChange={e => setProdCost(Number(e.target.value))} className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-black focus:outline-none focus:border-indigo-500 focus:bg-white text-sm" />
                    </div>
                </div>
                <div className="flex gap-3 mt-8">
                    <button type="button" onClick={() => setIsInventoryModalOpen(false)} className="flex-1 py-2.5 rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors text-sm font-medium">İptal</button>
                    <button type="submit" className="flex-1 bg-black text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors">Kaydet</button>
                </div>
            </form>
        </Modal>
    );

    if (!hasPermission("view_store")) return null;

    return (
        <div className="h-[calc(100vh-2rem)] pb-4 grid grid-cols-[1fr_380px] gap-6">

            {/* LEFT COLUMN: Product List */}
            <div className="flex flex-col gap-6 overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-end flex-shrink-0">
                    <div>
                        <h1 className="text-3xl font-bold text-black">Mağaza / POS</h1>
                        <p className="text-zinc-500 mt-1">Hızlı ürün satışı ekranı.</p>
                    </div>
                    {canManage && (
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setIsStockModalOpen(true)}
                                className="px-4 py-2 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-sm"
                            >
                                <Banknote size={18} /> Stok Girişi
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsInventoryModalOpen(true)}
                                className="px-4 py-2 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-sm"
                            >
                                <Plus size={18} /> Yeni Ürün
                            </button>
                        </div>
                    )}
                </div>



                {/* Filters */}
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 text-zinc-400" size={18} />
                        <input
                            type="text"
                            placeholder="Ürün ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm text-black focus:outline-none focus:border-black transition-colors shadow-sm"
                        />
                    </div>
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm text-black focus:outline-none focus:border-black transition-colors shadow-sm min-w-[150px]"
                    >
                        <option value="all">Tüm Kategoriler</option>
                        <option value="supplement">Supplement</option>
                        <option value="drink">İçecek</option>
                        <option value="clothing">Giyim</option>
                        <option value="equipment">Ekipman</option>
                        <option value="other">Diğer</option>
                    </select>
                </div>

                {/* Product Table */}
                <div className="bg-white border border-zinc-200 rounded-xl flex-1 overflow-auto shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-50 border-b border-zinc-200 sticky top-0">
                            <tr>
                                <th className="p-4 text-xs font-bold text-zinc-500 uppercase">Ürün Adı</th>
                                <th className="p-4 text-xs font-bold text-zinc-500 uppercase">Kategori</th>
                                <th className="p-4 text-xs font-bold text-zinc-500 uppercase">KDV</th>
                                <th className="p-4 text-xs font-bold text-zinc-500 uppercase">Fiyat (KDV Hariç)</th>
                                <th className="p-4 text-xs font-bold text-zinc-500 uppercase">KDV Dahil</th>
                                <th className="p-4 text-xs font-bold text-zinc-500 uppercase">Stok</th>
                                <th className="p-4 text-xs font-bold text-zinc-500 uppercase w-20">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {products
                                .filter((product: Product) => {
                                    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
                                    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
                                    return matchesSearch && matchesCategory;
                                })
                                .map((product: Product) => (
                                    <tr key={product.id} className="hover:bg-zinc-50 group">
                                        <td className="p-4 font-medium text-black">
                                            <div className="flex flex-col">
                                                <span>{product.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 rounded-full bg-zinc-100 text-zinc-600 text-xs font-medium capitalize">
                                                {product.category}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold border border-gray-200">
                                                %{product.taxRate || 20}
                                            </span>
                                        </td>
                                        <td className="p-4 font-bold text-zinc-600">{product.price.toLocaleString('tr-TR')} ₺</td>
                                        <td className="p-4 font-bold text-emerald-600">
                                            {(product.price * (1 + (product.taxRate || 20) / 100)).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ₺
                                        </td>
                                        <td className="p-4">
                                            <span className={`font-bold ${product.stock < 5 ? 'text-red-500' : 'text-zinc-600'}`}>
                                                {product.stock}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => addToCart(product)}
                                                disabled={product.stock <= 0}
                                                className={`
                                                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all
                                                ${product.stock > 0
                                                        ? 'bg-black text-white hover:bg-zinc-800 hover:shadow-md cursor-pointer'
                                                        : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'}
                                            `}
                                            >
                                                <ShoppingCart size={14} />
                                                {product.stock > 0 ? 'Sepete Ekle' : 'Stok Yok'}
                                            </button>
                                            {canManage && (
                                                <button
                                                    onClick={() => openEditModal(product)}
                                                    className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="Düzenle"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            {products.length === 0 && (
                                <tr><td colSpan={7} className="p-8 text-center text-zinc-400">Ürün bulunamadı.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* RIGHT COLUMN: Persistent Cart */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-lg flex flex-col h-full overflow-hidden">
                <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex justify-between items-center">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <ShoppingCart size={20} className="text-black" />
                        Sepet
                    </h2>
                    <span className="bg-black text-white text-xs font-bold px-2 py-1 rounded-full">{cart.reduce((a, b) => a + b.quantity, 0)}</span>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-400 gap-2 opacity-50">
                            <ShoppingCart size={48} strokeWidth={1} />
                            <p className="text-sm font-medium">Sepet boş</p>
                        </div>
                    ) : (
                        cart.map((item, idx) => (
                            <div key={idx} className="flex flex-col gap-2 p-3 rounded-lg border border-zinc-100 bg-white hover:border-zinc-300 transition-colors shadow-sm">
                                <div className="flex justify-between items-start">
                                    <span className="text-sm font-bold text-black line-clamp-1">{item.product.name}</span>
                                    <span className="text-sm font-bold text-emerald-600 ml-2">{(item.product.price * item.quantity).toLocaleString('tr-TR')}₺</span>
                                </div>
                                <div className="text-xs text-zinc-400 mb-1">
                                    KDV: %{item.product.taxRate || 20}
                                </div>
                                <div className="flex justify-between items-center bg-zinc-50 p-1 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => decreaseQuantity(item.product.id)} className="w-6 h-6 flex items-center justify-center bg-white border border-zinc-200 rounded shadow-sm hover:text-red-500">
                                            <Minus size={12} />
                                        </button>
                                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                        <button onClick={() => addToCart(item.product)} className="w-6 h-6 flex items-center justify-center bg-white border border-zinc-200 rounded shadow-sm hover:text-emerald-500">
                                            <Plus size={12} />
                                        </button>
                                    </div>
                                    <button onClick={() => removeFromCart(item.product.id)} className="text-zinc-400 hover:text-red-500 p-1">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Payment & Checkout */}
                <div className="p-4 bg-zinc-50 border-t border-zinc-200 space-y-4">

                    {/* Payment Methods */}
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={() => { setPaymentMethod('cash'); setInstallment(1); }}
                            className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-medium transition-all ${paymentMethod === 'cash' ? 'bg-black text-white border-black shadow-md' : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-100'}`}
                        >
                            <Banknote size={18} className="mb-1" />
                            Nakit
                        </button>
                        <button
                            onClick={() => setPaymentMethod('card')}
                            className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-medium transition-all ${paymentMethod === 'card' ? 'bg-black text-white border-black shadow-md' : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-100'}`}
                        >
                            <CreditCard size={18} className="mb-1" />
                            Kart
                        </button>
                        <button
                            onClick={() => { setPaymentMethod('transfer'); setInstallment(1); }}
                            className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-medium transition-all ${paymentMethod === 'transfer' ? 'bg-black text-white border-black shadow-md' : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-100'}`}
                        >
                            <Landmark size={18} className="mb-1" />
                            Havale
                        </button>
                    </div>

                    {/* Installment Selector (Only for Card) */}
                    {paymentMethod === 'card' && (
                        <div className="bg-white border border-zinc-200 rounded-lg p-2">
                            <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase">Taksit Seçeneği</label>
                            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                {commissionRates.sort((a: CommissionRate, b: CommissionRate) => a.installments - b.installments).map((rate: CommissionRate) => (
                                    <button
                                        key={rate.installments}
                                        onClick={() => setInstallment(rate.installments)}
                                        className={`flex-shrink-0 px-3 py-1.5 rounded text-xs font-bold border transition-colors ${installment === rate.installments ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-zinc-100 text-zinc-600 hover:bg-zinc-50'}`}
                                    >
                                        {rate.installments === 1 ? 'Tek Çekim' : `${rate.installments} Taksit`}
                                        <span className="block text-[9px] font-normal opacity-70">%{rate.rate} Kom.</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Discount Controls */}
                    <div className="bg-white border border-zinc-200 rounded-lg p-3 space-y-3">
                        {/* Manual Discount */}
                        <div>
                            <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase">Manuel İskonto (TL)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">₺</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={manualDiscount}
                                    onChange={e => setManualDiscount(e.target.value === "" ? "" : Number(e.target.value))}
                                    className="w-full pl-7 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded text-sm text-black focus:border-black outline-none"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        {/* Coupon Input */}
                        <div>
                            <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase">İndirim Kuponu</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={couponCode}
                                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                                    placeholder="KOD GİRİNİZ"
                                    className="flex-1 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded text-sm text-black focus:border-black outline-none uppercase font-mono"
                                />
                                <button
                                    onClick={handleApplyCoupon}
                                    disabled={!couponCode}
                                    className="px-3 py-1.5 bg-black text-white rounded text-xs font-bold disabled:opacity-50"
                                >
                                    Uygula
                                </button>
                            </div>
                        </div>

                        {/* Applied Coupon Info */}
                        {appliedCoupon && (
                            <div className="flex justify-between items-center bg-pink-50 text-pink-700 px-3 py-2 rounded text-xs font-bold border border-pink-100">
                                <span className="flex items-center gap-2">
                                    <Percent size={12} /> {appliedCoupon.code}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span>%{appliedCoupon.discountRate} İndirim</span>
                                    <button onClick={() => setAppliedCoupon(null)} className="hover:text-pink-900"><Trash2 size={12} /></button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Total Breakdown */}
                    <div className="space-y-2 border-t border-zinc-200 pt-3">
                        <div className="flex justify-between items-center px-1 text-xs text-zinc-500">
                            <span>Ara Toplam (KDV Hariç)</span>
                            <span>{discountedSubTotal.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ₺</span>
                        </div>

                        {totalDiscount > 0 && (
                            <div className="flex justify-between items-center px-1 text-xs text-red-500 font-medium">
                                <span>İndirim Tutarı</span>
                                <span>- {totalDiscount.toLocaleString('tr-TR')} ₺</span>
                            </div>
                        )}

                        {/* VAT Summaries */}
                        {Object.entries(vatBreakdown).map(([rate, amount]) => (
                            <div key={rate} className="flex justify-between items-center px-1 text-xs text-zinc-500">
                                <span>Toplam KDV (%{rate})</span>
                                <span>{amount.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ₺</span>
                            </div>
                        ))}

                        {commissionAmount > 0 && (
                            <div className="flex justify-between items-center px-1 text-xs text-indigo-600">
                                <span className="flex items-center gap-1"><Percent size={10} /> Komisyon (%{commissionRate})</span>
                                <span>+ {commissionAmount.toLocaleString('tr-TR')} ₺</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center px-1 pt-1">
                            <span className="text-zinc-500 font-medium">Genel Toplam</span>
                            <span className="text-2xl font-black text-black">
                                {finalTotal.toLocaleString('tr-TR')} ₺
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0}
                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 ${cart.length > 0 ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'}`}
                    >
                        <ShoppingCart size={20} />
                        Satışı Tamamla
                    </button>
                </div>
            </div>

            {/* Portal components rendering */}
            {StockModal}
            {InventoryModal}

            {/* Edit Product Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Ürün Düzenle"
                width="450px"
            >
                <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">Ürün Adı</label>
                        <input
                            type="text"
                            required
                            value={editForm.name}
                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-black focus:outline-none focus:border-indigo-500 focus:bg-white text-sm"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">Kategori</label>
                            <select
                                value={editForm.category}
                                onChange={e => setEditForm({ ...editForm, category: e.target.value as Product['category'] })}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-black focus:outline-none focus:border-indigo-500 focus:bg-white text-sm"
                            >
                                <option value="supplement">Supplement</option>
                                <option value="drink">İçecek</option>
                                <option value="clothing">Giyim</option>
                                <option value="equipment">Ekipman</option>
                                <option value="other">Diğer</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">Stok Adedi</label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={editForm.stock}
                                onChange={e => setEditForm({ ...editForm, stock: Number(e.target.value) })}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-black focus:outline-none focus:border-indigo-500 focus:bg-white text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">KDV Oranı (%)</label>
                        <div className="flex gap-2">
                            {[0, 1, 8, 10, 18, 20].map(rate => (
                                <button
                                    key={rate}
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); setEditForm({ ...editForm, taxRate: rate }); }}
                                    style={{
                                        backgroundColor: editForm.taxRate === rate ? 'black' : 'white',
                                        color: editForm.taxRate === rate ? 'white' : '#52525b',
                                        borderColor: editForm.taxRate === rate ? 'black' : '#e4e4e7'
                                    }}
                                    className="flex-1 py-2 rounded-lg text-sm font-bold border transition-colors hover:bg-zinc-50"
                                >
                                    %{rate}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">Satış Fiyatı</label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={editForm.price}
                                onChange={e => setEditForm({ ...editForm, price: Number(e.target.value) })}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-black focus:outline-none focus:border-indigo-500 focus:bg-white text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">Maliyet</label>
                            <input
                                type="number"
                                min="0"
                                value={editForm.cost}
                                onChange={e => setEditForm({ ...editForm, cost: Number(e.target.value) })}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-black focus:outline-none focus:border-indigo-500 focus:bg-white text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                        <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2.5 rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors text-sm font-medium">İptal</button>
                        <button type="submit" className="flex-1 bg-black text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors">Güncelle</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

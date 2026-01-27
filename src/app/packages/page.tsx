"use client";

import { useGym, Service, Package, PackageType, ServiceCategory, SessionFormat } from "@/context/GymContext";
import { useState, useEffect } from "react";
import { Plus, Trash2, Package as PackageIcon, Info, Edit2, Layers, ChevronRight, Settings, Check } from "lucide-react";
import Modal from "@/components/Modal";

export default function PackagesPage() {
    const {
        services, addService, updateService, deleteService,
        packages, addPackage, deletePackage, updatePackage,
        hasPermission
    } = useGym();

    const [mounted, setMounted] = useState(false);

    // State
    const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
    const [editingPackageId, setEditingPackageId] = useState<string | null>(null);

    // Form States - Service
    const [serviceName, setServiceName] = useState("");
    const [serviceCategory, setServiceCategory] = useState<ServiceCategory>("SELF_SERVICE");
    const [serviceDesc, setServiceDesc] = useState("");

    // Form States - Package
    const [pkgName, setPkgName] = useState("");
    const [pkgType, setPkgType] = useState<PackageType>("ABONMAN");
    const [pkgPrice, setPkgPrice] = useState("");
    const [pkgSessions, setPkgSessions] = useState("");
    const [pkgValidity, setPkgValidity] = useState("");
    const [pkgFormat, setPkgFormat] = useState<SessionFormat>("BIREYSEL");
    const [pkgValidityReq, setPkgValidityReq] = useState(true);

    useEffect(() => {
        setMounted(true);
        if (services.length > 0 && !selectedServiceId) {
            setSelectedServiceId(services[0].id);
        }
    }, [services]);

    const canManage = hasPermission("manage_packages");

    // --- Actions ---

    const handleCreateService = (e: React.FormEvent) => {
        e.preventDefault();
        addService({
            name: serviceName,
            category: serviceCategory,
            description: serviceDesc,
            isActive: true
        });
        setIsServiceModalOpen(false);
        setServiceName("");
        setServiceDesc("");
    };

    const handleCreatePackage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedServiceId) return;

        // Pricing Logic: If Session Pack, input is "Unit Price", save as "Total Price"
        const unitPrice = Number(pkgPrice);
        const sessions = Number(pkgSessions);

        let finalPrice = unitPrice;
        if (pkgType === 'DERS_PAKETI' && sessions > 0) {
            finalPrice = unitPrice * sessions;
        }

        const packageData = {
            serviceId: selectedServiceId,
            name: pkgName,
            type: pkgType,
            price: finalPrice, // Saved as Total
            sessionCount: pkgType === 'DERS_PAKETI' ? sessions : undefined,
            validityDays: Number(pkgValidity),
            validityRequired: pkgValidityReq,
            sessionFormat: pkgFormat,
            isActive: true,
            sortOrder: 10
        };

        if (editingPackageId) {
            updatePackage(editingPackageId, packageData);
        } else {
            addPackage(packageData);
        }

        closePackageModal();
    };

    const openEditPackageModal = (pkg: Package) => {
        setEditingPackageId(pkg.id);
        setPkgName(pkg.name);
        setPkgType(pkg.type);
        // If Session Pack, start with Unit Price for editing
        if (pkg.type === 'DERS_PAKETI' && pkg.sessionCount) {
            setPkgPrice(String(Math.round(pkg.price / pkg.sessionCount)));
            setPkgSessions(String(pkg.sessionCount));
        } else {
            setPkgPrice(String(pkg.price));
            setPkgSessions("");
        }
        setPkgValidity(String(pkg.validityDays));
        setPkgValidityReq(pkg.validityRequired);
        setPkgFormat(pkg.sessionFormat || "BIREYSEL");
        setIsPackageModalOpen(true);
    };

    const closePackageModal = () => {
        setIsPackageModalOpen(false);
        setEditingPackageId(null);
        setPkgName("");
        setPkgPrice("");
        setPkgSessions("");
        setPkgValidity("");
        // Reset defaults
        setPkgType("ABONMAN");
        setPkgFormat("BIREYSEL");
    };

    // Derived Data
    const activeService = services.find(s => s.id === selectedServiceId);
    const servicePackages = packages.filter(p => p.serviceId === selectedServiceId);

    if (!mounted) return null;

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col md:flex-row gap-6">
            {/* LEFT: Services List */}
            <div className="w-full md:w-1/3 lg:w-1/4 bg-white border border-zinc-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
                <div className="p-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                    <h2 className="font-bold text-zinc-700 flex items-center gap-2">
                        <Layers size={18} /> Hizmetler
                    </h2>
                    {canManage && (
                        <button onClick={() => setIsServiceModalOpen(true)} className="p-2 bg-black text-white rounded-lg hover:bg-zinc-800 transition-colors">
                            <Plus size={16} />
                        </button>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {services.map(service => (
                        <button
                            key={service.id}
                            onClick={() => setSelectedServiceId(service.id)}
                            className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-all group ${selectedServiceId === service.id
                                ? 'bg-black text-white shadow-md'
                                : 'hover:bg-zinc-100 text-zinc-600'
                                }`}
                        >
                            <div className="flex flex-col">
                                <span className={`font-bold text-sm ${selectedServiceId === service.id ? 'text-white' : 'text-zinc-800'}`}>{service.name}</span>
                                <span className="text-[10px] opacity-70 uppercase tracking-wider">{service.category === 'SELF_SERVICE' ? 'Self Servis' : 'Eğitmenli'}</span>
                            </div>
                            {selectedServiceId === service.id && <ChevronRight size={16} className="opacity-50" />}
                        </button>
                    ))}
                    {services.length === 0 && <div className="p-4 text-center text-xs text-zinc-400">Hizmet bulunamadı.</div>}
                </div>
            </div>

            {/* RIGHT: Packages List */}
            <div className="flex-1 bg-white border border-zinc-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
                {activeService ? (
                    <>
                        <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                            <div>
                                <h1 className="text-2xl font-bold text-black flex items-center gap-2">
                                    {activeService.name}
                                    <span className="text-sm font-normal text-zinc-400 bg-zinc-100 px-2 py-1 rounded-md">{activeService.category === 'COACHING' ? 'Antrenörlü' : 'Abonman'}</span>
                                </h1>
                                <p className="text-sm text-zinc-500 mt-1">{activeService.description || "Açıklama yok."}</p>
                            </div>
                            <div className="flex gap-2">
                                {!canManage && (
                                    <span className="px-3 py-2 bg-yellow-50 text-yellow-700 text-xs rounded-lg border border-yellow-100 flex items-center">
                                        salt okunur
                                    </span>
                                )}
                                {canManage && (
                                    <button onClick={() => { setEditingPackageId(null); setIsPackageModalOpen(true); }} className="btn-primary flex items-center gap-2">
                                        <Plus size={18} /> Paket Ekle
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-zinc-50/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {servicePackages.map(pkg => (
                                    <div key={pkg.id} className="bg-white border border-zinc-200 rounded-xl p-5 hover:shadow-lg transition-all relative group">
                                        {canManage && (
                                            <>
                                                <button
                                                    onClick={() => deletePackage(pkg.id)}
                                                    className="absolute top-3 right-3 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => openEditPackageModal(pkg)}
                                                    className="absolute top-3 right-10 text-zinc-300 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            </>
                                        )}

                                        <div className="flex items-center gap-3 mb-4">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${pkg.type === 'ABONMAN' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                <PackageIcon size={20} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-zinc-800 text-sm">{pkg.name}</div>
                                                <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">{pkg.sessionFormat}</div>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pb-2">
                                            <div className="flex justify-between items-end border-b border-zinc-50 pb-3">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-zinc-500">Toplam Fiyat</span>
                                                    <span className="font-bold text-lg text-black">{pkg.price} TL</span>
                                                </div>
                                                {pkg.type === 'DERS_PAKETI' && pkg.sessionCount && (
                                                    <div className="text-right">
                                                        <span className="text-[10px] text-zinc-400 block">Birim Ders</span>
                                                        <span className="font-bold text-sm text-zinc-600">{Math.round(pkg.price / pkg.sessionCount)} TL</span>
                                                    </div>
                                                )}
                                            </div>

                                            {pkg.type === 'DERS_PAKETI' && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-zinc-500">Ders Hakkı</span>
                                                    <span className="font-bold">{pkg.sessionCount} Ders</span>
                                                </div>
                                            )}

                                            <div className="flex justify-between text-sm">
                                                <span className="text-zinc-500">Geçerlilik</span>
                                                <span className="font-bold">{pkg.validityDays} Gün</span>
                                            </div>

                                            {/* Status Checkbox Row */}
                                            {canManage && (
                                                <div className="flex justify-between items-center pt-3 border-t border-zinc-50">
                                                    <span className="text-xs text-zinc-400 font-medium">Satış Durumu</span>
                                                    <label className="flex items-center gap-2 cursor-pointer bg-zinc-50 px-3 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors border border-zinc-100">
                                                        <input
                                                            type="checkbox"
                                                            checked={pkg.isActive}
                                                            onChange={() => updatePackage(pkg.id, { isActive: !pkg.isActive })}
                                                            className="accent-black w-4 h-4 rounded cursor-pointer"
                                                        />
                                                        <span className={`text-xs font-bold ${pkg.isActive ? 'text-black' : 'text-zinc-400'}`}>
                                                            {pkg.isActive ? 'Satışa Açık' : 'Satışa Kapalı'}
                                                        </span>
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {servicePackages.length === 0 && (
                                    <div className="col-span-full py-12 text-center text-zinc-400 italic bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                                        Bu hizmete ait paket bulunamadı.
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-zinc-400">
                        Lütfen soldan bir hizmet seçiniz.
                    </div>
                )}
            </div>

            {/* --- MODALS --- */}

            {/* Service Modal */}
            <Modal isOpen={isServiceModalOpen} onClose={() => setIsServiceModalOpen(false)} title="Yeni Hizmet Ekle" width="500px">
                <form onSubmit={handleCreateService} className="space-y-4">
                    <div>
                        <label className="label">Hizmet Adı</label>
                        <input type="text" className="input-field" value={serviceName} onChange={e => setServiceName(e.target.value)} placeholder="Örn: Yoga" required />
                    </div>
                    <div>
                        <label className="label">Kategori</label>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setServiceCategory("SELF_SERVICE")} className={`flex-1 py-3 rounded-lg border text-sm font-bold ${serviceCategory === 'SELF_SERVICE' ? 'bg-black text-white border-black' : 'bg-white text-zinc-500'}`}>Self Servis</button>
                            <button type="button" onClick={() => setServiceCategory("COACHING")} className={`flex-1 py-3 rounded-lg border text-sm font-bold ${serviceCategory === 'COACHING' ? 'bg-black text-white border-black' : 'bg-white text-zinc-500'}`}>Eğitmenli</button>
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-2">
                            {serviceCategory === 'SELF_SERVICE' ? '* Antrenörsüz, bireysel kullanım (Örn: Fitness)' : '* Eğitmen eşliğinde yapılan dersler (Örn: PT, Reformer)'}
                        </p>
                    </div>
                    <div>
                        <label className="label">Açıklama</label>
                        <textarea className="input-field" rows={3} value={serviceDesc} onChange={e => setServiceDesc(e.target.value)} />
                    </div>
                    <button type="submit" className="btn-primary w-full">Kaydet</button>
                </form>
            </Modal>

            {/* Package Modal */}
            <Modal isOpen={isPackageModalOpen} onClose={closePackageModal} title={editingPackageId ? "Paketi Düzenle" : "Yeni Paket Ekle"} width="600px">
                <form onSubmit={handleCreatePackage} className="space-y-5">
                    <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 text-xs text-zinc-500">
                        <span className="font-bold text-black">{activeService?.name}</span> hizmetine paket ekliyorsunuz.
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Paket Tipi</label>
                            <select value={pkgType} onChange={e => setPkgType(e.target.value as PackageType)} className="input-field">
                                <option value="ABONMAN">Abonman (Süreli)</option>
                                <option value="DERS_PAKETI">Ders Paketi (Kontörlü)</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Format</label>
                            <select value={pkgFormat} onChange={e => setPkgFormat(e.target.value as SessionFormat)} className="input-field">
                                <option value="BIREYSEL">Bireysel</option>
                                <option value="DUET">Düet</option>
                                <option value="GRUP">Grup</option>
                                <option value="SERBEST">Serbest Çalışma</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="label">Paket Adı</label>
                        <input type="text" className="input-field" value={pkgName} onChange={e => setPkgName(e.target.value)} placeholder="Örn: 8 Ders Bireysel" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">
                                {pkgType === 'DERS_PAKETI' ? 'Birim Ders Ücreti (TL)' : 'Toplam Fiyat (TL)'}
                            </label>
                            <input
                                type="number"
                                className="input-field"
                                value={pkgPrice}
                                onChange={e => setPkgPrice(e.target.value)}
                                required
                                placeholder={pkgType === 'DERS_PAKETI' ? 'Örn: 500 (1 ders için)' : 'Örn: 1500'}
                            />
                            {/* Calculation Preview for Session Packs */}
                            {pkgType === 'DERS_PAKETI' && pkgPrice && pkgSessions && (
                                <p className="text-[10px] text-zinc-400 mt-1">
                                    Toplam Paket Tutarı: <span className="font-bold text-black">{Number(pkgPrice) * Number(pkgSessions)} TL</span>
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="label">Geçerlilik Süresi (Gün)</label>
                            <input type="number" className="input-field" value={pkgValidity} onChange={e => setPkgValidity(e.target.value)}
                                required={pkgValidityReq || activeService?.category === 'COACHING'}
                                placeholder={activeService?.category === 'COACHING' ? 'Zorunlu' : 'Opsiyonel'}
                            />
                        </div>
                    </div>

                    {pkgType === 'DERS_PAKETI' && (
                        <div>
                            <label className="label">Ders Sayısı</label>
                            <input type="number" className="input-field" value={pkgSessions} onChange={e => setPkgSessions(e.target.value)} required />
                        </div>
                    )}

                    <button type="submit" className="btn-primary w-full">Paketi Oluştur</button>
                </form>
            </Modal>
        </div>
    );
}

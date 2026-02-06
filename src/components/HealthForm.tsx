import React from 'react';
import { HealthProfile } from '@/context/GymContext';
import HealthBadge, { BranchSuitability } from './HealthBadge';

interface HealthFormProps {
    initialData?: HealthProfile;
    onChange: (data: HealthProfile) => void;
    readOnly?: boolean;
}

const CONDITIONS = {
    cardio: ["Hipertansiyon", "Kalp Ritim Bozukluğu", "Geçirilmiş Kalp Krizi", "Ailesel Kalp Hastalığı", "Stent / By-Pass"],
    ortho: ["Bel Fıtığı", "Boyun Fıtığı", "Skolyoz", "Menisküs / Diz Problemi", "Omuz Problemi", "Eklem Romatizması"],
    metabolic: ["Diyabet (Tip 1/2)", "İnsülin Direnci", "Tiroid Bozukluğu", "Obezite"],
    respiratory: ["Astım", "KOAH", "Nefes Darlığı"],
    special: ["Gebelik", "Doğum Sonrası (0-12 Ay)", "Epilepsi", "Vertigo", "Panik Atak / Anksiyete"]
};

// High Risk Keywords (Simple heuristic: if any of these selected -> High Risk)
const HIGH_RISK_ITEMS = ["Geçirilmiş Kalp Krizi", "Stent / By-Pass", "Gebelik", "Epilepsi", "KOAH", "Kalp Ritim Bozukluğu"];

export default function HealthForm({ initialData, onChange, readOnly = false }: HealthFormProps) {
    // Default Empty Profile
    const defaultProfile: HealthProfile = {
        cardio: [],
        ortho: [],
        metabolic: [],
        respiratory: [],
        special: [],
        other: "",
        riskLevel: 'low'
    };

    // Use passed data or default
    const profile = initialData || defaultProfile;

    // Helper calculate loop
    const calculateRisk = (p: HealthProfile): 'low' | 'medium' | 'high' => {
        const all = [...p.cardio, ...p.ortho, ...p.metabolic, ...p.respiratory, ...p.special];
        if (all.some(i => HIGH_RISK_ITEMS.includes(i))) return 'high';
        if (all.length >= 3) return 'high';
        else if (all.length >= 2 || p.ortho.includes("Bel Fıtığı") || p.ortho.includes("Boyun Fıtığı")) return 'medium';
        return 'low';
    };

    const handleChange = (category: keyof HealthProfile, item: string) => {
        if (readOnly) return;

        const list = profile[category] as string[];
        const exists = list.includes(item);
        const newList = exists ? list.filter(i => i !== item) : [...list, item];

        const tempProfile = { ...profile, [category]: newList };
        const risk = calculateRisk(tempProfile);

        const finalProfile = { ...tempProfile, riskLevel: risk };
        onChange(finalProfile);
    };

    const handleTextChange = (text: string) => {
        if (readOnly) return;
        const updated = { ...profile, other: text };
        onChange(updated);
    };

    const renderCategory = (title: string, key: keyof HealthProfile, items: string[]) => (
        <div className="mb-4">
            <h4 className="text-xs font-bold text-zinc-500 uppercase mb-2 border-b border-zinc-100 pb-1">{title}</h4>
            <div className="grid grid-cols-2 gap-2">
                {items.map(item => (
                    <label key={item} className={`flex items - start gap - 2 text - sm p - 2 rounded - lg cursor - pointer transition - colors ${(profile[key] as string[]).includes(item)
                        ? 'bg-red-50 border border-red-100 text-red-700'
                        : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600'
                        } `}>
                        <input
                            type="checkbox"
                            className="mt-1"
                            checked={(profile[key] as string[]).includes(item)}
                            onChange={() => handleChange(key, item)}
                            disabled={readOnly}
                        />
                        <span className="leading-tight">{item}</span>
                    </label>
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Risk Dashboard */}
            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold text-zinc-700">Değerlendirme:</span>
                    <HealthBadge riskLevel={profile.riskLevel} />
                </div>
                <div className="flex flex-wrap gap-2">
                    <BranchSuitability branch="fitness" riskLevel={profile.riskLevel} />
                    <BranchSuitability branch="functional" riskLevel={profile.riskLevel} />
                    <BranchSuitability branch="reformer" riskLevel={profile.riskLevel} />
                </div>
            </div>

            {/* Form Fields */}
            <div className={`space - y - 1 ${readOnly ? 'opacity-75 pointer-events-none' : ''} `}>
                {renderCategory("Kardiyovasküler (Kalp/Damar)", "cardio", CONDITIONS.cardio)}
                {renderCategory("Omurga & Ortopedik", "ortho", CONDITIONS.ortho)}
                {renderCategory("Metabolik & Endokrin", "metabolic", CONDITIONS.metabolic)}
                {renderCategory("Solunum", "respiratory", CONDITIONS.respiratory)}
                {renderCategory("Özel Durumlar", "special", CONDITIONS.special)}

                <div>
                    <h3 className="text-zinc-500 font-bold text-[10px] uppercase mb-1 flex items-center gap-2">MUAYENE VE &quot;PAR-Q&quot; KATILIM BEYANI</h3>
                    <textarea
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-sm focus:outline-none focus:border-black resize-none"
                        rows={3}
                        placeholder="Eklemek istediğiniz diğer sağlık durumları..."
                        value={profile.other}
                        onChange={(e) => handleTextChange(e.target.value)}
                        disabled={readOnly}
                    />
                </div>
            </div>

            <div className="text-[10px] text-zinc-400 italic">
                * Bu form bilgilendirme amaçlıdır. Hukuki sorumluluk kabul edilmez. Islak imzalı &quot;Sağlık Beyan Formu&quot; esastır.
            </div>
        </div>
    );
}

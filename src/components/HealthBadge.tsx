import React from 'react';
import { Activity, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface HealthBadgeProps {
    riskLevel?: 'low' | 'medium' | 'high';
    showLabel?: boolean;
}

export default function HealthBadge({ riskLevel, showLabel = true }: HealthBadgeProps) {
    if (!riskLevel) return null;

    const config = {
        low: { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle, label: 'Düşük Risk' },
        medium: { color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Info, label: 'Orta Risk' },
        high: { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle, label: 'Yüksek Risk' }
    };

    const { color, icon: Icon, label } = config[riskLevel];

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${color}`}>
            <Icon size={12} strokeWidth={3} />
            {showLabel && label}
        </span>
    );
}

// Branch Suitability Helper Tags
export function BranchSuitability({ riskLevel, branch }: { riskLevel?: string, branch: 'fitness' | 'functional' | 'reformer' }) {
    if (!riskLevel) return null;

    let suitability = { text: 'Uygun', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' };

    if (riskLevel === 'high') {
        if (branch === 'functional') suitability = { text: 'Önerilmez', color: 'text-red-600 bg-red-50 border-red-100' };
        else suitability = { text: 'Doktor Onayı / Özel Ders', color: 'text-amber-600 bg-amber-50 border-amber-100' };
    } else if (riskLevel === 'medium') {
        if (branch === 'reformer') suitability = { text: 'Özel Ders Önerilir', color: 'text-blue-600 bg-blue-50 border-blue-100' };
        else suitability = { text: 'Koşullu Uygun', color: 'text-amber-600 bg-amber-50 border-amber-100' };
    }

    return (
        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${suitability.color}`}>
            {branch}: {suitability.text}
        </span>
    );
}

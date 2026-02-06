"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    width?: string;
}

export default function Modal({ isOpen, onClose, title, children, width = "450px" }: ModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timer);
        // Prevent scrolling when modal is open
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!mounted) return null;

    if (!isOpen) return null;

    // Direct Portal to modal-root if available, fallback to body
    const modalRoot = document.getElementById('modal-root') || document.body;

    return createPortal(
        <div
            className="fixed inset-0 z-[999999] flex items-center justify-center backdrop-blur-[2px]"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.95)'
            }}
            onClick={(e) => {
                // Close if clicked on overlay
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className="relative bg-white rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-zinc-200 mx-4 flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200"
                style={{ width: '100%', maxWidth: width }}
            >
                {title && (
                    <div className="flex justify-between items-center p-6 border-b border-zinc-100">
                        <h2 className="text-xl font-bold text-black">{title}</h2>
                        <button
                            onClick={onClose}
                            className="p-2 -mr-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>,
        modalRoot
    );
}

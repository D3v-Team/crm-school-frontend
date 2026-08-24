import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * Modal — renders via portal into document.body
 * so it always appears above sidebar/header (z-index safe).
 * Props: open, onClose, title, children, size='md'
 * size: 'sm' | 'md' | 'lg'
 */
export default function Modal({ open, onClose, title, children, size = "md" }) {
    const overlayRef = useRef(null);

    const maxWidth = { sm: 440, md: 560, lg: 720 }[size] ?? 560;

    useEffect(() => {
        if (!open) return;
        const handleKey = (e) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handleKey);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", handleKey);
            document.body.style.overflow = "";
        };
    }, [open, onClose]);

    if (!open) return null;

    return createPortal(
        <div
            ref={overlayRef}
            onMouseDown={(e) => { if (e.target === overlayRef.current) onClose(); }}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
                background: "rgba(10, 15, 30, 0.55)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                animation: "fadeIn 0.18s ease",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth,
                    background: "var(--card-bg)",
                    border: "1px solid var(--card-border)",
                    borderRadius: 18,
                    boxShadow: "0 32px 80px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.06)",
                    animation: "modalIn 0.25s cubic-bezier(0.34,1.4,0.64,1)",
                    overflow: "hidden",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "18px 24px",
                        borderBottom: "1px solid var(--card-border)",
                    }}
                >
                    <h2 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            width: 32, height: 32,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            borderRadius: 8,
                            border: "1.5px solid var(--card-border)",
                            background: "var(--input-bg)",
                            color: "var(--text-secondary)",
                            cursor: "pointer",
                            transition: "all 0.15s",
                            flexShrink: 0,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--danger)"; e.currentTarget.style.color = "var(--danger)"; e.currentTarget.style.background = "var(--danger-soft)"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--card-border)"; e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "var(--input-bg)"; }}
                    >
                        <X size={15} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: "20px 24px 24px" }}>
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}

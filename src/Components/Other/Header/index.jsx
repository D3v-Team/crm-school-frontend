import React, { useState, useRef, useEffect } from "react";
import { LogOut, User, ChevronDown, Moon, Sun, PanelLeftOpen, PanelLeftClose, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { useAppSelector } from "../../../store/hooks";

export default function Header({ active, sidebarOpen, sidebarW = 260, isMobile = false, ...props }) {
    const navigate = useNavigate();
    const [openMenu, setOpenMenu] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const menuRef = useRef(null);

    const roleFromStore = useAppSelector((s) => s.auth?.role);
    const role = roleFromStore || Cookies.get('role') || null;
    const roleLabel =
        role === 'super_admin' ? 'Super Admin' :
        role === 'admin'       ? 'Admin'       :
        role === 'teacher'     ? "O'qituvchi"  :
        role === 'parent'      ? 'Ota-ona'     :
        role === 'hr'          ? 'HR'          :
        role === 'cashier'     ? 'Kassir'      :
        role === 'dev'         ? 'Developer'   :
        role ? role : 'Foydalanuvchi';

    useEffect(() => {
        const saved = localStorage.getItem("theme");
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (saved === "dark" || (!saved && prefersDark)) {
            setIsDarkMode(true);
            document.documentElement.classList.add("dark");
        }
    }, []);

    const toggleDarkMode = () => {
        const next = !isDarkMode;
        setIsDarkMode(next);
        document.documentElement.classList.toggle("dark", next);
        localStorage.setItem("theme", next ? "dark" : "light");
    };

    const handleLogout = () => {
        localStorage.clear();
        Cookies.remove('role');
        navigate("/login");
    };

    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <header
            style={{
                position: 'fixed',
                top: 0,
                right: 0,
                left: isMobile ? 0 : sidebarW,
                height: 64,
                zIndex: 39,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: isMobile ? '0 12px' : '0 20px',
                background: 'var(--card-bg)',
                borderBottom: '1px solid var(--card-border)',
                boxShadow: 'var(--shadow-sm)',
                transition: 'left 0.3s ease',
            }}
        >
            {/* Left — burger (mobile) or sidebar toggle (desktop) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                    onClick={active}
                    style={{
                        width: 36, height: 36,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: 'var(--accent-soft)', color: 'var(--accent)',
                        flexShrink: 0,
                    }}
                    title={isMobile ? 'Menyu' : (sidebarOpen ? 'Yopish' : 'Ochish')}
                >
                    {isMobile
                        ? <Menu style={{ width: 18, height: 18 }} />
                        : sidebarOpen
                            ? <PanelLeftOpen style={{ width: 16, height: 16 }} />
                            : <PanelLeftClose style={{ width: 16, height: 16 }} />
                    }
                </button>
            </div>

            {/* Right */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {/* Dark mode toggle */}
                <button
                    onClick={toggleDarkMode}
                    style={{
                        width: 36, height: 36,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: 'var(--accent-soft)', color: 'var(--accent)',
                    }}
                    title={isDarkMode ? "Yorug' rejim" : "Qorong'i rejim"}
                >
                    {isDarkMode
                        ? <Sun style={{ width: 16, height: 16 }} />
                        : <Moon style={{ width: 16, height: 16 }} />
                    }
                </button>

                {/* Profile dropdown */}
                <div style={{ position: 'relative' }} ref={menuRef}>
                    <button
                        onClick={() => setOpenMenu(!openMenu)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 10px 6px 6px',
                            borderRadius: 10, border: `1.5px solid ${openMenu ? 'var(--accent)' : 'var(--input-border)'}`,
                            background: openMenu ? 'var(--accent-soft)' : 'var(--input-bg)',
                            cursor: 'pointer',
                        }}
                    >
                        <div
                            style={{
                                width: 28, height: 28, borderRadius: 8,
                                background: 'linear-gradient(135deg, var(--accent), #7c3aed)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.72rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                            }}
                        >
                            {roleLabel.charAt(0)}
                        </div>
                        {/* Role label — hidden on very small screens */}
                        <div style={{ display: 'block', textAlign: 'left' }} className="hidden sm:block">
                            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                                {roleLabel}
                            </div>
                            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1.2 }}>
                                Tizimda
                            </div>
                        </div>
                        <ChevronDown
                            style={{
                                width: 14, height: 14, color: 'var(--text-muted)',
                                transform: openMenu ? 'rotate(180deg)' : 'none',
                                transition: 'transform 0.2s ease',
                            }}
                        />
                    </button>

                    {openMenu && (
                        <div
                            style={{
                                position: 'absolute',
                                right: 0,
                                top: 'calc(100% + 8px)',
                                width: 200,
                                background: 'var(--card-bg)',
                                border: '1px solid var(--card-border)',
                                borderRadius: 14,
                                boxShadow: 'var(--shadow-lg)',
                                zIndex: 60,
                                animation: 'modalIn 0.15s ease',
                                overflow: 'hidden',
                            }}
                        >
                            {/* Header */}
                            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div
                                    style={{
                                        width: 36, height: 36, borderRadius: 10,
                                        background: 'linear-gradient(135deg, var(--accent), #7c3aed)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.875rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                                    }}
                                >
                                    {roleLabel.charAt(0)}
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{roleLabel}</div>
                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Tizim foydalanuvchisi</div>
                                </div>
                            </div>

                            <div style={{ padding: '6px 0' }}>
                                <button
                                    onClick={() => { navigate("/profile"); setOpenMenu(false); }}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '10px 16px', border: 'none', background: 'transparent',
                                        cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-primary)',
                                        transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-soft)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <User style={{ width: 14, height: 14 }} />
                                    </div>
                                    Profil
                                </button>

                                <div style={{ height: 1, background: 'var(--card-border)', margin: '4px 12px' }} />

                                <button
                                    onClick={handleLogout}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '10px 16px', border: 'none', background: 'transparent',
                                        cursor: 'pointer', fontSize: '0.82rem', color: 'var(--danger)',
                                        transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-soft)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--danger-soft)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <LogOut style={{ width: 14, height: 14 }} />
                                    </div>
                                    Chiqish
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {props.children}
        </header>
    );
}

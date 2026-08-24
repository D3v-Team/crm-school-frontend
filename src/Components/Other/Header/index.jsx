import React, { useState, useRef, useEffect } from "react";
import { LogOut, User, ChevronDown, Moon, Sun, Menu, Bell, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { useAppSelector } from "../../../store/hooks";

export default function Header({ active, sidebarOpen, sidebarW = 260, ...props }) {
    const navigate = useNavigate();
    const [openMenu, setOpenMenu] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const menuRef = useRef(null);

    const roleFromStore = useAppSelector((s) => s.auth?.role);
    const role = roleFromStore || Cookies.get('role') || null;
    const roleLabel =
        role === 'super_admin' ? 'Super Admin' :
        role === 'admin' ? 'Admin' :
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
            className="fixed top-0 right-0 z-40 flex items-center justify-between px-5 transition-all duration-300"
            style={{
                left: sidebarW,
                height: 70,
                background: 'var(--card-bg)',
                borderBottom: '1px solid var(--card-border)',
                boxShadow: 'var(--shadow-sm)',
            }}
        >
            {/* Left */}
            <div className="flex items-center gap-3">
                <button
                    onClick={active}
                    className="w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 hover:scale-105 flex-shrink-0"
                    style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                >
                    <Menu className="w-4 h-4" />
                </button>

                {/* Search */}
                <div
                    className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: 'var(--input-bg)', border: '1.5px solid var(--input-border)' }}
                >
                    <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Qidirish..."
                        className="bg-transparent outline-none text-sm transition-all duration-200 focus:w-48 w-36"
                        style={{ color: 'var(--input-text)' }}
                    />
                </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
                {/* Dark mode */}
                <button
                    onClick={toggleDarkMode}
                    className="w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 hover:scale-105"
                    style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                    title={isDarkMode ? "Yorug' rejim" : "Qorong'i rejim"}
                >
                    {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

          

                {/* Profile */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setOpenMenu(!openMenu)}
                        className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl transition-all duration-200"
                        style={{
                            background: openMenu ? 'var(--accent-soft)' : 'var(--input-bg)',
                            border: `1.5px solid ${openMenu ? 'var(--accent)' : 'var(--input-border)'}`,
                        }}
                    >
                        <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                            style={{ background: 'linear-gradient(135deg, var(--accent), #7c3aed)' }}
                        >
                            {roleLabel.charAt(0)}
                        </div>
                        <div className="hidden sm:block text-left">
                            <div className="text-xs font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                                {roleLabel}
                            </div>
                            <div className="text-[10px] leading-tight" style={{ color: 'var(--text-muted)' }}>
                                Online
                            </div>
                        </div>
                        <ChevronDown
                            className="w-3.5 h-3.5 transition-transform duration-200"
                            style={{
                                color: 'var(--text-muted)',
                                transform: openMenu ? 'rotate(180deg)' : 'rotate(0)',
                            }}
                        />
                    </button>

                    {openMenu && (
                        <div
                            className="absolute right-0 mt-2 w-52 py-2 z-50"
                            style={{
                                background: 'var(--card-bg)',
                                border: '1px solid var(--card-border)',
                                borderRadius: '14px',
                                boxShadow: 'var(--shadow-lg)',
                                animation: 'modalIn 0.2s ease',
                            }}
                        >
                            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--card-border)' }}>
                                <div className="flex items-center gap-2.5">
                                    <div
                                        className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                                        style={{ background: 'linear-gradient(135deg, var(--accent), #7c3aed)' }}
                                    >
                                        {roleLabel.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                            {roleLabel}
                                        </div>
                                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                            Tizim foydalanuvchisi
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="py-1">
                                <button
                                    onClick={() => { navigate("/profile"); setOpenMenu(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150"
                                    style={{ color: 'var(--text-primary)' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-soft)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div
                                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                                        style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                                    >
                                        <User className="w-3.5 h-3.5" />
                                    </div>
                                    <span>Profil</span>
                                </button>

                                <div className="my-1 mx-3 h-px" style={{ background: 'var(--card-border)' }} />

                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150"
                                    style={{ color: 'var(--danger)' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-soft)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div
                                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                                        style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}
                                    >
                                        <LogOut className="w-3.5 h-3.5" />
                                    </div>
                                    <span>Chiqish</span>
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

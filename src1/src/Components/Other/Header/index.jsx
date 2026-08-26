import React, { useState, useRef, useEffect, useMemo } from "react";
import { LogOut, User, ChevronDown, Moon, Sun, Menu, ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@material-tailwind/react";

export default function Header({ active, sidebarOpen, ...props }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [openMenu, setOpenMenu] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const menuRef = useRef(null);

    // Определяем, показывать ли кнопку "Назад"
    const showBackButton = useMemo(() => {
        const path = location.pathname;
        return /^\/student\/[^/]+$/.test(path) ||
            /^\/group\/[^/]+$/.test(path) ||
            /^\/teacher-profile\/[^/]+$/.test(path) ||
            /^\/profile$/.test(path);
    }, [location.pathname]);

    // Инициализация темы
    useEffect(() => {
        const savedTheme = localStorage.getItem("theme");
        const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

        if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
            setIsDarkMode(true);
            document.documentElement.classList.add("dark");
        } else {
            setIsDarkMode(false);
            document.documentElement.classList.remove("dark");
        }
    }, []);

    const toggleDarkMode = () => {
        const newDarkMode = !isDarkMode;
        setIsDarkMode(newDarkMode);

        if (newDarkMode) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    const handleBack = () => {
        navigate(-1);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div
            className={`fixed top-[8px] z-30 flex justify-between items-center mb-6 px-2 py-2 rounded-lg border shadow-lg transition-all duration-500 backdrop-blur-md bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-primary)] ${sidebarOpen ? 'left-[296px] w-[calc(100%-304px)]' : 'left-[120px] w-[91%]'}`}
        >
            {/* Левая часть - кнопка меню и "Назад" */}
            <div className="flex items-center gap-[10px]">
                {showBackButton && (
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-border/50 bg-card text-text-primary hover:bg-accent/10 hover:border-accent transition-all duration-200"
                        title="Orqaga"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                )}
                <Button
                    onClick={active}
                    className="px-4 py-3 rounded-xl transition-all duration-300 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white"
                >
                    <Menu className="w-5 h-5" />
                </Button>

            </div>

            {/* Правая часть - переключатель темы + профиль */}
            <div className="flex items-center gap-2">
                <button
                    onClick={toggleDarkMode}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className={`
                        relative flex items-center justify-center w-10 h-10 rounded-xl border-2 shadow 
                        transition-all duration-500 bg-card text-text-primary
                        ${isDarkMode ? 'border-border' : 'border-gray-300'}
                        ${isHovered ? "scale-110 rotate-12" : "scale-100 rotate-0"}
                    `}
                    title={isDarkMode ? "Светлый режим" : "Тёмный режим"}
                >
                    {isDarkMode ? (
                        <Sun className="w-5 h-5 transition-transform duration-300" />
                    ) : (
                        <Moon className="w-5 h-5 transition-transform duration-300" />
                    )}
                </button>

                <div className="relative flex items-center gap-4" ref={menuRef}>
                    <button
                        onClick={() => setOpenMenu(!openMenu)}
                        className={`
                            flex items-center gap-1 px-4 py-1 rounded-xl 
                            border-2 transition-all duration-300 text-sm font-medium
                            bg-card text-text-primary shadow-sm
                            hover:bg-[var(--accent)]/10 hover:text-accent hover:border-accent
                            ${openMenu
                                ? 'border-accent'
                                : isDarkMode
                                    ? 'border-border'
                                    : 'border-gray-300'
                            }
                        `}
                    >
                        <div className="py-1 rounded-full bg-[var(--card-bg)]/50">
                            <User className="w-5 h-5" />
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openMenu ? "rotate-180" : ""}`} />
                    </button>

                    {openMenu && (
                        <div className="absolute right-0 top-16 w-48 bg-card border-2 border-border shadow-lg rounded-xl py-2 z-50 overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-border/50"></div>

                            <button
                                onClick={() => navigate("/profile")}
                                className="w-full px-4 py-3 text-left text-sm text-text-primary hover:bg-[var(--accent)]/10 hover:text-accent transition-all duration-200 flex items-center gap-2"
                            >
                                <User className="w-4 h-4" />
                                <span>Profil</span>
                            </button>

                            <div className="h-px my-1 bg-border/50"></div>

                            <button
                                onClick={handleLogout}
                                className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-all duration-200 flex items-center gap-2"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Chiqish</span>
                            </button>
                        </div>
                    )}
                    {props.children}
                </div>
            </div>
        </div>
    );
}
import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import Logo from "../../../Images/Logo.png";
import { Card, Typography } from "@material-tailwind/react";
import { SIDEBAR_CONFIG } from "../../../app/navigation/sidebar.config";
import { useAppSelector } from "../../../store/hooks";
import Cookies from 'js-cookie';

export default function Sidebar({ open }) {
    // try to get role from redux store, fallback to cookie
    const roleFromStore = useAppSelector((s) => s.auth?.role);
    const role = roleFromStore || Cookies.get('role') || null;
    const location = useLocation();

    const menuItems = SIDEBAR_CONFIG.filter((item) => {
        if (!item.roles || item.roles.length === 0) return true;
        if (!role) return false;
        return item.roles.includes(role);
    });
    return (
        <Card
            className={`h-[95%] fixed top-[8px] left-[10px] z-50 shadow-xl backdrop-blur-md px-4 py-6 overflow-y-auto transition-all duration-500 bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-primary)] ${open ? "w-[100px]" : "w-[280px]"}`}
        >
            <div className="flex items-center justify-center mb-6">
            </div>

            {/* Меню */}
            <div className="flex flex-col gap-6">
                <div>
                    {!open && (
                        <Typography
                            variant="small"
                            color="gray"
                            className="mb-2 uppercase font-medium text-xs tracking-widest"
                        >
                            Asosiy
                        </Typography>
                    )}
                    <div className="flex flex-col gap-2">
                        {menuItems.map((item, idx) => {
                            const Icon = item.icon;
                            return (
                                <NavLink
                                    key={item.path + idx}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `flex items-center ${open && 'justify-center'} gap-3 w-full px-4 py-3 rounded-lg transition-all duration-300 font-semibold
    ${isActive
                                            ? 'bg-accent text-white'
                                            : 'text-text-primary hover:bg-accent hover:text-white'
                                        }`
                                    }
                                >
                                    <span className="w-6 h-6 flex-shrink-0">
                                        <Icon className="w-6 h-6" />
                                    </span>
                                    {!open && <span className="text-sm">{item.label}</span>}
                                </NavLink>
                            );
                        })}
                    </div>
                </div>
            </div>
        </Card>
    );
}

import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from '../../Components/Other/Sidebar/Sidebar';
import Header from '../../Components/Other/Header';

export default function MainLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true); // true = expanded

    const toggleSidebar = () => setSidebarOpen((s) => !s);

    return (
        <div className="min-h-screen bg-[var(--page-bg)] text-[var(--text-primary)] transition-colors duration-300">
            <Sidebar open={!sidebarOpen} />
            <div className={`${sidebarOpen ? 'ml-[300px]' : 'ml-[120px]'} pt-[75px] pr-[8px] flex flex-col gap-[10px] min-h-screen transition-all duration-300`}>
                <Header active={toggleSidebar} sidebarOpen={sidebarOpen} />
                <Outlet />
            </div>
        </div>
    );
}

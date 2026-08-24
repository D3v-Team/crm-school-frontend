import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from '../../Components/Other/Sidebar/Sidebar';
import Header from '../../Components/Other/Header';

export default function MainLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true); // true = expanded

    const toggleSidebar = () => setSidebarOpen((s) => !s);

    // sidebarOpen=true  → sidebar width 260px
    // sidebarOpen=false → sidebar width 72px
    const sidebarW = sidebarOpen ? 260 : 72;

    return (
        <div
            className="min-h-screen transition-colors duration-300"
            style={{ background: 'var(--page-bg)', overflow: 'hidden' }}
        >
            <Sidebar open={!sidebarOpen} />

            {/* Main content — shifted right by sidebar width, no x-overflow */}
            <div
                className="flex flex-col min-h-screen transition-all duration-300"
                style={{
                    marginLeft: sidebarW,
                    overflowX: 'hidden',
                }}
            >
                <Header active={toggleSidebar} sidebarOpen={sidebarOpen} sidebarW={sidebarW} />

                {/* Page body below fixed header */}
                <main
                    className="flex flex-col gap-4 flex-1 page-enter"
                    style={{ paddingTop: 88, paddingLeft: 20, paddingRight: 20, paddingBottom: 24 }}
                >
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

import { Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from '../../Components/Other/Sidebar/Sidebar';
import Header from '../../Components/Other/Header';
import BottomNav from '../../Components/Other/BottomNav/BottomNav';
import { useAppSelector } from '../../store/hooks';
import useMobileTableCards from '../../utils/useMobileTableCards';

const MOBILE_BP = 768; // px — below this sidebar becomes drawer

export default function MainLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);   // desktop: expanded/collapsed
    const [mobileOpen, setMobileOpen]   = useState(false);  // mobile: drawer open/close
    const [isMobile, setIsMobile]       = useState(window.innerWidth < MOBILE_BP);
    const role = useAppSelector((state) => state.auth?.role);
    useMobileTableCards(); // telefonda jadvallar → kartochkalar
    const { pathname } = useLocation();

    // Telefonda sahifa almashganda menyu (drawer) yopiladi
    useEffect(() => { setMobileOpen(false); }, [pathname]);

    useEffect(() => {
        const onResize = () => {
            const mobile = window.innerWidth < MOBILE_BP;
            setIsMobile(mobile);
            if (!mobile) setMobileOpen(false); // close drawer when going back to desktop
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const toggleSidebar = () => {
        if (isMobile) setMobileOpen(s => !s);
        else setSidebarOpen(s => !s);
    };

    const sidebarW = isMobile ? 0 : (sidebarOpen ? 260 : 72);

    return (
        <div style={{ background: 'var(--page-bg)', minHeight: '100vh', overflow: 'hidden' }}>
            <Sidebar
                open={!sidebarOpen}          // desktop: collapsed prop
                mobileOpen={mobileOpen}       // mobile: drawer open
                isMobile={isMobile}
                onClose={() => setMobileOpen(false)}
            />

            {/* Mobile overlay */}
            {isMobile && mobileOpen && (
                <div
                    onClick={() => setMobileOpen(false)}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 40,
                        background: 'rgba(0,0,0,0.45)',
                        backdropFilter: 'blur(2px)',
                        animation: 'fadeIn 0.2s ease',
                    }}
                />
            )}

            {/* Main content */}
            <div
                style={{
                    marginLeft: sidebarW,
                    transition: 'margin-left 0.3s ease',
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    overflowX: 'hidden',
                }}
            >
                <Header
                    active={toggleSidebar}
                    sidebarOpen={sidebarOpen}
                    sidebarW={sidebarW}
                    isMobile={isMobile}
                />

                <main
                    className="page-enter"
                    style={{
                        paddingTop: 78,
                        paddingLeft: isMobile ? 12 : 20,
                        paddingRight: isMobile ? 12 : 20,
                        // Telefonda pastki navigatsiya paneli uchun joy (+ iPhone pastki chizig'i)
                        paddingBottom: isMobile ? 'calc(84px + env(safe-area-inset-bottom))' : 24,
                        flex: 1,
                        minWidth: 0,
                        width: '100%',
                        maxWidth: '100%',
                    }}
                >
                    <Outlet />
                </main>
            </div>

            {isMobile && <BottomNav role={role} menuOpen={mobileOpen} onMenu={() => setMobileOpen((open) => !open)} />}
        </div>
    );
}

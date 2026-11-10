import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header        from "./Header";
import SideMenu      from "./SideMenu";
import ErrorBoundary from "../common/ErrorBoundary";

export default function Layout() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();

    // Auto-close mobile drawer on navigation without effect cascade
    const [prevPath, setPrevPath] = useState(location.pathname);
    if (prevPath !== location.pathname) {
        setPrevPath(location.pathname);
        if (mobileOpen) {
            setMobileOpen(false);
        }
    }

    return (
        <div className="layout">
            {/* Mobile backdrop overlay */}
            {mobileOpen && (
                <div 
                    className="mobile-backdrop" 
                    onClick={(e) => {
                        e.stopPropagation();
                        setMobileOpen(false);
                    }} 
                    aria-label="Close sidebar" 
                />
            )}

            <SideMenu 
                collapsed={collapsed} 
                setCollapsed={setCollapsed} 
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
            />

            <div className={`main-content ${collapsed ? "expanded" : ""}`}>
                <Header 
                    setMobileOpen={setMobileOpen}
                />

                <main className="page-content">
                    {/* key resets error state when navigating to a different page */}
                    <ErrorBoundary key={location.pathname}>
                        <Outlet />
                    </ErrorBoundary>
                </main>
            </div>
        </div>
    );
}

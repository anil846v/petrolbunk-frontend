import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header        from "./Header";
import SideMenu      from "./SideMenu";
import ErrorBoundary from "../common/ErrorBoundary";

export default function Layout() {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();

    return (
        <div className="layout">
            <SideMenu collapsed={collapsed} setCollapsed={setCollapsed} />

            <div className={`main-content ${collapsed ? "expanded" : ""}`}>
                <Header />

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

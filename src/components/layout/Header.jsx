import { useState, useRef, useEffect } from "react";
import { Bell, UserCircle, LogOut, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Header({ setMobileOpen }) {
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const menuRef = useRef(null);

    const handleLogout = async () => {
        await logout();
        navigate("/admin/login", { replace: true });
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className="header">
            <div className="header-left">
                {/* Mobile hamburger menu button */}
                <button
                    type="button"
                    className="header-mobile-toggle"
                    onClick={(e) => {
                        e.stopPropagation();
                        setMobileOpen?.(prev => !prev);
                    }}
                    aria-label="Toggle navigation drawer"
                >
                    <Menu size={20} />
                </button>

                <h2 className="header-title">
                    <span className="hidden sm:inline">Petrol Bunk Management System</span>
                    <span className="inline sm:hidden font-bold">Petrol Bunk</span>
                </h2>
            </div>
            <div className="header-right">
                <button className="header-icon-btn" aria-label="Notifications">
                    <Bell size={20} className="header-icon" />
                </button>

                <div className="profile-menu" ref={menuRef}>
                    <button
                        className="profile-btn"
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                    >
                        <UserCircle size={34} />
                    </button>

                    {showProfileMenu && (
                        <div className="profile-dropdown">
                            <div className="profile-info">
                                <span className="profile-name">
                                    {user?.username || "Admin"}
                                </span>
                                <span className="profile-role">
                                    {user?.role || "Administrator"}
                                </span>
                            </div>

                            <button className="logout-btn" onClick={handleLogout}>
                                <LogOut size={18} />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

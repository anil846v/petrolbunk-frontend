import { useState, useRef, useEffect } from "react";
import { Bell, UserCircle, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Header() {
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
                <h2 className="header-title">Petrol Bunk Management System</h2>
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
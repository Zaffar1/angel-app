import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaSearch, FaBars, FaTimes, FaChevronDown, FaBell, FaEye, FaEdit, FaBullseye, FaChevronRight, FaLock } from "react-icons/fa";
import { AvatarImage } from "./AvatarImage";
import useUserProfile from "../hooks/useUserProfile";
import Logout from "./Logout";
import Logo from "../assets/logo.svg";
import { useNotifications } from "../api/notification";
import NotificationOrganization from "./notifications/NotificationOrganization";
import NotificationVolunteer from "./notifications/NotificationVolunteer";

export default function Header({ navItems = [], showSearch = true }) {
  const { user, token } = useUserProfile();
  const [notifOpen, setNotifOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef(null);
  const location = useLocation();
  const isLoggedIn = !!token;

  const { unreadCount, markAllAsRead, refetch } = useNotifications();

  useEffect(() => {
    const close = (e) => !ref.current?.contains(e.target) && setDropOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const toggleNotification = () => {
    const willOpen = !notifOpen;
    setNotifOpen(willOpen);

    if (willOpen && unreadCount > 0) {
      markAllAsRead();
    }
  };

  return (
    <header className="bg-white shadow-sm fixed w-full z-50">
      <div className="max-w-[1440px] mx-auto flex justify-between items-center px-6 py-4">
        <Link to="/"><img src={Logo} alt="Logo" className="w-36" /></Link>

        {isLoggedIn && showSearch && (
          <div className="relative hidden md:block">
            <input
              className="shadow-md border-gray-200 border rounded-full pl-4 pr-10 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Search..."
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-800 p-2 rounded-full">
              <FaSearch color="white" />
            </span>
          </div>
        )}

        <div className="flex items-center gap-4">
          {isLoggedIn && (
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => {
                const hasDropdown = item.dropdownItems && item.dropdownItems.length > 0;
                return hasDropdown ? (
                  <div key={item.name} className="relative group">
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-all cursor-pointer">
                      {item.name} <FaChevronDown className="text-[10px]" />
                    </button>
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                      {item.dropdownItems.map((subItem) => (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${location.pathname === item.path
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                      : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                      }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          )}


          {!isLoggedIn ? (
            <div className="flex items-center gap-3">
              <Link to="/login" className="px-5 py-2 border border-blue-500 text-blue-500 rounded-full hover:bg-blue-500 hover:text-white">Login</Link>
              <Link to="/register" className="px-5 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600">Register</Link>
            </div>
          ) : (
            <>
              <div
                role="button"
                tabIndex={0}
                onClick={toggleNotification}
                className="relative p-2 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <FaBell className="text-gray-700 text-lg" />

                {unreadCount > 0 && (
                  <span className="absolute -top-1 right-0 bg-red-500 text-white text-xs px-[5px] py-[1px] rounded-full">
                    {unreadCount}
                  </span>
                )}

                {notifOpen &&
                  (user?.type === "organization" ? (
                    <NotificationOrganization onClose={() => setNotifOpen(false)} />
                  ) : (
                    <NotificationVolunteer onClose={() => setNotifOpen(false)} />
                  ))}
              </div>

              <div ref={ref} className="relative cursor-pointer">
                <button onClick={() => setDropOpen(!dropOpen)} className="flex items-center gap-2">
                  <AvatarImage src={user?.image} alt={user?.name} size="40px" />
                  <p className="hidden md:block text-sm font-medium text-gray-800 max-w-[100px] truncate">
                    {user?.company_name || user?.name}
                  </p>
                  <FaChevronDown className="text-gray-500 text-xs" />
                </button>

                {dropOpen && (
                  <div className="absolute right-0 top-11 w-52 bg-white border border-gray-100 rounded-[15px] shadow-lg overflow-hidden transition-all duration-200">
                    <Link
                      to={`/${user?.type}/edit`}
                      className={`flex items-center justify-between px-4 py-2.5 transition-colors ${location.pathname === `/${user?.type}/edit`
                        ? "bg-blue-500 text-white font-medium hover:bg-blue-600"
                        : "hover:bg-gray-50 text-gray-700"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <FaEdit className={`w-4 h-4 ${location.pathname !== `/${user?.type}/edit` ? "text-blue-500" : ""}`} />
                        Edit Profile
                      </div>
                    </Link>
                    <Link
                      to={`/${user?.type}/profile`}
                      className={`flex items-center justify-between px-4 py-2.5 transition-colors ${location.pathname === `/${user?.type}/profile`
                        ? "bg-blue-500 text-white font-medium hover:bg-blue-600"
                        : "hover:bg-gray-50 text-gray-700"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <FaEye className={`w-4 h-4 ${location.pathname !== `/${user?.type}/profile` ? "text-blue-500" : ""}`} />
                        View Profile
                      </div>
                    </Link>
                    <Link
                      to={`/${user?.type}/change-password`}
                      className={`flex items-center justify-between px-4 py-2.5 transition-colors ${location.pathname === `/${user?.type}/change-password`
                        ? "bg-blue-500 text-white font-medium hover:bg-blue-600"
                        : "hover:bg-gray-50 text-gray-700"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <FaLock className={`w-4 h-4 ${location.pathname !== `/${user?.type}/change-password` ? "text-blue-500" : ""}`} />
                        Change Password
                      </div>
                    </Link>
                    {user?.type === "organization" && (
                      <Link
                        to="/organization/mission/by-organization"
                        className={`flex items-center justify-between px-4 py-2.5 transition-colors ${location.pathname === "/organization/mission/by-organization"
                          ? "bg-blue-500 text-white font-medium hover:bg-blue-600"
                          : "hover:bg-gray-50 text-gray-700"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <FaBullseye className={`w-4 h-4 ${location.pathname !== "/organization/mission/by-organization" ? "text-blue-500" : ""}`} />
                          My Missions
                        </div>
                      </Link>
                    )}
                    <Logout />
                  </div>
                )}
              </div>

              <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-full hover:bg-gray-100">
                {menuOpen ? <FaTimes /> : <FaBars />}
              </button>
            </>
          )}
        </div>
      </div>

      {menuOpen && isLoggedIn && (
        <div className="md:hidden bg-white border-t px-6 pb-4">
          {navItems.map((item) => (
            <div key={item.name || item.path}>
              {item.dropdownItems ? (
                <div className="py-2">
                  <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">{item.name}</div>
                  {item.dropdownItems.map((subItem) => (
                    <Link
                      key={subItem.path}
                      to={subItem.path}
                      onClick={() => setMenuOpen(false)}
                      className={`block px-4 py-2.5 rounded-xl transition-all mb-1 ${location.pathname === subItem.path
                        ? "bg-blue-600 text-white font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      {subItem.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={`block px-4 py-2.5 rounded-xl transition-all mb-1 ${location.pathname === item.path
                    ? "bg-blue-600 text-white font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  {item.name}
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

    </header>
  );
}

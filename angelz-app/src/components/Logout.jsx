import { useDispatch } from "react-redux";
import { showSuccess } from "../utils/toast";
import { clearCredentials } from "../features/auth/authSlice";

import { FaSignOutAlt, FaChevronRight } from "react-icons/fa";

export default function Logout({ className = "" }) {
    const dispatch = useDispatch();
    const handleLogout = () => {
        dispatch(clearCredentials());
        showSuccess("Logged out successfully!");
    };
    return (
        <button
            onClick={handleLogout}
            className={`w-full flex items-center justify-between px-4 py-2 text-red-500 hover:bg-red-50 transition cursor-pointer font-medium ${className}`}
        >
            <div className="flex items-center gap-3">
                <FaSignOutAlt className="w-4 h-4" />
                Logout
            </div>
            {/* <FaChevronRight className="w-3 h-3 text-red-300" /> */}
        </button>
    );
}

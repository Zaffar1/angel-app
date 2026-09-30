import { useEffect, useState } from "react";
import { FaWifi } from "react-icons/fa";

export function InternetStatus() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShow(true), 500);
        return () => clearTimeout(timer);
    }, []);

    if (!show) return null;

    return (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-100">
            <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-bounce">
                <FaWifi className="w-5 h-5 animate-pulse" />
                <div>
                    <p className="font-semibold">Connection Lost</p>
                    <p className="text-sm opacity-90">Waiting for internet connection...</p>
                </div>
            </div>
        </div>
    );
}
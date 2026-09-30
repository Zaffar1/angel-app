import React from "react";
import { useNavigate } from "react-router-dom";
import { FaCalendar, FaClock, FaMedal } from "react-icons/fa";
import { formatDateTime, formatDateTimeWithLocalTime } from "../../utils/dateUtils";
import { getImageUrl } from "../../utils/getImageUrl";
import useUserProfile from "../../hooks/useUserProfile";
import { formatStatus } from "../../utils/missionStatusUtils";

export default function MissionCard({
    id,
    name = "Untitled Mission",
    description = "",
    start_time,
    points = 0,
    status = "pending",
    file,
    image,
    company_name,
    organization = {},
}) {
    const navigate = useNavigate();
    const { date, time } = formatDateTimeWithLocalTime(start_time);
    const { user } = useUserProfile()
    const isOrganization = user?.type == "organization"
    const imageUrl = getImageUrl(file || image) || `https://placehold.co/600x400?text=${encodeURIComponent(name)}`;
    const handleClick = () => {
        if (!user?.type) return;
        navigate(`/${user.type}/mission/${id}`);
    }
    const statusColor = {
        open: "bg-blue-500",
        pending: "bg-yellow-500",
        process: "bg-yellow-500",
        inprogress: "bg-purple-500",
        completed: "bg-green-500",
    }[status?.toLowerCase()] || "bg-gray-400";

    const displayStatus = formatStatus(status?.toLowerCase() === "process" ? "pending" : status);

    return (
        <div
            onClick={handleClick}
            className="group glass-card overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer"
        >
            <div className="relative">
                <img
                    src={imageUrl}
                    alt={name}
                    className="w-full h-44 object-cover transition-transform duration-200 group-hover:scale-105"
                />
                <span className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
                    {organization?.company_name || company_name || "Unknown Org"}
                </span>
                <span
                    className={`absolute top-3 right-3 ${statusColor} text-white text-xs font-semibold px-2 py-1 rounded-full`}
                >
                    {displayStatus}
                </span>
            </div>

            <div className="p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 text-lg leading-tight line-clamp-1">
                    {name}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-1">{description}</p>

                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                        <FaCalendar className="text-orange-500 w-4 h-4" />
                        <span className="capitalize">{date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <FaClock className="text-orange-500 w-4 h-4" />
                        <span>{time}</span>
                    </div>
                </div>

                <button
                    className="w-full py-2 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    onClick={handleClick}
                >
                    <FaMedal className="w-4 h-4" />
                    {points} Points
                </button>
            </div>
        </div>
    );
}

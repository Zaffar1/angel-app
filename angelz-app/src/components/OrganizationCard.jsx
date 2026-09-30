import React from "react";
import { useNavigate } from "react-router-dom";
import { FaBuilding, FaEnvelope, FaUser } from "react-icons/fa";
import { getImageUrl } from "../utils/getImageUrl";
import useUserProfile from "../hooks/useUserProfile";

export default function OrganizationCard({
    id,
    company_name = "Unknown Organization",
    company_description = "No description available.",
    company_type,
    email,
    name,
    type,
    file,
    image,
}) {
    const navigate = useNavigate();
    const { user } = useUserProfile();

    const imageUrl =
        getImageUrl(file || image) ||
        `https://placehold.co/600x400?text=${encodeURIComponent(company_name)}`;

    const handleClick = () => {
        const rolePrefix = user?.type === "volunteer_group" ? "/volunteer_group" : "/volunteer";
        navigate(`${rolePrefix}/organization/${id}`);
    };

    return (
        <div
            key={id}
            onClick={handleClick}
            className="group glass-card overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer"
        >
            <div className="px-4 pt-4">
                <div className="relative rounded-2xl overflow-hidden shadow-sm">
                    <img
                        src={imageUrl}
                        alt={company_name}
                        className="w-full h-44 object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                    <span className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
                        {company_type || "Organization"}
                    </span>
                </div>
            </div>
            <div className="p-5 space-y-3">
                <h3 className="font-bold text-gray-900 text-lg leading-tight line-clamp-1">
                    {company_name}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                    {company_description}
                </p>
                <div className="flex flex-col gap-2 text-sm text-gray-700 py-1">
                    <div className="flex items-center gap-2">
                        <FaUser className="text-[#4C95FF] w-4 h-4" />
                        <span className="font-medium">{name || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <FaEnvelope className="text-[#4C95FF] w-4 h-4" />
                        <span className="font-medium">{email || "Not provided"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <FaBuilding className="text-[#4C95FF] w-4 h-4" />
                        <span className="font-medium text-blue-600/80">{type || "organization"}</span>
                    </div>
                </div>
                <button
                    className="w-full py-3 mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-[#4C95FF] to-[#2B61FF] hover:opacity-90 text-white rounded-full text-sm font-bold shadow-md transition-all active:scale-[0.98]"
                    onClick={handleClick}
                > View Organization
                </button>
            </div>
        </div>
    );
}

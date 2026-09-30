import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { FaBuilding, FaEnvelope, FaUser } from "react-icons/fa";
import { getImageUrl } from "../utils/getImageUrl";

export default function VolunteerCard({
    id,
    name = "Unknown volunteer",
    description = "No description available.",
    email,
    type,
    file,
    image,
}) {
    const navigate = useNavigate();
    const [imgError, setImgError] = useState(false);

    // Prioritize image or file from backend
    const displayImage = image || file;
    const imageUrl = getImageUrl(displayImage);

    const getInitials = (fullName) => {
        if (!fullName) return "?";
        const parts = fullName.trim().split(/\s+/);
        if (parts.length === 1) return parts[0][0].toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };
    const handleClick = () => {
        navigate(`/organization/volunteer/${id}`);
    };
    return (
        <div
            key={id}
            onClick={handleClick}
            className="group glass-card overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col h-full"
        >
            <div className="px-3 pt-3">
                <div className="relative rounded-2xl overflow-hidden shadow-sm aspect-video bg-gray-100 flex items-center justify-center">
                    {imageUrl && !imgError ? (
                        <img
                            src={imageUrl}
                            alt={name}
                            onError={() => setImgError(true)}
                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#4C95FF] to-[#2B61FF] flex items-center justify-center text-white font-bold text-4xl tracking-wider">
                            {getInitials(name)}
                        </div>
                    )}
                    <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-[#2B61FF] text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm uppercase">
                        {type || "volunteer"}
                    </span>
                </div>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                    <h3 className="font-bold text-gray-900 text-lg leading-tight line-clamp-1">
                        {name}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                        {description}
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
                            <span className="font-medium text-blue-600/80">{type || "volunteer"}</span>
                        </div>
                    </div>
                </div>

                <div className="pt-3">
                    <button
                        className="w-full py-3 flex items-center justify-center gap-2 bg-gradient-to-r from-[#4C95FF] to-[#2B61FF] hover:opacity-90 text-white rounded-full text-sm font-bold shadow-md transition-all active:scale-[0.98]"
                        onClick={handleClick}
                    >
                        View Volunteer
                    </button>
                </div>
            </div>
        </div>
    );
}

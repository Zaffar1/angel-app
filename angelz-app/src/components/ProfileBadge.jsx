import { FaMedal } from "react-icons/fa";

export default function ProfileBadge({ rank }) {
    const rankMap = {
        "Bronze Angel": { iconColor: "text-amber-600", label: "Bronze Angel" },
        "Silver Angel": { iconColor: "text-gray-400", label: "Silver Angel" },
        "Gold Angel": { iconColor: "text-yellow-500", label: "Gold Angel" },
    };
    const currentRank = rankMap[rank] || rankMap["Bronze Angel"];
    return (
        <div className="flex items-center gap-2">
            <FaMedal className={`w-5 h-5 ${currentRank.iconColor}`} />
            <span className="text-sm font-semibold text-gray-800">
                {currentRank.label}
            </span>
        </div>
    );
}

import { FaMedal } from "react-icons/fa";
import useLocale from "../hooks/useLocale";

export default function ProfileBadge({ rank }) {
    const { t } = useLocale("volunteer");
    const rankMap = {
        "Bronze Angel": { iconColor: "text-amber-600", label: t("ranks.bronze") },
        "Silver Angel": { iconColor: "text-gray-400", label: t("ranks.silver") },
        "Gold Angel": { iconColor: "text-yellow-500", label: t("ranks.gold") },
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

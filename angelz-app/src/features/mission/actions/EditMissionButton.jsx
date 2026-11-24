import { useNavigate } from "react-router-dom";
import { FaPen } from "react-icons/fa";
import { showError } from "../../../utils/toast";
import { getNonEditableMissionMessage, getNonEditableMissionReason } from "../../../utils/missionStatusUtils";

export default function EditMissionButton({ missionId, status }) {
    const navigate = useNavigate();
    const isOpen = String(status || "").toLowerCase() === "open";

    const handleClick = (e) => {
        e.stopPropagation();
        if (isOpen) {
            navigate(`/organization/mission/edit/${missionId}`);
        } else {
            showError(getNonEditableMissionMessage(status));
        }
    };

    return (
        <div
            onClick={handleClick}
            className={`inline-flex items-center justify-center ${isOpen ? "cursor-pointer" : "cursor-not-allowed"}`}
            title={isOpen ? "Edit Mission" : `${getNonEditableMissionReason(status)} (Only open missions can be edited)`}
        >
            <button
                type="button"
                disabled={!isOpen}
                className={`p-2 rounded-full shadow-lg transition pointer-events-none ${
                    isOpen
                        ? "bg-blue-500 hover:bg-blue-600 text-white"
                        : "bg-gray-300 text-gray-500 opacity-60 shadow-none"
                }`}
            >
                <FaPen size={16} />
            </button>
        </div>
    );
}

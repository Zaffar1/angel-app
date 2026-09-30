import { useNavigate } from "react-router-dom";
import { FaPen } from "react-icons/fa";

export default function EditMissionButton({ missionId }) {
    const navigate = useNavigate();

    return (
        <button
            onClick={() => navigate(`/organization/mission/edit/${missionId}`)}
            className="cursor-pointer p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg transition"
            title="Edit Mission"
        >
            <FaPen size={16} />
        </button>
    );
}

import { useState } from "react";
import { FaTrash } from "react-icons/fa";
import DeleteMissionModal from "../../../components/modals/DeleteMissionModal";

export default function DeleteMissionButton({ missionId }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="cursor-pointer p-2 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg transition"
                title="Delete Mission"
            >
                <FaTrash size={16} />
            </button>

            <DeleteMissionModal open={open} setOpen={setOpen} missionId={missionId} />
        </>
    );
}

import { useEffect } from "react";
import { useDeleteMission } from "../../api/mission";
import { useNavigate } from "react-router-dom";
import { ThemeButton } from "../ThemeButton";
import Portal from "../Portal";

export default function DeleteMissionModal({ open, setOpen, missionId }) {
    const navigate = useNavigate();
    const { mutateAsync: deleteMission, isPending } = useDeleteMission();

    useEffect(() => {
        const handleKeyDown = (e) => e.key === "Escape" && setOpen(false);
        if (open) document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, setOpen]);

    if (!open) return null;
    const handleDelete = async () => {
        if (!missionId || isPending) return;

        await deleteMission(missionId, {
            onSuccess: () => {
                setOpen(false);
                navigate("/organization/mission/by-organization");
            },
        });
    };
    return (
        <Portal>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
                role="dialog"
                aria-modal="true"
            >
                <div className="absolute inset-0" onClick={() => setOpen(false)} />

                <div className="relative bg-white w-full max-w-sm sm:max-w-md rounded-2xl shadow-2xl p-6 sm:p-8 animate-fade-in-up">
                    <h2 className="text-xl font-semibold text-gray-800 text-center mb-3">
                        Delete Mission
                    </h2>

                    <p className="text-sm text-gray-600 text-center leading-relaxed">
                        Are you sure you want to delete this mission?
                        <br />
                        <span className="text-red-500 font-medium">
                            This action cannot be undone.
                        </span>
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
                        <ThemeButton
                            bgColor="bg-gray-200"
                            hoverColor="hover:bg-gray-300"
                            textColor="text-gray-800"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </ThemeButton>
                        <ThemeButton
                            bgColor="bg-red-500"
                            hoverColor="hover:bg-red-600"
                            textColor="text-white"
                            onClick={handleDelete}
                            isLoading={isPending}
                        >
                            Delete
                        </ThemeButton>
                    </div>
                </div>
            </div>
        </Portal>
    );
}

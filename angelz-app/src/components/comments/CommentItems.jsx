import { useState, useRef, useEffect } from "react";
import { FiEdit2, FiTrash2, FiCheck, FiX } from "react-icons/fi";
import { FaCalendar, FaClock } from "react-icons/fa";
import Tooltip from "../Tooltip";
import ConfirmDialog from "../ConfirmDialog";
import {
    useUpdateCommentOnFeedMutation,
    useDeleteCommentOnFeedMission,
} from "../../api/mission";
import { formatDateTimeWithLocalTime } from "../../utils/dateUtils";

export default function CommentItem({ comment, currentUserId, posted_by }) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(comment?.comment);
    const [error, setError] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const commentRef = useRef(null);
    const isFirstMount = useRef(true);

    const isCommentAuthor = comment?.user_id === currentUserId;
    const isDisabled = comment?.is_disabled === 1;

    const updateMutation = useUpdateCommentOnFeedMutation();
    const deleteMutation = useDeleteCommentOnFeedMission();

    const isDeleting = deleteMutation.isPending;
    const isUpdating = updateMutation.isPending;

    const commentTimestamp = comment?.created_at || comment?.createdAt || comment?.updated_at || comment?.timestamp;
    const { date, time } = formatDateTimeWithLocalTime(commentTimestamp);

    const handleChange = (e) => {
        const input = e.target.value;
        if (input.length > 100) {
            setError("Comment cannot exceed 100 characters");
        } else {
            setError("");
        }
        setValue(input.slice(0, 100));
    };

    const handleSave = () => {
        if (!value.trim()) return;
        updateMutation.mutate(
            { commentId: comment?.id, comment: value },
            { onSuccess: () => setEditing(false) }
        );
    };



    return (
        <>
            <div ref={commentRef} className="flex gap-3 items-start mb-6">
                <div className={`flex-1 relative p-4 rounded-xl border backdrop-blur-sm ${isCommentAuthor ? "border-blue-500 bg-[#FFFFFF80]" : "border-gray-200 bg-[#FFFFFF80]"}`}>
                    <div className="flex gap-2 items-center mb-2">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-semibold">
                            {comment?.user_name?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "U"}
                        </span>
                        <p className="text-gray-900 text-sm font-semibold leading-none">{comment?.user_name || "User"}</p>
                    </div>

                    {editing ? (
                        <>
                            <input
                                type="text"
                                value={value}
                                onChange={handleChange}
                                onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                                placeholder="Edit comment..."
                                className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none w-full
                                  ${error ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-400"}`}
                            />
                            <div className="flex gap-2 mt-2 justify-between items-center">
                                <span className="text-xs text-gray-500">{value.length}/100 {" "}
                                    {error && <span className="text-xs text-red-500">{error}</span>}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        disabled={isUpdating || error}
                                        onClick={handleSave}
                                        className="text-green-600 text-sm flex items-center gap-1 disabled:opacity-50"
                                    >
                                        {isUpdating ? (
                                            <span className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full"></span>
                                        ) : (
                                            <FiCheck />
                                        )}
                                        Save
                                    </button>
                                    <button
                                        disabled={isUpdating}
                                        onClick={() => { setEditing(false); setValue(comment?.comment); setError(""); }}
                                        className="text-red-500 flex items-center gap-1 text-sm"
                                    >
                                        <FiX /> Cancel
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <p className={`text-sm mt-1 leading-relaxed ${isDisabled ? "italic text-gray-400" : "text-gray-700"}`}>
                            {isDisabled ? "This comment is disabled by the author." : comment?.comment}
                        </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 mt-3 pt-2 border-t border-gray-200">
                        <div className="flex items-center gap-1"><FaCalendar className="text-orange-500 w-3 h-3" /><span>{date}</span></div>
                        <div className="flex items-center gap-1"><FaClock className="text-orange-500 w-3 h-3" /><span>{time}</span></div>
                    </div>

                    <div className="absolute top-3 right-3 flex gap-3">
                        {isCommentAuthor && !editing && (
                            <>
                                <Tooltip text="Edit comment">
                                    <button
                                        disabled={isUpdating || isDisabled}
                                        onClick={() => setEditing(true)}
                                        className="cursor-pointer text-gray-500 hover:text-blue-600 disabled:opacity-40 w-6 h-6 flex items-center justify-center"
                                    >
                                        <FiEdit2 size={16} />
                                    </button>
                                </Tooltip>
                                <Tooltip text="Delete comment">
                                    <button
                                        disabled={isDeleting}
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="cursor-pointer text-gray-500 hover:text-red-600 disabled:opacity-40 w-6 h-6 flex items-center justify-center"
                                    >
                                        {isDeleting ? (
                                            <span className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></span>
                                        ) : <FiTrash2 size={16} />}
                                    </button>
                                </Tooltip>
                            </>
                        )}

                    </div>
                </div>
            </div>
            <ConfirmDialog
                open={showDeleteConfirm}
                title="Delete Comment?"
                message="Are you sure you want to delete this comment?"
                onConfirm={() => deleteMutation.mutate({ commentId: comment?.id })}
                onClose={() => setShowDeleteConfirm(false)}
            />

        </>
    );
}

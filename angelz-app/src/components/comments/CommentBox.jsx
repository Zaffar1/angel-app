import { useState } from "react";
import { useAddCommentOnFeedMutation } from "../../api/mission";

export default function CommentBox({ missionId, hasCommented, type }) {
    const [comment, setComment] = useState("");
    const [error, setError] = useState("");

    const { mutate, isPending } = useAddCommentOnFeedMutation({
        onSuccess: () => setComment(""),
    });

    const handleChange = (e) => {
        const value = e.target.value;
        if (value.length > 100) setError("Comment cannot exceed 100 characters");
        else setError("");
        setComment(value.slice(0, 100));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!comment.trim() || hasCommented) return;
        console.log("Submitting comment with payload:", { missionId, comment, type });
        mutate({ missionId, comment, type });
    };

    const isButtonDisabled = isPending || !comment.trim() || error || hasCommented;

    return (
        <div className="flex flex-col gap-2 w-full">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
                <input
                    type="text"
                    value={comment}
                    onChange={handleChange}
                    onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                    placeholder={hasCommented ? "You have already commented" : "Write your comment..."}
                    disabled={hasCommented}
                    className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none w-full backdrop-blur-sm
                        ${error ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-400"} 
                        ${hasCommented ? "bg-gray-100 cursor-not-allowed" : "bg-[#FFFFFF80]"}`}
                />
                <button
                    type="submit"
                    disabled={isButtonDisabled}
                    className={`px-4 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50 ${isButtonDisabled ? "cursor-not-allowed" : "cursor-pointer"} w-full sm:w-auto`}
                >
                    {isPending ? "Posting..." : "Comment"}
                </button>
            </form>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{comment.length}/100</span>
                {error && <span className="text-red-500">{error}</span>}
            </div>
            {hasCommented && (
                <p className="text-xs text-red-500 ">You have already commented on this feed.</p>
            )}
        </div>
    );
}

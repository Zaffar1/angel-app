import { FaEllipsisH, FaShare, FaComment } from "react-icons/fa";
import { getImageUrl } from "../utils/getImageUrl";
import { formatDate } from "../utils/dateUtils";
import { safeParseJson } from "../utils/safeParseJson";
import LikeToggleButton from "./LikeToggleButton";
import CommentsSection from "./comments/CommentSection";

export default function PostCard({
    id, title, image, tags, created_at, user_id, user_name,
    allow_interaction, liked, total_likes = 0, total_comments = 0, latest_comment_at, comments = [], posted_by, can_post
}) {
    const initials = user_name
        ?.split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U";

    const defaultInteractions = {
        comments: true,
        likes: true,
        share: true,
    };
    let parsed = safeParseJson(allow_interaction, null);
    if (typeof parsed === 'string') parsed = safeParseJson(parsed, null); // Just in case it's double stringified but escaped
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        parsed = {};
    }
    const interactionSettings = { ...defaultInteractions, ...parsed };

    const imageUrl = getImageUrl(image) || `https://placehold.co/600x400?text=${encodeURIComponent(title || "Post")}`;
    const formattedDate = formatDate(created_at);

    const parsedTags = (() => {
        let raw = tags;
        if (!raw) return [];
        if (typeof raw === "string") {
            try { raw = JSON.parse(raw); } catch { return [raw]; }
        }
        if (Array.isArray(raw)) {
            return raw.map(t => (typeof t === "object" && t !== null ? t.name ?? JSON.stringify(t) : String(t)));
        }
        return [];
    })();

    return (
        <div className="glass-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-semibold rounded-full shadow-sm">
                        {initials}
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 text-sm leading-tight">{user_name || "Anonymous"}</span>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-[10px] font-bold uppercase tracking-wider">Post</span>
                        </div>
                        <span className="text-xs text-gray-400">{formattedDate}</span>
                    </div>
                </div>
                <FaEllipsisH className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" />
            </div>
            <div className="px-4">
                <div className="rounded-xl overflow-hidden bg-gray-100">
                    <img
                        src={imageUrl}
                        alt={title}
                        className="w-full h-72 md:h-80 lg:h-96 object-cover"
                    />
                </div>
            </div>

            <div className="px-5 mt-4">
                <h3 className="font-semibold text-base text-gray-900 capitalize leading-snug">
                    {title}
                </h3>
            </div>

            {parsedTags.length > 0 && (
                <div className="px-5 mt-3 flex flex-wrap gap-2">
                    {parsedTags.map((tag, i) => (
                        <span
                            key={i}
                            className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium"
                        >
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            <div className="border-t border-gray-200 mx-5 my-4"></div>

            <div className="flex justify-between items-center text-xs text-gray-500 px-5 mt-3">
                <div className="flex gap-4">
                    <span>{total_likes} {total_likes === 1 ? "Like" : "Likes"}</span>
                    <span>{total_comments} {total_comments === 1 ? "Comment" : "Comments"}</span>
                    <span>50 Shares</span>
                </div>
                <div className="flex gap-4">
                    <span>Posted by {user_name || "N/A"}</span>
                </div>
            </div>

            <div className="border-t border-gray-200 mx-5 my-4"></div>

            <div className="flex justify-around px-5 text-sm font-medium text-gray-600">
                <LikeToggleButton
                    missionId={id}
                    initialLiked={liked}
                    type="post"
                />
                <span className={`flex items-center gap-2 hover:text-blue-500 transition cursor-pointer ${latest_comment_at ? "text-blue-500" : ""}`}>
                    <FaComment className="w-4 h-4" /> Comment
                </span>
                <button className="flex items-center gap-2 hover:text-green-600 transition">
                    <FaShare className="w-4 h-4" /> Share
                </button>
            </div>

            <div className="border-t border-gray-200 mx-5 my-4"></div>
            <div className="px-5 mt-3">
                <CommentsSection missionId={id} comments={comments} posted_by={posted_by} can_post={can_post} type="post" />
            </div>
        </div>
    );
}

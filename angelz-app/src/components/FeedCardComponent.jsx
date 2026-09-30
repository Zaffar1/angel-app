import { FaCalendar, FaComment, FaEllipsisH, FaGripHorizontal, FaHeart, FaShare, FaSms, FaTextHeight } from "react-icons/fa";
import { formatDate, formatTime } from "../utils/dateUtils";
import { getImageUrl } from "../utils/getImageUrl";
import WhatsappShare from "./socialShareButtons/WhatsappShareButton";
import LikeToggleButton from "./LikeToggleButton";
import CommentsSection from "./comments/CommentSection";

export default function FeedCardComponent({
    company_name,
    name,
    description,
    file,
    mission_type,
    start_time,
    end_time,
    points,
    liked,
    id,
    total_likes,
    author_name = "N/A",
    comments,
    total_comments,
    latest_comment_at,
    posted_by, }) {

    const initials = company_name
        ?.split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 3);

    const imageUrl = getImageUrl(file) || `https://placehold.co/600x400?text=${encodeURIComponent(name)}`;
    const formattedStartDate = formatDate(start_time);
    const formattedStartTime = formatTime(start_time);
    const formattedEndTime = formatTime(end_time);
    console.log(formattedStartTime, 'formattedStartTime');


    return (
        <div className="glass-card overflow-hidden">

            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-blue-500 text-white 
                        text-sm font-semibold rounded-full">
                        {initials}
                    </div>

                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 text-sm">
                                {company_name}
                            </span>
                            <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded text-[10px] font-bold uppercase tracking-wider">Mission</span>
                        </div>
                    </div>
                </div>
                {/* <FaGripHorizontal className="w-5 h-5 text-gray-500 cursor-pointer" /> */}
                <FaEllipsisH className="w-5 h-5 text-gray-500 cursor-pointer" />
            </div>

            <div className="px-4">
                <div className="rounded-xl overflow-hidden">
                    <img
                        src={imageUrl}
                        alt="mission"
                        className="w-full h-72 md:h-80 lg:h-96 object-cover"
                    />
                </div>
            </div>

            <div className="px-5 mt-4">
                <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-base text-gray-900 capitalize">
                        {name}
                    </h3>

                    <span className="text-sm text-gray-600 capitalize">
                        {mission_type}
                    </span>
                </div>

                <p className="text-gray-600 text-sm mt-1 leading-relaxed line-clamp-2">
                    {description}
                </p>
            </div>

            <div className="flex justify-between items-center text-sm text-gray-600 px-5 mt-4">
                <div className="flex items-center gap-2">
                    <FaCalendar className="w-4 h-4" />
                    <span className={`${formattedStartDate && "capitalize"}`}>
                        {formattedStartDate} | {formattedStartTime} — {formattedEndTime}
                    </span>
                </div>

                <span className="font-semibold text-gray-900 text-sm">
                    Earned <span className="text-black">{points} points</span>
                </span>
            </div>

            <div className="border-t border-gray-200 mx-5 my-4"></div>

            <div className="flex justify-between items-center text-xs text-gray-500 px-5 mt-3">
                <div className="flex gap-4">
                    <span>{total_likes} {total_likes === 1 ? "Like" : "Likes"}</span>
                    <span>{total_comments} {total_comments === 1 ? "Comment" : "Comments"}</span>
                    <span>50 Shares</span>
                </div>
                <div className="flex gap-4">
                    <span>Posted by {author_name}</span>

                </div>
            </div>

            <div className="border-t border-gray-200 mx-5 my-4"></div>

            <div className="flex justify-around px-5 text-sm font-medium text-gray-600">
                <LikeToggleButton
                    missionId={id}
                    initialLiked={liked}
                    type="mission"
                />
                <span className={`flex items-center gap-2 hover:text-blue-500 transition ${latest_comment_at ? "text-blue-500" : ""}`}>
                    <FaComment className="w-4 h-4" /> Comment</span>
                {/* <WhatsappShare post={{name, description}}/> */}
                <button className="flex items-center gap-2 hover:text-green-600 transition">
                    <FaShare className="w-4 h-4" /> Share
                </button>
            </div>
            <div className="border-t border-gray-200 mx-5 my-4"></div>
            <div className="px-5 mt-3">
                <CommentsSection missionId={id} comments={comments} posted_by={posted_by} type="mission" />
            </div>
        </div>
    );
}

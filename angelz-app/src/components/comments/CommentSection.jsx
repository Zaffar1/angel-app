import { useState, useEffect } from "react";
import CommentItems from "./CommentItems";
import CommentBox from "./CommentBox";
import useUserProfile from "../../hooks/useUserProfile";

export default function CommentsSection({ missionId, comments, posted_by, can_post, type }) {
    const { user } = useUserProfile();
    const [showAll, setShowAll] = useState(false);
    const [hasCommented, setHasCommented] = useState(false);

    useEffect(() => {
        if (!user) return;
        if (typeof can_post !== "undefined") {
            setHasCommented(!can_post);
        } else {
            setHasCommented(comments.some((c) => c.user_id === user.id));
        }
    }, [comments, user, can_post]);

    const visibleComments = showAll ? comments : comments.slice(0, 4);
    console.log(visibleComments, 'visibleComments');


    return (
        <div className="mt-6">
            <CommentBox missionId={missionId} hasCommented={hasCommented} type={type} />
            <h3 className="font-semibold my-6 text-sm text-gray-800">
                Feed Comments
            </h3>
            <div className="max-h-60 overflow-y-auto pr-1 space-y-4">
                {(!visibleComments || visibleComments.length === 0) && (
                    <p className={`text-sm mt-1 leading-relaxed italic text-gray-400 mb-4`}>
                        Be the first to comment on this feed.</p>
                )}
                {visibleComments.map((c) => (
                    <CommentItems
                        key={c.id}
                        comment={c}
                        currentUserId={user?.id}
                        posted_by={posted_by}
                    />
                ))}
            </div>
            {comments.length > 4 && !showAll && (
                <button
                    onClick={() => setShowAll(true)}
                    className="text-blue-600 my-2 text-sm font-medium hover:underline"
                >
                    View all comments
                </button>
            )}
        </div>
    );
}

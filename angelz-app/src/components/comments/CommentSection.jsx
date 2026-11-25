import { useState, useEffect } from "react";
import useLocale from "../../hooks/useLocale";
import CommentItems from "./CommentItems";
import CommentBox from "./CommentBox";
import useUserProfile from "../../hooks/useUserProfile";

export default function CommentsSection({ missionId, comments = [], posted_by, can_post, type }) {
    const { t } = useLocale("feed");
    const { user } = useUserProfile();
    const [showAll, setShowAll] = useState(false);
    const [hasCommented, setHasCommented] = useState(false);
    const safeComments = Array.isArray(comments) ? comments : [];

    useEffect(() => {
        if (!user) return;
        if (typeof can_post !== "undefined") {
            setHasCommented(!can_post);
        } else {
            setHasCommented(safeComments.some((c) => c.user_id === user.id));
        }
    }, [safeComments, user, can_post]);

    const visibleComments = showAll ? safeComments : safeComments.slice(0, 4);
    console.log(visibleComments, 'visibleComments');


    return (
        <div className="mt-6">
            <CommentBox missionId={missionId} hasCommented={hasCommented} type={type} />
            <h3 className="font-semibold my-6 text-sm text-gray-800">
                {t("comments.sectionTitle")}
            </h3>
            <div className="max-h-60 overflow-y-auto pe-1 space-y-4">
                {(!visibleComments || visibleComments.length === 0) && (
                    <p className={`text-sm mt-1 leading-relaxed italic text-gray-400 mb-4`}>
                        {t("comments.first")}</p>
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
            {safeComments.length > 4 && !showAll && (
                <button
                    onClick={() => setShowAll(true)}
                    className="text-blue-600 my-2 text-sm font-medium hover:underline"
                >
                    {t("comments.viewAll")}
                </button>
            )}
        </div>
    );
}

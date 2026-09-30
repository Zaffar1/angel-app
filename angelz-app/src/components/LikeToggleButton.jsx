import { useState, useCallback } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useLikeToggleOnFeedMutation } from "../api/mission";

export default function LikeToggleButton({ missionId, initialLiked = false, type }) {
  const [liked, setLiked] = useState(initialLiked);
  const { mutate, isPending } = useLikeToggleOnFeedMutation({
    onError: () => {
      setLiked((prev) => !prev);
    },
  });
  const handleToggle = useCallback(() => {
    setLiked((prev) => !prev);
    mutate({ missionId, type });
  }, [missionId, type, mutate]);

  const label = isPending ? !liked ? "Unliking..." : "Liking..." : liked
    ? "Liked"
    : "Like";

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`
        flex items-center gap-2 transition
        ${liked ? "text-red-500" : "text-gray-600 hover:text-red-500"}
      `}
    >
      {liked ? (
        <FaHeart className="w-5 h-5" />
      ) : (
        <FaRegHeart className="w-5 h-5" />
      )}
      {label}
    </button>
  );
}

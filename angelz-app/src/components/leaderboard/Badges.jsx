import { getImageUrl } from "../../utils/getImageUrl";

const BadgeSVG = ({ rank, className = "" }) => {
    const getBadgeColor = (rank) => {
        const colors = {
            1: { // Diamond
                primary: "#4FD3FF",
                secondary: "#34B8E6"
            },
            2: { // Platinum
                primary: "#9EA7B1",
                secondary: "#8B939C"
            },
            3: { // Gold
                primary: "#D4A017",
                secondary: "#B8860B"
            },
            4: { // Silver
                primary: "#A6A9AD",
                secondary: "#8F9397"
            },
            5: { // Bronze
                primary: "#99642C",
                secondary: "#855327"
            }
        };


        return colors[rank] || colors[1];
    };
    const color = getBadgeColor(rank);
    return (
        <svg
            width="90"
            height="126"
            viewBox="0 0 90 126"
            fill="none"
            className={className}
        >
            <circle cx="45" cy="66" r="43.5" stroke={color.primary} strokeWidth="3" />
            <circle cx="45" cy="112" r="14" fill={color.primary} />
            <text
                x="45"
                y="117"
                textAnchor="middle"
                fill="white"
                fontSize="18"
                fontWeight="normal"
            >
                {rank}
            </text>
            <path d="M58.3547 6.088C57.8675 5.88505 57.3309 5.8317 56.8132 5.93476C56.2956 6.03781 55.8203 6.2926 55.448 6.66667L52 10.1147L45.8853 4C45.3853 3.50008 44.7071 3.21924 44 3.21924C43.2929 3.21924 42.6147 3.50008 42.1147 4L36 10.1147L32.552 6.66667C32.1791 6.29384 31.704 6.03996 31.1868 5.93711C30.6695 5.83427 30.1335 5.88707 29.6463 6.08886C29.1591 6.29065 28.7426 6.63235 28.4496 7.07078C28.1566 7.50921 28.0001 8.02467 28 8.552V22.6667C28.0021 24.4341 28.7052 26.1286 29.955 27.3784C31.2047 28.6282 32.8992 29.3312 34.6667 29.3333H53.3333C55.1008 29.3312 56.7953 28.6282 58.045 27.3784C59.2948 26.1286 59.9979 24.4341 60 22.6667V8.552C60.0001 8.02463 59.8439 7.50905 59.551 7.07047C59.2582 6.63189 58.8418 6.28999 58.3547 6.088Z" fill={color.primary} />
        </svg>
    );
};

export const RankBadge = ({ userName, rank, userImage, className = "" }) => {
    const containerSize = "w-16 h-16";
    const imageSize = "w-12 h-12";

    const hasValidImage = userImage && !userImage.includes("undefined");
    const userImageWithFallback =
        getImageUrl(userImage) ||
        `https://placehold.co/600x400?text=${encodeURIComponent(userName)}`;

    return (
        <div className={`relative ${containerSize} ${className}`}>
            <div className="absolute inset-0 flex items-center justify-center z-0">
                <div className={`${imageSize} rounded-full overflow-hidden border-2 border-white shadow-lg bg-gray-200`}>
                    {hasValidImage ? (
                        <img
                            src={userImageWithFallback}
                            alt="User"
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-md">
                            {userName?.charAt(0)?.toUpperCase()}
                        </div>
                    )}
                </div>
            </div>

            <div className="absolute inset-0 z-10">
                <BadgeSVG rank={rank} className="w-full h-full drop-shadow-lg" />
            </div>
        </div>
    );
};

export const RankNumber = ({ userName, rank, userImage, className = "" }) => {
    const containerSize = "w-16 h-16";
    const imageSize = "w-12 h-12";

    const userImageWithFallback =
        getImageUrl(userImage) ||
        `https://placehold.co/600x400?text=${encodeURIComponent(userName)}`;

    return (
        <div className={`relative flex items-center justify-center ${containerSize} ${className}`}>
            <div className={`${imageSize} rounded-full overflow-hidden border-2 border-white shadow-lg bg-gray-200`}>
                <img
                    src={userImageWithFallback}
                    alt="User"
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
            </div>
            <div className="absolute bottom-0 bg-blue-600 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-md">
                {rank}
            </div>
            <div className="absolute inset-0 pointer-events-none opacity-0">
                <BadgeSVG rank={0} className="w-full h-full" />
            </div>
        </div>
    );
};
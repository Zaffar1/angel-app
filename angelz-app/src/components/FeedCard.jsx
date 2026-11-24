import { FaGripHorizontal, FaHeart, FaSms, FaShare, FaCalendar } from "react-icons/fa"
import { useAllFeeds } from "../api/mission";
import { useCallback, useState } from "react";
import Loader from "./Loader";
import FeedCardComponent from "./FeedCardComponent";

export default function Feed() {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(5);

    const { data, isLoading, isError, error, refetch, isFetching } = useAllFeeds({ page, limit });

    const handlePageChange = useCallback((newPage) => {
        setPage(newPage);
    }, []);

    const handleLimitChange = useCallback((newLimit) => {
        setLimit(newLimit);
        setPage(1);
    }, []);

    const missionCount = data?.totalMissions || 0;
    const missions = data?.missions || [];
    const totalPages = data?.totalPages || 1;

    if (isLoading && !missions.length) return <Loader />;

    if (isError)
        return (
            <p className="text-center py-10 text-red-500">
                Failed to load missions: {error?.response?.data?.message || error.message}
            </p>
        );

    return (
        <div className="max-w-xl mx-auto space-y-6">
            {missions.map((post, i) => (
                <FeedCardComponent key={i} {...post} />
            ))}
        </div>
    );
}
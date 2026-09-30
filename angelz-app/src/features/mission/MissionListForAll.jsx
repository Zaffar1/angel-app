import { Link } from "react-router-dom";
import { useInfiniteMissions } from "../../api/mission";
import MissionCard from "../../components/mission/missionCard";
import useUserProfile from "../../hooks/useUserProfile";
import Loader from "../../components/Loader";
import { useCallback, useRef } from "react";
import { PAGE_LIMIT } from "../../constant/PAGE_LIMIT";

const MissionListForAll = () => {
    const { user } = useUserProfile();
    const observer = useRef();

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        error
    } = useInfiniteMissions({ limit: PAGE_LIMIT.LIMIT });

    const lastElementRef = useCallback(node => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasNextPage) {
                fetchNextPage();
            }
        });
        if (node) observer.current.observe(node);
    }, [isLoading, hasNextPage, fetchNextPage]);

    const isOrganization = user?.type === "organization";
    const missions = data?.pages.flatMap(page => page.missions) || [];
    const missionCount = data?.pages[0]?.totalMissions || 0;

    if (isLoading && missions.length === 0) return <Loader />;

    if (isError)
        return (
            <p className="text-center py-10 text-red-500">
                Failed to load missions: {error?.response?.data?.message || error.message}
            </p>
        );

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-10">
                <div className="">
                    <h2 className="text-2xl font-semibold capitalize">All Missions</h2>
                    <p className="font-medium text-lg capitalize">count: {missionCount}</p>
                </div>
                {isOrganization && (
                    <Link to={'/organization/mission/create'} className="text-white text-md hover:bg-blue-600 transition bg-blue-500 rounded-full px-4 py-2 capitalize">
                        Create mission
                    </Link>
                )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {missions?.map((mission, index) => {
                    if (missions.length === index + 1) {
                        return (
                            <div ref={lastElementRef} key={mission?.id}>
                                <MissionCard {...mission} />
                            </div>
                        )
                    }
                    return <MissionCard key={mission?.id} {...mission} />
                })}
            </div>

            {isFetchingNextPage && (
                <div className="py-10">
                    <Loader fullPage={false} />
                </div>
            )}

            {!hasNextPage && missions.length > 0 && (
                <p className="text-center py-10 text-gray-500 font-medium">
                    No more missions to load.
                </p>
            )}
        </div>
    )
}

export default MissionListForAll;

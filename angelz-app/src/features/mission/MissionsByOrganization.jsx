import { useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import MissionCard from "../../components/mission/missionCard";
import EditMissionButton from "./actions/EditMissionButton";
import DeleteMissionButton from "./actions/DeleteMissionButton";
import { useInfiniteOrganizationMissions } from "../../api/mission";
import useUserProfile from "../../hooks/useUserProfile";
import Loader from "../../components/Loader";
import { PAGE_LIMIT } from "../../constant/PAGE_LIMIT";

const MissionsByOrganization = () => {
    const { user } = useUserProfile();
    const isOrganization = user?.type === "organization";
    const observer = useRef();

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        error
    } = useInfiniteOrganizationMissions({ limit: PAGE_LIMIT.LIMIT });

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

    const missions = data?.pages.flatMap(page => page.missions) || [];
    const missionCount = data?.pages[0]?.totalMissions || 0;
    // const organizationName = data?.pages[0]?.organization_name || "Organization name";
    const organizationName = missions[0]?.organization?.company_name || "Organization name";

    if (isLoading && missions.length === 0) return <Loader />;
    console.log('missions', missions);

    if (isError)
        return (
            <p className="text-center py-10 text-red-500">
                Failed to load missions: {error?.response?.data?.message || error.message}
            </p>
        );

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-2xl font-semibold capitalize">{organizationName}</h2>
                    <p className="font-medium text-lg capitalize">Missions: {missionCount}</p>
                </div>

                {isOrganization && (
                    <Link
                        to="/organization/mission/create"
                        className="text-white text-md hover:bg-blue-600 transition bg-blue-500 rounded-full px-4 py-2 capitalize"
                    >
                        Create Mission
                    </Link>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative">
                {missions.map((mission, index) => {
                    const content = (
                        <div key={mission?.id} className="relative group">
                            <MissionCard {...mission} />
                            {isOrganization && (
                                <div className="absolute top-0 bottom-0 right-3 flex items-center gap-2 z-0">
                                    <EditMissionButton missionId={mission?.id} />
                                    <DeleteMissionButton missionId={mission?.id} />
                                </div>
                            )}
                        </div>
                    );

                    if (missions.length === index + 1) {
                        return <div ref={lastElementRef} key={mission?.id}>{content}</div>;
                    }
                    return content;
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
    );
};

export default MissionsByOrganization;

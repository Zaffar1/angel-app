import { useInfiniteVolunteers, useGetVolunteerGroups } from '../../api/volunteer';
import VolunteerCard from '../../components/VolunteerCard';
import Loader from '../../components/Loader';
import { useCallback, useRef, useState } from 'react';
import { PAGE_LIMIT } from '../../constant/PAGE_LIMIT';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaTrophy, FaMapMarkerAlt, FaEnvelope, FaPhone } from 'react-icons/fa';
import { getImageUrl } from '../../utils/getImageUrl';

const VolunteerList = () => {
    const observer = useRef();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('volunteers');

    const {
        data: volunteersData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isVolunteersLoading,
        isError: isVolunteersError,
        error: volunteersError
    } = useInfiniteVolunteers({ limit: PAGE_LIMIT.LIMIT });

    const {
        data: groups,
        isLoading: isGroupsLoading,
        isError: isGroupsError,
        error: groupsError
    } = useGetVolunteerGroups();

    const lastElementRef = useCallback(node => {
        if (isVolunteersLoading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasNextPage) {
                fetchNextPage();
            }
        });
        if (node) observer.current.observe(node);
    }, [isVolunteersLoading, hasNextPage, fetchNextPage]);

    const volunteers = volunteersData?.pages.flatMap(page => page.volunteers) || [];
    const volunteerCount = volunteersData?.pages[0]?.totalVolunteers || 0;

    const getInitials = (fullName) => {
        if (!fullName) return "?";
        const parts = fullName.trim().split(/\s+/);
        if (parts.length === 1) return parts[0][0].toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    if (activeTab === 'volunteers' && isVolunteersLoading && volunteers.length === 0) return <Loader />;
    if (activeTab === 'groups' && isGroupsLoading) return <Loader />;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        {activeTab === 'volunteers' ? 'Volunteers' : 'Volunteer Groups'}
                    </h2>
                    <p className="text-gray-500 mt-1 font-medium">
                        {activeTab === 'volunteers'
                            ? `Total Individual Volunteers: ${volunteerCount}`
                            : `Total Volunteer Groups: ${groups?.length || 0}`}
                    </p>
                </div>

                <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full md:w-auto self-stretch md:self-auto shadow-inner">
                    <button
                        onClick={() => setActiveTab('volunteers')}
                        className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === 'volunteers'
                            ? 'bg-white text-blue-600 shadow-md transform scale-102'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Volunteers
                    </button>
                    <button
                        onClick={() => setActiveTab('groups')}
                        className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === 'groups'
                            ? 'bg-white text-blue-600 shadow-md transform scale-102'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Volunteer Groups
                    </button>
                </div>
            </div>

            {activeTab === 'volunteers' && (
                <>
                    {isVolunteersError && (
                        <p className="text-center py-10 text-red-500 font-medium bg-red-50 rounded-2xl border border-red-200">
                            Failed to load volunteers: {volunteersError?.response?.data?.message || volunteersError.message}
                        </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {volunteers?.map((volunteer, index) => {
                            if (volunteers.length === index + 1) {
                                return (
                                    <div ref={lastElementRef} key={volunteer?.id}>
                                        <VolunteerCard {...volunteer} />
                                    </div>
                                )
                            }
                            return <VolunteerCard key={volunteer?.id} {...volunteer} />
                        })}
                    </div>

                    {isFetchingNextPage && (
                        <div className="py-10">
                            <Loader fullPage={false} />
                        </div>
                    )}

                    {!hasNextPage && volunteers.length > 0 && (
                        <p className="text-center py-12 text-gray-400 font-medium">
                            No more volunteers to load.
                        </p>
                    )}
                </>
            )}

            {activeTab === 'groups' && (
                <>
                    {isGroupsError && (
                        <p className="text-center py-10 text-red-500 font-medium bg-red-50 rounded-2xl border border-red-200">
                            Failed to load volunteer groups: {groupsError?.response?.data?.message || groupsError.message}
                        </p>
                    )}

                    {groups?.length === 0 ? (
                        <div className="text-center py-16 bg-gray-50/50 rounded-3xl border border-gray-150 border-dashed">
                            <FaUsers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-700">No Volunteer Groups Found</h3>
                            <p className="text-gray-500 mt-1 max-w-sm mx-auto">There are no registered volunteer groups in the community at the moment.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {groups?.map((group) => {
                                const groupImgUrl = getImageUrl(group.image);
                                return (
                                    <div
                                        key={group.id}
                                        onClick={() => navigate(`/organization/volunteer-group/${group.id}`)}
                                        className="group glass-card overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col h-full border border-gray-100 hover:border-blue-200/50"
                                    >
                                        <div className="px-3 pt-3">
                                            <div className="relative rounded-2xl overflow-hidden shadow-sm aspect-video bg-gray-100 flex items-center justify-center">
                                                {groupImgUrl ? (
                                                    <img
                                                        src={groupImgUrl}
                                                        alt={group.name}
                                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-4xl tracking-wider">
                                                        {getInitials(group.name)}
                                                    </div>
                                                )}
                                                <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-indigo-600 text-[10px] font-extrabold px-3 py-1 rounded-full shadow-sm uppercase tracking-wider">
                                                    Group
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-6 flex-1 flex flex-col justify-between">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <h3 className="font-extrabold text-gray-900 text-xl leading-snug line-clamp-1 group-hover:text-blue-600 transition-colors">
                                                        {group.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                                                        {group.description || "No description available for this group."}
                                                    </p>
                                                </div>

                                                <div className="flex flex-col gap-2.5 text-sm text-gray-600 border-t border-b border-gray-50 py-3.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <FaEnvelope className="text-blue-500 w-4 h-4 flex-shrink-0" />
                                                        <span className="truncate font-medium">{group.email}</span>
                                                    </div>
                                                    {group.contact_no && (
                                                        <div className="flex items-center gap-2.5">
                                                            <FaPhone className="text-blue-500 w-4 h-4 flex-shrink-0" />
                                                            <span className="font-medium">{group.contact_no}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2.5">
                                                        <FaMapMarkerAlt className="text-blue-500 w-4 h-4 flex-shrink-0" />
                                                        <span className="truncate font-medium">
                                                            {group.city ? `${group.city}, ${group.country}` : "Location not set"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4 pt-4">
                                                <div className="flex justify-between items-center bg-gray-50 px-4 py-3 rounded-2xl">
                                                    <div className="flex items-center gap-2">
                                                        <FaUsers className="text-indigo-500 w-5 h-5" />
                                                        <div>
                                                            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Members</p>
                                                            <p className="font-extrabold text-gray-800 text-sm">{group.members_count || 0}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-right">
                                                        <FaTrophy className="text-yellow-500 w-5 h-5" />
                                                        <div>
                                                            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total Points</p>
                                                            <p className="font-extrabold text-gray-800 text-sm">{group.points || 0}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    className="w-full py-3.5 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-95 text-white rounded-full text-sm font-extrabold shadow-md transition-all active:scale-[0.98]"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/organization/volunteer-group/${group.id}`);
                                                    }}
                                                >
                                                    View Group Detail
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default VolunteerList;

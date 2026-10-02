import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FaTimes, FaCheckCircle, FaEye } from "react-icons/fa";
import { ThemeButton } from "../../components/ThemeButton";
import { useCanPostMissionMutation, useMissionDetail, useRequestMission, useCompletionRequest } from "../../api/mission";
import { useGetGroupVolunteers, useAssignGroupVolunteersToMission, useUpdateGroupVolunteerMissionStatus } from "../../api/volunteerGroup";
import { getImageUrl } from "../../utils/getImageUrl";
import { safeParseJson } from "../../utils/safeParseJson";
import useUserProfile from "../../hooks/useUserProfile";
import { getStatusClass, isMissionDisabled, formatStatus, getEffectiveMissionStatus } from "../../utils/missionStatusUtils";
import { showError } from "../../utils/toast";
import MapComponent from "../../components/MapComponent";
import ApplicantsTable from "../../components/applicants/ApplicantsTable";
import { formatDateTime, formatDateTimeWithLocalTime } from "../../utils/dateUtils";
import EditMissionButton from "./actions/EditMissionButton";
import DeleteMissionButton from "./actions/DeleteMissionButton";
import Loader from "../../components/Loader";
import { Detail, Section, StatusTag } from "../../components/mission/missionHelper";
import { ErrorText } from "../../components/mission/errorText";



export default function MissionDetails() {
    const { id } = useParams();
    const { data, isLoading, isError, error, refetch } = useMissionDetail(id);
    const { user } = useUserProfile();
    const { mutate: requestMission, isPending } = useRequestMission();
    const { mutate: postFeed, isPending: pendingPostFeed } = useCanPostMissionMutation();

    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedVolunteers, setSelectedVolunteers] = useState([]);

    useEffect(() => {
        if (showAssignModal || showDetailsModal) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [showAssignModal, showDetailsModal]);

    const { data: volunteers = [], isLoading: loadingVolunteers } = useGetGroupVolunteers({
        enabled: user?.type === "volunteer_group"
    });
    const { mutate: assignVolunteers, isPending: isAssigning } = useAssignGroupVolunteersToMission({
        onSuccess: () => {
            setShowAssignModal(false);
            setSelectedVolunteers([]);
            refetch();
        }
    });

    const { mutate: sendCompletionRequest, isPending: isSendingCompletion } = useCompletionRequest({
        onSuccess: () => {
            refetch();
        }
    });

    const { mutate: updateVolunteerStatus, isPending: isUpdatingVolunteerStatus } = useUpdateGroupVolunteerMissionStatus({
        onSuccess: () => {
            refetch();
        }
    });

    const toggleVolunteer = (volId) => {
        setSelectedVolunteers(prev =>
            prev.includes(volId) ? prev.filter(vid => vid !== volId) : [...prev, volId]
        );
    };

    const handleAssignSubmit = (e) => {
        e.preventDefault();
        if (selectedVolunteers.length === 0) return;
        assignVolunteers({
            mission_id: parseInt(id),
            volunteer_ids: selectedVolunteers.map(vId => parseInt(vId))
        });
    };

    const mission = data?.data;
    const isOrganization = user?.type === "organization";

    const currentAssignedCount = mission?.assigned_volunteers?.length || mission?.assigned_count || 0;
    const volunteerRequired = Number(mission?.volunteer_required) || 0;
    const remainingSpots = Math.max(0, volunteerRequired - currentAssignedCount);

    // Calculate assignments details for details modal
    const groupVolunteersIds = new Set(volunteers.map(v => v.id));

    const groupUserId = user?.id || user?._id;

    const hasGroupApplication = !!groupUserId && mission?.group_applications?.some(
        app => app.group_id && Number(app.group_id) === Number(groupUserId)
    );

    const hasAssignedGroupVolunteers = mission?.assigned_volunteers?.some(
        v => groupVolunteersIds.has(v.id)
    );

    const hasAlreadyApplied = hasGroupApplication || hasAssignedGroupVolunteers;

    // Determine if any volunteer in this group has completed or is assigned to this mission
    const groupVolunteersWithMission = volunteers.filter(vol =>
        vol.missions?.some(m => Number(m.id) === Number(id))
    );

    const completedVolunteerInGroup = groupVolunteersWithMission.find(vol =>
        vol.missions?.some(m => Number(m.id) === Number(id) && (m.status === "completed" || m.assigned_status === "completed"))
    );

    const assignedCompletedVolunteer = mission?.assigned_volunteers?.find(
        v => groupVolunteersIds.has(v.id) && (v.status === "completed" || v.assigned_status === "completed")
    );

    const myGroupApplication = !!groupUserId && mission?.group_applications?.find(
        app => app.group_id && Number(app.group_id) === Number(groupUserId)
    );
    const isGroupApplicationAccepted = myGroupApplication?.status === "accepted";

    const hasCompletedVolunteerInGroup = isGroupApplicationAccepted && Boolean(completedVolunteerInGroup || assignedCompletedVolunteer);

    const handleGroupCompletionClick = () => {
        if (!mission?.id) return showError("Mission ID missing!");
        
        const completedVol = completedVolunteerInGroup || assignedCompletedVolunteer;
        updateVolunteerStatus({
            mission_id: Number(mission.id),
            volunteer_id: completedVol?.id ? Number(completedVol.id) : undefined,
            status: "completed"
        });
    };

    const showAllAssigned = user?.type === "organization";

    const displayAssignedVolunteers = (mission?.assigned_volunteers || []).filter(
        v => showAllAssigned || groupVolunteersIds.has(v.id)
    );

    const getVolStatus = (v) => v.assigned_status || v.status;

    const completedGroupVolunteers = displayAssignedVolunteers.filter(
        v => getVolStatus(v) === "completed"
    );
    const inProgressGroupVolunteers = displayAssignedVolunteers.filter(
        v => getVolStatus(v) === "in_progress" || getVolStatus(v) === "inprogress" || getVolStatus(v) === "completion_requested"
    );
    const inProcessGroupVolunteers = displayAssignedVolunteers.filter(
        v => getVolStatus(v) === "process" || getVolStatus(v) === "scheduled" || getVolStatus(v) === "started"
    );
    const pendingGroupVolunteers = displayAssignedVolunteers.filter(
        v => getVolStatus(v) === "pending" || !getVolStatus(v) || getVolStatus(v) === "pending"
    );

    const groupCompletionRate = displayAssignedVolunteers.length > 0
        ? Math.round((completedGroupVolunteers.length / displayAssignedVolunteers.length) * 100)
        : 0;

    const renderAssignStatusBadge = (status) => {
        const displayVal = formatStatus(
            status === "process" 
                ? "pending" 
                : (status === "in_progress" || status === "inprogress") 
                    ? "started" 
                    : status
        );
        
        // Determine colors/classes based on status
        let colorClass = "bg-gray-100 text-gray-700 border-gray-200";
        let dotClass = "bg-gray-400";
        
        const s = status?.toLowerCase();
        if (s === 'completed') {
            colorClass = "bg-green-50 text-green-700 border border-green-200";
            dotClass = "bg-green-500";
        } else if (s === 'in_progress' || s === 'inprogress') {
            colorClass = "bg-blue-50 text-blue-700 border border-blue-200";
            dotClass = "bg-blue-500";
        } else if (s === 'process' || s === 'scheduled' || s === 'started') {
            colorClass = "bg-amber-50 text-amber-700 border border-amber-200";
            dotClass = "bg-amber-500 animate-pulse";
        } else if (s === 'completion_requested') {
            colorClass = "bg-indigo-50 text-indigo-700 border border-indigo-200";
            dotClass = "bg-indigo-500 animate-pulse";
        } else if (s === 'ended') {
            colorClass = "bg-red-50 text-red-700 border border-red-200";
            dotClass = "bg-red-500";
        }
        
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`}></span> {displayVal}
            </span>
        );
    };

    if (isLoading)
        return (
            <Loader />
        );

    if (isError)
        return (
            <ErrorText message={error?.response?.data?.message || error?.message} />
        );

    if (!mission) return null;

    const allowInteraction = safeParseJson(mission.allow_interaction, {
        comments: true,
        likes: true,
        share: false,
    });

    const preferredVolunteers = safeParseJson(mission.prefered_volunteer, []);

    const imageUrl =
        getImageUrl(mission.file) ||
        "https://placehold.co/1200x600?text=No+Image+Available";

    const handleApply = () => {
        if (!mission?.id) return showError("Mission ID missing!");
        requestMission(mission.id, { onSuccess: refetch });
    };

    const handlePostFeed = () => {
        if (!mission?.id) return showError("Mission ID missing!");
        postFeed(mission.id, { onSuccess: refetch });
    }

    const effectiveStatus = getEffectiveMissionStatus(mission.status, mission.start_time);
    const disabled = isMissionDisabled(effectiveStatus);
    const statusColor = getStatusClass(effectiveStatus);
    const applicants = mission?.applied_volunteers;

    const {
        date: mission_start_date,
        time: mission_start_time,
    } = formatDateTimeWithLocalTime(mission?.start_time);

    const {
        date: mission_end_date,
        time: mission_end_time,
    } = formatDateTimeWithLocalTime(mission?.end_time);

    const displayDateTime = (date, time) =>
        date && time ? `${date} - ${time}` : "N/A";

    const isCompletedByCurrentUser =
        mission?.assigned_volunteers?.length > 0
            ? mission.assigned_volunteers.some(v => Number(v.id) === Number(user?.id) || Number(v.id) === Number(user?._id))
            : (Number(mission?.volunteer_id) === Number(user?.id) || Number(mission?.volunteer_id) === Number(user?._id) || !mission?.volunteer_id);

    const volunteerCanPostFeed = user?.type === "volunteer" && mission.status === "completed" && isCompletedByCurrentUser;

    return (
        <div className="min-h-screen pb-16">
            <div className="relative group w-full h-60 md:h-[400px] overflow-hidden rounded-2xl">
                <img
                    src={imageUrl}
                    alt={mission?.name}
                    className="w-full h-full object-cover"
                />
                {isOrganization &&
                    <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
                        <EditMissionButton missionId={mission?.id} />
                        <DeleteMissionButton missionId={mission?.id} />
                    </div>
                }
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-center z-10">
                    <div className="p-6 md:p-10 text-white">
                        <h1 className="text-2xl md:text-3xl font-semibold capitalize">
                            {mission?.name}
                        </h1>
                        <p className="text-sm text-gray-200">
                            {mission?.company_name || "Unknown Organization"}
                        </p>
                    </div>
                </div>
            </div>
            <div className="max-w-5xl mx-auto -mt-16 bg-white rounded-2xl shadow-lg p-8 md:p-10 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b pb-4">
                    <div>
                        <span
                            className={`capitalize px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}
                        >
                            {formatStatus(effectiveStatus === "process" ? "pending" : effectiveStatus)}
                        </span>
                        <h2 className="text-xl font-semibold text-gray-700 mt-2">
                            {mission.name}
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">ID: {mission.id}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        {isOrganization && (Number(mission?.organization_id) === Number(user?.org_id) || Number(mission?.organization_id) === Number(user?.organization_id) || Number(mission?.organization_id) === Number(user?.id)) && mission?.group_applications?.some(app => app.status === "accepted") && (
                            <div className="mb-1">
                                <ThemeButton
                                    onClick={() => setShowDetailsModal(true)}
                                    className="!bg-blue-600 hover:!bg-blue-700 !text-white font-bold !py-1.5 !px-4 !text-xs !rounded-full shadow-sm"
                                >
                                    View Volunteers
                                </ThemeButton>
                            </div>
                        )}
                        {volunteerCanPostFeed && (
                            <div className="mb-2">
                                <p className="text-xs mb-1">Post this on your feed</p>
                                <ThemeButton
                                    onClick={handlePostFeed}
                                    isLoading={pendingPostFeed}
                                    fullWidth
                                    disabled={Boolean(mission?.can_post)}
                                >
                                    {!!mission?.can_post ? "Already Posted" : "Post Feed"}
                                </ThemeButton>
                            </div>
                        )}
                        <div className="text-blue-600 font-black text-lg">
                            {mission.points} <span className="font-semibold">Point(s)</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 text-sm text-gray-700">
                    <div className="space-y-2">
                        <Detail label="Work Type" value={mission.work_type} />
                        <Detail label="Mission Type" value={mission.mission_type} />
                        <Detail label="Distance" value={mission.relevant_distance} />
                    </div>
                    <div className="space-y-2 flex items-end flex-col">
                        <Detail
                            label="Start Time"
                            value={displayDateTime(mission_start_date, mission_start_time)}
                            isTimeDate={true}
                        />
                        <Detail
                            label="End Time"
                            value={displayDateTime(mission_end_date, mission_end_time)}
                            isTimeDate={true}
                        />
                    </div>
                </div>

                {mission.description && (
                    <Section title="Description">
                        <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                            {mission.description}
                        </p>
                    </Section>
                )}

                {preferredVolunteers.length > 0 && (
                    <Section title="Preferred Volunteers">
                        <div className="flex flex-wrap gap-2">
                            {preferredVolunteers.map((vol, i) => (
                                <span
                                    key={i}
                                    className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                                >
                                    {vol}
                                </span>
                            ))}
                        </div>
                    </Section>
                )}

                {mission.lat && mission.lng && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Location
                        </h3>

                        <MapComponent
                            mode="view"
                            defaultLocation={{
                                lat: Number(mission.lat),
                                lng: Number(mission.lng),
                            }}
                            //   address={mission?.address || ""}
                            address=""
                            zoom={14}
                        />
                    </div>
                )}


                {allowInteraction && (
                    <Section title="Interaction Settings">
                        <div className="flex flex-wrap gap-3 text-sm">
                            <StatusTag label="Comments" enabled={allowInteraction.comments} />
                            <StatusTag label="Likes" enabled={allowInteraction.likes} />
                            <StatusTag label="Share" enabled={allowInteraction.share} />
                        </div>
                    </Section>
                )}

                {user?.type === "volunteer_group" && (
                    <div className="mt-10 flex flex-wrap items-center gap-4">
                        {mission.status === "open" && !hasAlreadyApplied && (
                            <ThemeButton
                                onClick={() => setShowAssignModal(true)}
                            >
                                Zapp It
                            </ThemeButton>
                        )}
                        {hasAlreadyApplied && !(hasCompletedVolunteerInGroup && mission.status !== "completion_requested" && mission.status !== "completed") && (
                            <ThemeButton disabled>
                                Already Applied
                            </ThemeButton>
                        )}
                        {hasCompletedVolunteerInGroup &&
                         mission.status !== "completion_requested" &&
                         mission.status !== "completed" && (
                            <ThemeButton
                                onClick={handleGroupCompletionClick}
                                isLoading={isUpdatingVolunteerStatus}
                            >
                                Request Completion
                            </ThemeButton>
                        )}
                    </div>
                )}
            </div>
            {/* {isOrganization && (
                <div className="max-w-5xl mx-auto my-12">
                    <h3 className="text-lg md:text-xl font-semibold mb-4">
                        People who applied to this mission
                    </h3>
                    <ApplicantsTable applicants={applicants} />
                </div>
            )} */}

            {showAssignModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
                    <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden relative shadow-2xl border border-gray-100 flex flex-col max-h-[85vh]">
                        {/* Modal Header */}
                        <div style={{ backgroundColor: "oklch(54.6% 0.245 262.881)" }} className="text-white p-6 sm:p-8 relative">
                            <button
                                onClick={() => {
                                    setShowAssignModal(false);
                                    setSelectedVolunteers([]);
                                }}
                                className="absolute right-5 top-5 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                                aria-label="Close modal"
                            >
                                <FaTimes className="text-lg" />
                            </button>
                            <h2 className="text-2xl font-bold text-white">Assign Volunteers</h2>
                            <p className="text-xs text-white/80 mt-1.5">
                                Fulfill mission assignments for <strong>{mission.name}</strong>.
                            </p>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 flex flex-col flex-1 overflow-y-auto space-y-4 bg-gray-50/50">
                            {/* Validation / Alert Banners */}
                            {remainingSpots <= 0 ? (
                                <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-2xl flex items-start gap-3 shadow-sm text-sm">
                                    <span className="text-lg">🎉</span>
                                    <div>
                                        <p className="font-bold">Mission Capacity Fulfilled</p>
                                        <p className="text-xs text-green-700 mt-0.5">
                                            All {volunteerRequired} required spot(s) have been successfully filled. No further volunteer assignments are required.
                                        </p>
                                    </div>
                                </div>
                            ) : selectedVolunteers.length === remainingSpots ? (
                                <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-2xl flex items-start gap-3 shadow-sm text-sm">
                                    <span className="text-lg">✅</span>
                                    <div>
                                        <p className="font-bold">Selection Complete</p>
                                        <p className="text-xs text-green-700 mt-0.5 font-semibold">
                                            Exactly {remainingSpots} volunteer(s) selected. Ready to finalize assignment.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl flex items-start gap-3 shadow-sm text-sm">
                                    <span className="text-lg">⚠️</span>
                                    <div>
                                        <p className="font-bold text-amber-900">Selection Required</p>
                                        <p className="text-xs text-amber-700 mt-0.5">
                                            Please select exactly <strong>{remainingSpots}</strong> volunteer(s) to fulfill requirements. Selected: <strong>{selectedVolunteers.length} of {remainingSpots}</strong>.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {loadingVolunteers ? (
                                <div className="py-8 flex justify-center">
                                    <Loader fullPage={false} />
                                </div>
                            ) : volunteers.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                    No volunteers found. Invite some volunteers first.
                                </p>
                            ) : (
                                <form onSubmit={handleAssignSubmit} className="space-y-4 flex flex-col flex-1">
                                    <div className="space-y-1.5 max-h-[40vh] overflow-y-auto pr-1">
                                        {volunteers.map((vol) => {
                                            const isAlreadyAssigned = vol.missions?.some((m) => m.id === mission.id);
                                            const isLimitReached = selectedVolunteers.length >= remainingSpots;
                                            const isDisabled = remainingSpots <= 0 || isAlreadyAssigned || (!selectedVolunteers.includes(vol.id) && isLimitReached);
                                            const isChecked = selectedVolunteers.includes(vol.id);

                                            return (
                                                <label
                                                    key={vol.id}
                                                    className={`flex items-center gap-3 py-2 px-4 rounded-xl border cursor-pointer transition-all shadow-sm ${isAlreadyAssigned
                                                        ? "opacity-60 cursor-not-allowed bg-gray-50 border-gray-100"
                                                        : isChecked
                                                            ? "bg-blue-50/50 border-blue-200 ring-1 ring-blue-100"
                                                            : isDisabled
                                                                ? "opacity-40 cursor-not-allowed bg-gray-100/50 border-gray-100"
                                                                : "bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50/30"
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        disabled={isDisabled}
                                                        checked={isChecked}
                                                        onChange={() => toggleVolunteer(vol.id)}
                                                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 disabled:opacity-50 cursor-pointer"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-gray-800 truncate">{vol.name}</p>
                                                    </div>
                                                    {isAlreadyAssigned ? (
                                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                                                            Assigned
                                                        </span>
                                                    ) : (
                                                        !isChecked && isLimitReached && (
                                                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                                                                Limit reached
                                                            </span>
                                                        )
                                                    )}
                                                </label>
                                            );
                                        })}
                                    </div>

                                    {/* Modal Footer */}
                                    <div className="p-6 -mx-6 -mb-6 mt-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 rounded-b-3xl">
                                        {remainingSpots <= 0 ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowAssignModal(false);
                                                    setSelectedVolunteers([]);
                                                }}
                                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold transition-colors cursor-pointer text-sm shadow-sm"
                                            >
                                                Close
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowAssignModal(false);
                                                        setSelectedVolunteers([]);
                                                    }}
                                                    className="px-5 py-2.5 border border-gray-200 rounded-full text-gray-600 hover:bg-gray-100 font-semibold cursor-pointer bg-white transition-colors text-sm"
                                                >
                                                    Cancel
                                                </button>
                                                <ThemeButton
                                                    type="submit"
                                                    className="!rounded-full font-semibold shadow-sm text-sm"
                                                    isLoading={isAssigning}
                                                    disabled={selectedVolunteers.length !== remainingSpots}
                                                >
                                                    Assign Selected ({selectedVolunteers.length}/{remainingSpots})
                                                </ThemeButton>
                                            </>
                                        )}
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showDetailsModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
                    <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden relative shadow-2xl border border-gray-100 flex flex-col">
                        {/* Modal Header */}
                        <div style={{ backgroundColor: "oklch(54.6% 0.245 262.881)" }} className="text-white p-6 sm:p-8 relative">
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="absolute right-5 top-5 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                                aria-label="Close modal"
                            >
                                <FaTimes className="text-lg" />
                            </button>
                            <h2 className="text-2xl font-bold text-white">Mission Assignment Details</h2>
                            <p className="text-xs text-white/80 mt-1.5">
                                {showAllAssigned ? "Overall" : "Group"} assignment progress for mission <strong>{mission.name}</strong>.
                            </p>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-4 max-h-[60vh] bg-gray-50/50">
                            {displayAssignedVolunteers.length === 0 ? (
                                <p className="text-center py-8 text-gray-400 text-sm bg-white border border-gray-100 rounded-2xl shadow-sm">
                                    {showAllAssigned ? "No volunteers have been assigned to this mission." : "No volunteers from your group have been assigned to this mission."}
                                </p>
                            ) : (
                                <div className="space-y-1.5">
                                    {displayAssignedVolunteers.map((vol) => (
                                        <div
                                            key={vol.id}
                                            className="flex items-center justify-between gap-3 py-2.5 px-4 rounded-xl border border-gray-100 bg-white shadow-sm"
                                        >
                                            <div className="min-w-0">
                                                <p className="font-semibold text-gray-800 text-sm truncate">{vol.name}</p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {renderAssignStatusBadge(getVolStatus(vol))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end rounded-b-3xl">
                            <button
                                type="button"
                                onClick={() => setShowDetailsModal(false)}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold transition-colors cursor-pointer shadow-sm text-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

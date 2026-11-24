import { MISSION_STATUS } from "../constant/MISSION_STATUS";

export const MISSION_STATUS_STYLES = {
    [MISSION_STATUS.OPEN]: "bg-blue-100 text-blue-700",
    [MISSION_STATUS.PENDING]: "bg-yellow-100 text-yellow-700",
    [MISSION_STATUS.REQUESTED]: "bg-blue-100 text-blue-700",
    [MISSION_STATUS.COMPLETED]: "bg-green-100 text-green-700",
    [MISSION_STATUS.EXPIRED]: "bg-gray-100 text-gray-700",
    [MISSION_STATUS.ACCEPTED]: "bg-indigo-100 text-indigo-700",
    [MISSION_STATUS.PROCESS]: "bg-yellow-100 text-yellow-700",
    [MISSION_STATUS.INPROGRESS]: "bg-purple-100 text-purple-700",
    [MISSION_STATUS.COMPLETION_REQUESTED]: "bg-orange-100 text-orange-700",
    [MISSION_STATUS.REJECTED]: "bg-red-100 text-red-700",
    [MISSION_STATUS.SCHEDULED]: "bg-amber-100 text-amber-700",
};

export const DISABLED_STATUSES = [
    MISSION_STATUS.SCHEDULED,
    MISSION_STATUS.PENDING,
    MISSION_STATUS.COMPLETION_REQUESTED,
    MISSION_STATUS.INPROGRESS,
    MISSION_STATUS.PROCESS,
    MISSION_STATUS.ACCEPTED,
    MISSION_STATUS.COMPLETED,
    MISSION_STATUS.EXPIRED,
    MISSION_STATUS.REQUESTED
];

export const isMissionDisabled = (status) =>
    DISABLED_STATUSES.includes(status);

export const getStatusClass = (status) =>
    MISSION_STATUS_STYLES[status] || MISSION_STATUS_STYLES[MISSION_STATUS.PENDING];

export const formatStatus = (status) => {
    if (!status) return "";
    return status
        .replace(/_/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
};

/**
 * Resolves the real-time status of a mission.
 * If a mission has status 'scheduled' but its start time is in the past or now,
 * it is effectively active ('process') and ready for progress.
 */
export const getEffectiveMissionStatus = (status, startTime) => {
    if (!status) return "";
    const s = status.toLowerCase();
    if (s === MISSION_STATUS.SCHEDULED && startTime) {
        const start = new Date(startTime);
        if (!isNaN(start.getTime()) && start.getTime() <= Date.now()) {
            return MISSION_STATUS.PROCESS;
        }
    }
    return s;
};

/**
 * Returns a clear, professional explanation why a mission cannot be edited.
 */
export const getNonEditableMissionMessage = (status) => {
    const s = String(status || "").toLowerCase().trim();
    switch (s) {
        case MISSION_STATUS.COMPLETED:
            return "You cannot update this mission because it has already been completed. Only missions with 'Open' status can be edited.";
        case MISSION_STATUS.INPROGRESS:
        case MISSION_STATUS.PROCESS:
            return "You cannot update this mission because it is currently in process. Only missions with 'Open' status can be edited.";
        case MISSION_STATUS.COMPLETION_REQUESTED:
            return "You cannot update this mission because a completion review has been requested. Only missions with 'Open' status can be edited.";
        case MISSION_STATUS.SCHEDULED:
            return "You cannot update this mission because it has already been scheduled. Only missions with 'Open' status can be edited.";
        case MISSION_STATUS.ACCEPTED:
            return "You cannot update this mission because volunteer assignments have already been accepted. Only missions with 'Open' status can be edited.";
        case MISSION_STATUS.REQUESTED:
            return "You cannot update this mission while volunteer requests are pending. Only missions with 'Open' status can be edited.";
        case MISSION_STATUS.PENDING:
            return "You cannot update this mission while it is pending review. Only missions with 'Open' status can be edited.";
        case MISSION_STATUS.REJECTED:
            return "You cannot update this mission because it was rejected. Only missions with 'Open' status can be edited.";
        case MISSION_STATUS.EXPIRED:
            return "You cannot update this mission because it has expired. Only missions with 'Open' status can be edited.";
        default: {
            const formatted = formatStatus(status);
            return `You cannot update this mission because it is currently ${formatted ? formatted.toLowerCase() : "closed"}. Only missions with 'Open' status can be edited.`;
        }
    }
};

/**
 * Returns a concise, professional reason why editing is disabled.
 */
export const getNonEditableMissionReason = (status) => {
    const s = String(status || "").toLowerCase().trim();
    switch (s) {
        case MISSION_STATUS.COMPLETED:
            return "Mission has already been completed";
        case MISSION_STATUS.INPROGRESS:
        case MISSION_STATUS.PROCESS:
            return "Mission is currently in process";
        case MISSION_STATUS.COMPLETION_REQUESTED:
            return "Mission completion review requested";
        case MISSION_STATUS.SCHEDULED:
            return "Mission has been scheduled";
        case MISSION_STATUS.ACCEPTED:
            return "Volunteer assignments accepted";
        case MISSION_STATUS.REQUESTED:
            return "Volunteer requests pending";
        case MISSION_STATUS.PENDING:
            return "Mission is pending review";
        case MISSION_STATUS.REJECTED:
            return "Mission was rejected";
        case MISSION_STATUS.EXPIRED:
            return "Mission has expired";
        default:
            return `Mission is ${formatStatus(status) || "closed"}`;
    }
};
import { MISSION_STATUS } from "../constant/MISSION_STATUS";
import i18n from "../i18n";

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
            return i18n.t("missionDetails:nonEditable.message.completed");
        case MISSION_STATUS.INPROGRESS:
        case MISSION_STATUS.PROCESS:
            return i18n.t("missionDetails:nonEditable.message.inprogress");
        case MISSION_STATUS.COMPLETION_REQUESTED:
            return i18n.t("missionDetails:nonEditable.message.completionRequested");
        case MISSION_STATUS.SCHEDULED:
            return i18n.t("missionDetails:nonEditable.message.scheduled");
        case MISSION_STATUS.ACCEPTED:
            return i18n.t("missionDetails:nonEditable.message.accepted");
        case MISSION_STATUS.REQUESTED:
            return i18n.t("missionDetails:nonEditable.message.requested");
        case MISSION_STATUS.PENDING:
            return i18n.t("missionDetails:nonEditable.message.pending");
        case MISSION_STATUS.REJECTED:
            return i18n.t("missionDetails:nonEditable.message.rejected");
        case MISSION_STATUS.EXPIRED:
            return i18n.t("missionDetails:nonEditable.message.expired");
        default: {
            const formatted = formatStatus(status);
            const label = formatted
                ? i18n.t(`mission:status.${s}`, { defaultValue: formatted }).toLowerCase()
                : i18n.t("missionDetails:nonEditable.closed");
            return i18n.t("missionDetails:nonEditable.message.default", { status: label });
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
            return i18n.t("missionDetails:nonEditable.reason.completed");
        case MISSION_STATUS.INPROGRESS:
        case MISSION_STATUS.PROCESS:
            return i18n.t("missionDetails:nonEditable.reason.inprogress");
        case MISSION_STATUS.COMPLETION_REQUESTED:
            return i18n.t("missionDetails:nonEditable.reason.completionRequested");
        case MISSION_STATUS.SCHEDULED:
            return i18n.t("missionDetails:nonEditable.reason.scheduled");
        case MISSION_STATUS.ACCEPTED:
            return i18n.t("missionDetails:nonEditable.reason.accepted");
        case MISSION_STATUS.REQUESTED:
            return i18n.t("missionDetails:nonEditable.reason.requested");
        case MISSION_STATUS.PENDING:
            return i18n.t("missionDetails:nonEditable.reason.pending");
        case MISSION_STATUS.REJECTED:
            return i18n.t("missionDetails:nonEditable.reason.rejected");
        case MISSION_STATUS.EXPIRED:
            return i18n.t("missionDetails:nonEditable.reason.expired");
        default:
            return i18n.t("missionDetails:nonEditable.reason.default", {
                status: formatStatus(status)
                    ? i18n.t(`mission:status.${s}`, { defaultValue: formatStatus(status) })
                    : i18n.t("missionDetails:nonEditable.closed"),
            });
    }
};
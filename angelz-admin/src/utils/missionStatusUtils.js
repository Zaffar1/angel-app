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
  MISSION_STATUS.REQUESTED,
];

export const isMissionDisabled = (status) =>
  DISABLED_STATUSES.includes(status);

export const getStatusClass = (status) => {
  if (!status) return MISSION_STATUS_STYLES[MISSION_STATUS.PENDING] || "bg-yellow-100 text-yellow-700";
  const normalized = status.toLowerCase();
  return MISSION_STATUS_STYLES[normalized] || "bg-gray-100 text-gray-700";
};

export const formatStatus = (status) => {
  if (!status) return "";
  if (status.toLowerCase() === "inprogress") return "In Progress";
  return status
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

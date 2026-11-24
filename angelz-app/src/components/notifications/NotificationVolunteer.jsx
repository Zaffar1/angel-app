import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { FaSpinner, FaTimes } from "react-icons/fa";
import { useNotifications } from "../../api/notification";
import {
  useStartMission,
  useCompletionRequest,
  useJoinOrganization,
  useRejectOrganizationInvite,
} from "../../api/mission";
import { useUpdateGroupVolunteerMissionStatus } from "../../api/volunteerGroup";
import { formatDateTime } from "../../utils/dateUtils";
import { MISSION_STATUS, MISSION_TYPE } from "../../constant/MISSION_STATUS";
import useUserProfile from "../../hooks/useUserProfile";

export default function NotificationVolunteer({ onClose }) {
  const ref = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const { user } = useUserProfile();

  const { data: notifications = [], isLoading, markAllAsRead, refetch } = useNotifications();

  const updateGroupStatus = useUpdateGroupVolunteerMissionStatus();

  const scheduledMissionIds = useMemo(() => {
    const ids = new Set();
    notifications.forEach((n) => {
      if (n.type === MISSION_TYPE.MISSION_SCHEDULED) {
        try {
          const meta = JSON.parse(n.meta || "{}");
          const mId = meta?.missionId || meta?.mission_id;
          if (mId) ids.add(mId);
        } catch (e) { }
      }
    });
    return ids;
  }, [notifications]);

  const startMission = useStartMission();
  const requestCompletion = useCompletionRequest();
  const joinOrganization = useJoinOrganization();
  const rejectOrganization = useRejectOrganizationInvite();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handleClickOutside, true);
    return () => document.removeEventListener("mousedown", handleClickOutside, true);
  }, [onClose]);

  useEffect(() => {
    if (notifications.length) {
      markAllAsRead();
    }
  }, [notifications.length]);

  const filtered = useMemo(
    () => (tab === "unread" ? notifications.filter((n) => n.status === "unread") : notifications),
    [tab, notifications]
  );

  const ACTIONS = {
    [MISSION_STATUS.PROCESS]: {
      label: "Start Mission",
      run: (mission_id, volunteer_id) =>
        startMission.mutateAsync({ mission_id, volunteer_id }),
    },
    [MISSION_STATUS.INPROGRESS]: {
      label: "Submit Completion",
      run: (mission_id) => requestCompletion.mutateAsync(mission_id),
    },
    [MISSION_STATUS.COMPLETION_REQUESTED]: {
      label: "Submit Completion",
      run: (mission_id) => requestCompletion.mutateAsync(mission_id),
    },
  };

  const handleAction = async (n, actionType = "join") => {
    const meta = JSON.parse(n.meta || "{}");
    const missionId = meta?.missionId || meta?.mission_id;
    const volunteerId = meta?.volunteer_id || meta?.volunteerId;
    setLoading(n.id);

    try {
      if (n.type === MISSION_TYPE.ORGANIZATION_INVITATION) {
        const orgId = meta.organization_id || n.organization_id || n.sender_id;
        if (!orgId) throw new Error("Organization ID not found");

        if (actionType === "join") {
          await joinOrganization.mutateAsync(orgId);
        } else {
          await rejectOrganization.mutateAsync(orgId);
        }
        return;
      }

      if (user?.type === "volunteer_group") {
        await updateGroupStatus.mutateAsync({
          mission_id: Number(missionId),
          volunteer_id: volunteerId ? Number(volunteerId) : undefined,
          status: "completed"
        });
        return;
      }

      let action;
      if (user?.type === "volunteer") {
        const volStatus = n.volunteer_mission_status || "pending";
        if (volStatus === "pending") {
          action = {
            label: "Start Mission",
            run: (mId) => startMission.mutateAsync({ mission_id: mId, volunteer_id: user.id })
          };
        } else if (volStatus === "in_progress") {
          action = {
            label: "Submit Completion",
            run: (mId) => requestCompletion.mutateAsync(mId)
          };
        }
      } else {
        action = ACTIONS[n.mission_status] || ACTIONS[MISSION_STATUS.COMPLETION_REQUESTED];
      }

      if (!action) return;

      await action.run(missionId, n.sender_id);
    } finally {
      setLoading(null);
      // Immediately invalidate and refetch all related queries so UI updates in current tab
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["mission"] });
      queryClient.invalidateQueries({ queryKey: ["missions"] });
      queryClient.invalidateQueries({ queryKey: ["orgMissions"] });
    }
  };

  const handleNotificationClick = (n) => {
    try {
      const meta = JSON.parse(n.meta || "{}");
      const missionId = meta?.missionId || meta?.mission_id;
      if (missionId) {
        onClose?.();
        navigate(`/${user?.type || "volunteer"}/mission/${missionId}`);
        return;
      }
    } catch (e) { }
    setExpandedId(expandedId === n.id ? null : n.id);
  };

  return (
    <div
      ref={ref}
      className="fixed md:absolute top-[75px] md:top-auto left-4 md:left-auto right-4 md:right-0 mt-2 w-auto md:w-[420px] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 p-5 z-50 animate-fadeIn"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4 border-b pb-3">
        <h3 className="text-base font-bold text-gray-800">Volunteer Notifications</h3>
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
          <FaTimes className="text-base" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {["all", "unread"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${tab === t
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Notifications */}
      <div className="max-h-[340px] overflow-y-auto space-y-3 pr-1">
        {isLoading ? (
          <p className="text-sm text-center text-gray-500 py-4">Loading...</p>
        ) : !filtered.length ? (
          <p className="text-sm text-center text-gray-400 py-6">No notifications</p>
        ) : (
          (() => {
            const seenMissionActions = new Set();
            return filtered.map((n) => {
              const isVolunteer = user?.type === "volunteer";
              const isVolunteerGroup = user?.type === "volunteer_group";
              const meta = JSON.parse(n.meta || "{}");
              const missionId = meta?.missionId || meta?.mission_id;
              const volunteerId = meta?.volunteerId || meta?.volunteer_id;
              const { date, time } = formatDateTime(n.created_at);

              let action = null;
              if (isVolunteer) {
                const volStatus = n.volunteer_mission_status;
                if (volStatus === "pending") {
                  action = {
                    label: "Start Mission",
                    run: (mId) => startMission.mutateAsync({ mission_id: mId, volunteer_id: user.id })
                  };
                } else if (volStatus === "in_progress") {
                  action = {
                    label: "Submit Completion",
                    run: (mId) => requestCompletion.mutateAsync(mId)
                  };
                }
              } else if (isVolunteerGroup) {
                action = null;
              } else {
                action = ACTIONS[n.mission_status];
              }

              let shouldShowAction = false;

              if (action && missionId && !seenMissionActions.has(missionId)) {
                if (isVolunteer) {
                  // Volunteer sees button if mission is not completed or scheduled
                  if (
                    n.mission_status !== MISSION_STATUS.COMPLETED &&
                    n.mission_status !== "completed" &&
                    n.mission_status !== MISSION_STATUS.SCHEDULED &&
                    n.mission_status !== "scheduled"
                  ) {
                    const volStatus = n.volunteer_mission_status;
                    if (
                      (volStatus === "pending" && (
                        n.type === MISSION_TYPE.MISSION_SCHEDULED ||
                        (n.type === MISSION_TYPE.MISSION_ACCEPTED && !scheduledMissionIds.has(missionId)) ||
                        n.mission_status === MISSION_STATUS.PROCESS
                      )) ||
                      volStatus === "in_progress"
                    ) {
                      shouldShowAction = true;
                      seenMissionActions.add(missionId);
                    }
                  }
                }
              }

              return (
                <div
                  key={n.id}
                  className={`relative flex justify-between items-center gap-3 p-3.5 rounded-xl transition-all duration-200 border ${n.status === "unread"
                      ? "bg-blue-50/30 border-blue-100/50 hover:bg-blue-50/50"
                      : "bg-white border-gray-100/70 hover:bg-gray-50/50"
                    } ${loading === n.id ? "opacity-50" : "shadow-sm hover:shadow"}`}
                >
                  <div
                    className="peer flex-1 min-w-0 pr-2 cursor-pointer"
                    onClick={() => handleNotificationClick(n)}
                  >
                    {/* Default truncated text */}
                    <p className={`text-sm font-semibold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors ${expandedId === n.id ? "whitespace-normal" : "truncate"}`}>
                      {n.message}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1 font-medium flex items-center gap-1.5">
                      <span className="capitalize">{date}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                      <span>{time}</span>
                    </p>
                  </div>

                  <div className="flex gap-2 items-center shrink-0 peer-hover:opacity-0 peer-hover:pointer-events-none transition-opacity duration-150">
                    {/* ORGANIZATION INVITE */}
                    {n.type === MISSION_TYPE.ORGANIZATION_INVITATION && (
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(n, "join");
                          }}
                          disabled={loading === n.id}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 bg-green-600 text-white hover:bg-green-700 shadow-sm transition-colors cursor-pointer disabled:opacity-60"
                        >
                          {loading === n.id ? (
                            <FaSpinner className="animate-spin" size={12} />
                          ) : (
                            "Join"
                          )}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(n, "reject");
                          }}
                          disabled={loading === n.id}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {/* MISSION ACTION */}
                    {shouldShowAction && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction(n);
                        }}
                        disabled={loading === n.id}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors cursor-pointer disabled:opacity-60 shrink-0"
                      >
                        {loading === n.id ? (
                          <FaSpinner className="animate-spin" size={12} />
                        ) : (
                          action.label
                        )}
                      </button>
                    )}
                  </div>

                  {/* Full text overlay in the exact same place on peer hover */}
                  {expandedId !== n.id && (
                    <div className="absolute left-0 top-0 w-full min-h-full bg-white border border-gray-200 shadow-xl rounded-xl p-3.5 hidden md:peer-hover:block whitespace-normal break-words z-30 animate-fadeIn pointer-events-none">
                      <p className="text-sm font-semibold text-gray-900 leading-relaxed">
                        {n.message}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1 font-medium flex items-center gap-1.5">
                        <span className="capitalize">{date}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                        <span>{time}</span>
                      </p>
                    </div>
                  )}
                </div>
              );
            });
          })()
        )}
      </div>
    </div>
  );
}

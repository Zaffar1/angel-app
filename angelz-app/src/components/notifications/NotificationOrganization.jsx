import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { FaSpinner, FaTimes } from "react-icons/fa";
import { useNotifications } from "../../api/notification";
import useUserProfile from "../../hooks/useUserProfile";
import {
  useAcceptMissionRequest,
  useRejectMissionRequest,
  useCompleteMission,
  useRejectMissionCompletion,
} from "../../api/mission";
import { formatDateTime } from "../../utils/dateUtils";
import { MISSION_STATUS, MISSION_TYPE } from "../../constant/MISSION_STATUS";

export default function NotificationOrganization({ onClose }) {
  const ref = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useUserProfile();
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState({ id: null, action: null });
  const [handled, setHandled] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  const { data: notifications = [], isLoading, refetch } = useNotifications();

  const accept = useAcceptMissionRequest({
    onSettled: () => setLoading({ id: null, action: null }),
  });

  const reject = useRejectMissionRequest({
    onSettled: () => setLoading({ id: null, action: null }),
  });

  const complete = useCompleteMission({
    onSettled: () => setLoading({ id: null, action: null }),
  });

  const rejectCompletion = useRejectMissionCompletion({
    onSettled: () => setLoading({ id: null, action: null }),
  });

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handleClickOutside, true);
    return () => document.removeEventListener("mousedown", handleClickOutside, true);
  }, [onClose]);

  const filtered = useMemo(
    () => (tab === "unread" ? notifications.filter((n) => n.status === "unread") : notifications),
    [tab, notifications]
  );

  const handleAction = async (action, n) => {
    const meta = JSON.parse(n.meta || "{}");
    const missionId = meta?.mission_id || meta?.missionId;
    const volunteerId = meta?.volunteer_id || meta?.volunteerId || n.sender_id;

    setLoading({ id: n.id, action });

    try {
      if (action === "accept") await accept.mutateAsync({ missionId, volunteerId });
      if (action === "reject") await reject.mutateAsync({ missionId, volunteerId });
      if (action === "complete") await complete.mutateAsync({ missionId, volunteerId });
      if (action === "reject-completion") await rejectCompletion.mutateAsync({ missionId, volunteerId });

      setHandled((prev) => [...prev, n.id]);

      // Immediately invalidate and refetch all related queries so UI updates in current tab
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["mission"] });
      queryClient.invalidateQueries({ queryKey: ["missions"] });
      queryClient.invalidateQueries({ queryKey: ["orgMissions"] });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading({ id: null, action: null });
    }
  };

  const handleNotificationClick = (n) => {
    try {
      const meta = JSON.parse(n.meta || "{}");
      const missionId = meta?.mission_id || meta?.missionId;
      if (missionId) {
        onClose?.();
        navigate(`/organization/mission/${missionId}`);
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
      <div className="flex items-center justify-between mb-4 border-b pb-3">
        <h3 className="text-base font-bold text-gray-800">Organization Notifications</h3>
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
          <FaTimes className="text-base" />
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {["all", "unread"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${tab === t ? "bg-blue-600 text-white shadow-sm" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="max-h-[340px] overflow-y-auto space-y-3 pr-1">
        {isLoading ? (
          <p className="text-center text-sm text-gray-500 py-4">Loading...</p>
        ) : !filtered.length ? (
          <p className="text-center text-sm text-gray-400 py-6">No notifications</p>
        ) : (
          filtered.map((n) => {
            const done = handled.includes(n.id);
            const busy = (a) => loading.id === n.id && loading.action === a;
            const { date, time } = formatDateTime(n.created_at);

            return (
              <div
                key={n.id}
                className={`relative flex justify-between items-center gap-3 p-3.5 rounded-xl transition-all duration-200 border ${n.status === "unread"
                    ? "bg-blue-50/30 border-blue-100/50 hover:bg-blue-50/50"
                    : "bg-white border-gray-100/70 hover:bg-gray-50/50"
                  } ${done ? "opacity-40" : "shadow-sm hover:shadow"}`}
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
                  {!done ? (
                    <>
                      {n.type === "group_assigned_volunteer" ? (
                        <div className="flex gap-2 items-center shrink-0">
                          {n.group_application_status === "pending" ? (
                            ["accept", "reject"].map((a) => (
                              <button
                                key={a}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAction(a, n);
                                }}
                                disabled={busy(a)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${a === "accept"
                                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                                  } disabled:opacity-60`}
                              >
                                {busy(a) ? <FaSpinner size={12} className="animate-spin" /> : null}
                                {a === "accept" ? "Accept" : "Reject"}
                              </button>
                            ))
                          ) : n.group_application_status === "accepted" ? (
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                              Accepted
                            </span>
                          ) : n.group_application_status === "rejected" ? (
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                              Rejected
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        n.mission_status === MISSION_STATUS.PENDING && (
                          <div className="flex gap-2 shrink-0">
                            {["accept", "reject"].map((a) => (
                              <button
                                key={a}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAction(a, n);
                                }}
                                disabled={busy(a)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${a === "accept"
                                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                                  } disabled:opacity-60`}
                              >
                                {busy(a) ? <FaSpinner size={12} className="animate-spin" /> : null}
                                {a === "accept" ? "Accept" : "Reject"}
                              </button>
                            ))}
                          </div>
                        )
                      )}

                      {n.type === MISSION_TYPE.MISSION_COMPLETION_REQUEST && n.mission_status === MISSION_STATUS.COMPLETION_REQUESTED
                        && (
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction("complete", n);
                              }}
                              disabled={busy("complete")}
                              className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 bg-green-600 text-white hover:bg-green-700 shadow-sm transition-colors cursor-pointer disabled:opacity-60"
                            >
                              {busy("complete") ? (
                                <FaSpinner size={12} className="animate-spin" />
                              ) : (
                                "Approve"
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction("reject-completion", n);
                              }}
                              disabled={busy("reject-completion")}
                              className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-60"
                            >
                              {busy("reject-completion") ? (
                                <FaSpinner size={12} className="animate-spin" />
                              ) : (
                                "Reject"
                              )}
                            </button>
                          </div>
                        )}
                    </>
                  ) : (
                    <span className="text-xs text-gray-400 font-semibold italic shrink-0">
                      Handled
                    </span>
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
          })
        )}
      </div>
    </div>
  );
}

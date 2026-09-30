import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import API from "../utils/Config";
import Loader from "../component/Loader";
import classNames from "classnames";
import { getStatusClass, formatStatus } from "../utils/missionStatusUtils";
import {
  FaArrowLeft,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaClock,
  FaTasks,
  FaCheckCircle,
  FaSearch,
  FaCalendarAlt,
  FaRegEye,
  FaExclamationTriangle,
  FaBuilding,
  FaAward,
  FaHourglassHalf,
  FaIdBadge,
  FaUserCheck,
} from "react-icons/fa";

const VolunteerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Try retrieving cached volunteer from sessionStorage in case of direct access or refresh
  const getCachedVolunteer = () => {
    try {
      const single = sessionStorage.getItem(`cached_volunteer_${id}`);
      if (single) {
        const parsed = JSON.parse(single);
        if (parsed) return parsed;
      }

      const listRaw = sessionStorage.getItem("admin_volunteers_cache");
      if (listRaw) {
        const list = JSON.parse(listRaw);
        if (Array.isArray(list)) {
          const match = list.find(
            (v) =>
              String(v.id) === String(id) ||
              String(v._id) === String(id) ||
              String(v.user_id) === String(id)
          );
          if (match) return match;
        }
      }
    } catch (e) {
      // ignore
    }
    return null;
  };

  const initialCached = getCachedVolunteer();
  const stateVol =
    location.state?.volunteer &&
    String(
      location.state.volunteer._id ||
      location.state.volunteer.id ||
      location.state.volunteer.user_id
    ) === String(id)
      ? location.state.volunteer
      : initialCached;

  const [volunteer, setVolunteer] = useState(stateVol);
  const [loading, setLoading] = useState(!stateVol);
  const [error, setError] = useState(null);

  // Missions state partitioned by status
  const [assignedMissions, setAssignedMissions] = useState([]);
  const [pendingMissions, setPendingMissions] = useState([]);
  const [completedMissions, setCompletedMissions] = useState([]);
  const [missionsLoading, setMissionsLoading] = useState(true);

  // Availability timing state
  const [availabilityTiming, setAvailabilityTiming] = useState([]);

  // Active tab & search
  const [activeMissionTab, setActiveMissionTab] = useState("assigned"); // "assigned" | "pending" | "completed"
  const [missionSearch, setMissionSearch] = useState("");

  // Helper to parse availability timing from any format
  const parseTimingData = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw.map((item) => {
        if (!item || typeof item !== "object") return { day: String(item), from: "—", to: "—" };
        return {
          ...item,
          day: item.day || item.day_of_week || "Day",
          from: item.from || item.start_time || item.start || "—",
          to: item.to || item.end_time || item.end || "—",
        };
      });
    }
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parseTimingData(parsed);
        if (typeof parsed === "object" && parsed !== null) {
          return Object.entries(parsed).map(([day, times]) => ({
            day,
            from: (typeof times === "object" ? times?.from || times?.start_time || times?.start : times) || "—",
            to: (typeof times === "object" ? times?.to || times?.end_time || times?.end : "—") || "—",
          }));
        }
      } catch (e) {
        // String not JSON
        if (raw.trim().length > 0) {
          return [{ day: raw, from: "—", to: "—" }];
        }
      }
    }
    if (typeof raw === "object" && raw !== null) {
      return Object.entries(raw).map(([day, times]) => ({
        day,
        from: (typeof times === "object" ? times?.from || times?.start_time || times?.start : times) || "—",
        to: (typeof times === "object" ? times?.to || times?.end_time || times?.end : "—") || "—",
      }));
    }
    return [];
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name) => {
    if (!name) return "V";
    return name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const getStatusBadge = (status) => {
    const s = (status || "active").toString().toLowerCase();
    if (s === "active" || s === "1" || s === "approved") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
          Active
        </span>
      );
    }
    if (s === "inactive" || s === "0" || s === "blocked") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>
          Inactive
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
        {status || "Pending"}
      </span>
    );
  };

  const getApprovalBadge = (approval) => {
    const a = (approval || "pending").toString().toLowerCase();
    if (a === "approved" || a === "1" || a === "true") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          Approved
        </span>
      );
    }
    if (a === "rejected" || a === "0" || a === "false") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
          Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        Approval Pending
      </span>
    );
  };

  // Main data fetching effect
  useEffect(() => {
    let isMounted = true;
    const currentCached = getCachedVolunteer();
    const active = stateVol || currentCached;

    if (!active) {
      setLoading(true);
    }
    setError(null);
    setMissionsLoading(true);

    const fetchAllData = async () => {
      let resolvedVol = active;

      // 1. Fetch Volunteer Profile Details
      try {
        const res = await API.get(`/admin/volunteer/${id}`);
        const volData =
          res?.data?.volunteer ||
          res?.data?.data?.volunteer ||
          res?.data?.data ||
          (Array.isArray(res?.data) ? res.data[0] : res?.data);

        if (volData && (volData.id || volData._id || volData.name || volData.email)) {
          resolvedVol = { ...(resolvedVol || {}), ...volData };
        }
      } catch (err) {
        console.warn("[VolunteerDetail] GET /admin/volunteer/:id failed, trying fallbacks:", err?.message);

        // Fallback: /admin/volunteers list
        if (!resolvedVol) {
          try {
            const listRes = await API.get("/admin/volunteers", { params: { limit: 100 } });
            const list =
              listRes?.data?.volunteers ||
              listRes?.data?.data ||
              (Array.isArray(listRes?.data) ? listRes.data : []);

            const match = list.find(
              (v) =>
                String(v.id) === String(id) ||
                String(v._id) === String(id) ||
                String(v.user_id) === String(id)
            );
            if (match) resolvedVol = match;
          } catch (e2) {
            // ignore
          }
        }
      }

      if (!isMounted) return;

      if (resolvedVol) {
        setVolunteer(resolvedVol);
        try {
          sessionStorage.setItem(`cached_volunteer_${id}`, JSON.stringify(resolvedVol));
        } catch (e) {}

        // Parse initial availability from volunteer object
        const rawTiming =
          resolvedVol.available_timing ||
          resolvedVol.available_timings ||
          resolvedVol.availability ||
          resolvedVol.timings ||
          resolvedVol.timing ||
          resolvedVol.availabilities ||
          resolvedVol.schedule;

        const parsedTiming = parseTimingData(rawTiming);
        if (parsedTiming.length > 0) {
          setAvailabilityTiming(parsedTiming);
        }
      } else {
        setError("Volunteer not found");
      }
      setLoading(false);

      // 2. Fetch Extra Availability if needed
      try {
        const rawTiming =
          resolvedVol?.available_timing ||
          resolvedVol?.available_timings ||
          resolvedVol?.availability ||
          resolvedVol?.timings;

        if (!rawTiming || (Array.isArray(rawTiming) && rawTiming.length === 0)) {
          // Try availability endpoints
          const timingEndpoints = [
            `/admin/volunteer/${id}/timing`,
            `/admin/volunteer/${id}/availability`,
            `/volunteer/${id}/availability`,
            `/volunteer/${id}/timing`,
          ];

          for (const ep of timingEndpoints) {
            try {
              const tRes = await API.get(ep);
              const dataTiming =
                tRes?.data?.timing ||
                tRes?.data?.available_timing ||
                tRes?.data?.availability ||
                tRes?.data?.data ||
                tRes?.data;
              const parsed = parseTimingData(dataTiming);
              if (parsed.length > 0 && isMounted) {
                setAvailabilityTiming(parsed);
                break;
              }
            } catch (te) {
              // try next
            }
          }
        }
      } catch (tErr) {
        console.warn("Could not fetch extra availability:", tErr);
      }

      // 3. Set Specific Missions for this Volunteer from the API response
      try {
        let assigned = [];
        let pending = [];
        let completed = [];

        // Check if pre-populated in resolvedVol by /admin/volunteer/:id
        if (Array.isArray(resolvedVol?.assigned_missions)) assigned.push(...resolvedVol.assigned_missions);
        if (Array.isArray(resolvedVol?.pending_missions)) pending.push(...resolvedVol.pending_missions);
        if (Array.isArray(resolvedVol?.completed_missions)) completed.push(...resolvedVol.completed_missions);

        if (Array.isArray(resolvedVol?.missions)) {
          resolvedVol.missions.forEach((m) => {
            const st = (m.status || "").toLowerCase();
            if (st === "completed" || st === "done" || st === "finished") {
              if (!completed.some((c) => String(c.id) === String(m.id))) completed.push(m);
            } else if (st === "pending" || st === "applied" || st === "requested") {
              if (!pending.some((p) => String(p.id) === String(m.id))) pending.push(m);
            } else {
              if (!assigned.some((a) => String(a.id) === String(m.id))) assigned.push(m);
            }
          });
        }

        if (isMounted) {
          setAssignedMissions(assigned);
          setPendingMissions(pending);
          setCompletedMissions(completed);
          setMissionsLoading(false);
        }
      } catch (mErr) {
        console.warn("Mission fetch failed:", mErr);
        if (isMounted) setMissionsLoading(false);
      }
    };

    fetchAllData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading && !volunteer) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader />
        <p className="mt-3 text-sm text-gray-500 font-medium">Loading volunteer details...</p>
      </div>
    );
  }

  if (error && !volunteer) {
    return (
      <div className="max-w-4xl mx-auto my-8 p-6 bg-white rounded-xl shadow-sm border border-red-200">
        <div className="flex items-center gap-3 text-red-600 mb-3">
          <FaExclamationTriangle className="text-2xl" />
          <h2 className="text-lg font-semibold">Failed to Load Volunteer</h2>
        </div>
        <p className="text-gray-600 mb-4">{error}</p>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-admin_primary text-white rounded-lg hover:opacity-90 transition text-sm font-medium"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate("/volunteers")}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
          >
            Back to Volunteers
          </button>
        </div>
      </div>
    );
  }

  if (!volunteer) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-xl shadow-sm text-center border border-gray-100">
        <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
          <FaUser />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Volunteer Not Found</h2>
        <p className="text-gray-500 text-sm mb-6">
          The requested volunteer could not be found or may have been deleted.
        </p>
        <button
          onClick={() => navigate("/volunteers")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-admin_primary text-white rounded-lg hover:opacity-90 transition text-sm font-medium no-underline"
        >
          <FaArrowLeft size={14} /> Back to Volunteers
        </button>
      </div>
    );
  }

  const displayName =
    volunteer.name ||
    [volunteer.first_name, volunteer.last_name].filter(Boolean).join(" ") ||
    volunteer.username ||
    `Volunteer #${id}`;

  const fullLocation = [volunteer.city, volunteer.state, volunteer.country]
    .filter(Boolean)
    .join(", ");

  // Select active mission list based on current tab
  const getActiveMissionList = () => {
    switch (activeMissionTab) {
      case "assigned":
        return assignedMissions;
      case "pending":
        return pendingMissions;
      case "completed":
        return completedMissions;
      default:
        return assignedMissions;
    }
  };

  const currentMissions = getActiveMissionList();
  const filteredMissions = currentMissions.filter((m) => {
    if (!missionSearch) return true;
    const term = missionSearch.toLowerCase();
    const nameMatch = m.name?.toLowerCase().includes(term);
    const orgMatch = (m.organization_name || m.company_name)?.toLowerCase().includes(term);
    const typeMatch = m.mission_type?.toLowerCase().includes(term);
    const statusMatch = m.status?.toLowerCase().includes(term);
    return nameMatch || orgMatch || typeMatch || statusMatch;
  });

  const totalMissionsCount = assignedMissions.length + pendingMissions.length + completedMissions.length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <button
          onClick={() => navigate("/volunteers")}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-admin_primary transition w-fit bg-transparent border-none p-0 cursor-pointer"
        >
          <FaArrowLeft size={14} />
          <span>Back to Volunteers</span>
        </button>

        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Volunteer ID: #{volunteer.id || volunteer._id || id}
        </span>
      </div>

      {/* Volunteer Hero Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            {/* Avatar */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-admin_primary to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-md shrink-0">
              {getInitials(displayName)}
            </div>

            {/* Info */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 m-0">
                  {displayName}
                </h1>
                {getStatusBadge(volunteer.status)}
                {getApprovalBadge(volunteer.isApproved || volunteer.status)}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-500 pt-1">
                {volunteer.email && (
                  <span className="inline-flex items-center gap-1.5 text-gray-600">
                    <FaEnvelope className="text-gray-400" />
                    <span>{volunteer.email}</span>
                  </span>
                )}
                {volunteer.contact_no && (
                  <span className="inline-flex items-center gap-1.5 text-gray-600">
                    <FaPhone className="text-gray-400" />
                    <span>{volunteer.contact_no}</span>
                  </span>
                )}
                {fullLocation && (
                  <span className="inline-flex items-center gap-1.5 text-gray-600">
                    <FaMapMarkerAlt className="text-gray-400" />
                    <span>{fullLocation}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 pt-4 md:pt-0 border-gray-100 gap-2">
            <span className="text-xs text-gray-400 uppercase font-semibold">User Role</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 capitalize">
              <FaUserCheck size={12} />
              {volunteer.type || "Volunteer"}
            </span>
          </div>
        </div>
      </div>

      {/* Key Metric Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Missions */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 m-0">Total Missions</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1 mb-0">{totalMissionsCount}</h3>
            <p className="text-xs text-gray-500 mt-1 mb-0">All associated</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
            <FaTasks />
          </div>
        </div>

        {/* Assigned Missions */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 m-0">Assigned Missions</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1 mb-0">{assignedMissions.length}</h3>
            <p className="text-xs text-emerald-600 font-medium mt-1 mb-0">Active participation</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
            <FaClock />
          </div>
        </div>

        {/* Pending Missions */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 m-0">Pending / Applied</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1 mb-0">{pendingMissions.length}</h3>
            <p className="text-xs text-amber-600 font-medium mt-1 mb-0">Awaiting approval</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl">
            <FaHourglassHalf />
          </div>
        </div>

        {/* Completed Missions */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 m-0">Completed</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1 mb-0">{completedMissions.length}</h3>
            <p className="text-xs text-purple-600 font-medium mt-1 mb-0">Finished tasks</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl">
            <FaCheckCircle />
          </div>
        </div>
      </div>

      {/* Main Content Layout: Left (Missions) & Right (Availability + Basic Info) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Volunteer Missions with Tabs (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Tabs Header & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 px-6 pt-5 pb-0 gap-4">
              <div className="flex flex-wrap gap-4 sm:gap-6">
                <button
                  type="button"
                  onClick={() => {
                    setActiveMissionTab("assigned");
                    setMissionSearch("");
                  }}
                  className={classNames(
                    "pb-3 text-sm font-semibold transition border-b-2 bg-transparent cursor-pointer border-x-0 border-t-0 p-0 flex items-center gap-1.5",
                    activeMissionTab === "assigned"
                      ? "border-admin_primary text-admin_primary"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  )}
                >
                  <span>Assigned Missions</span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700 font-bold">
                    {assignedMissions.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveMissionTab("pending");
                    setMissionSearch("");
                  }}
                  className={classNames(
                    "pb-3 text-sm font-semibold transition border-b-2 bg-transparent cursor-pointer border-x-0 border-t-0 p-0 flex items-center gap-1.5",
                    activeMissionTab === "pending"
                      ? "border-admin_primary text-admin_primary"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  )}
                >
                  <span>Pending Missions</span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-amber-50 text-amber-700 font-bold">
                    {pendingMissions.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveMissionTab("completed");
                    setMissionSearch("");
                  }}
                  className={classNames(
                    "pb-3 text-sm font-semibold transition border-b-2 bg-transparent cursor-pointer border-x-0 border-t-0 p-0 flex items-center gap-1.5",
                    activeMissionTab === "completed"
                      ? "border-admin_primary text-admin_primary"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  )}
                >
                  <span>Completed</span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-purple-50 text-purple-700 font-bold">
                    {completedMissions.length}
                  </span>
                </button>
              </div>

              {/* Search */}
              <div className="pb-3">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  <input
                    type="text"
                    value={missionSearch}
                    onChange={(e) => setMissionSearch(e.target.value)}
                    placeholder="Search missions..."
                    className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-admin_primary w-full sm:w-52"
                  />
                </div>
              </div>
            </div>

            {/* Table Content */}
            <div className="p-6">
              {missionsLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <Loader />
                  <p className="mt-3 text-xs text-gray-400">Loading missions data...</p>
                </div>
              ) : filteredMissions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
                    <FaTasks />
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    {missionSearch
                      ? "No matching missions found"
                      : activeMissionTab === "assigned"
                      ? "No assigned missions currently"
                      : activeMissionTab === "pending"
                      ? "No pending mission applications"
                      : "No completed missions recorded"}
                  </p>
                  <p className="text-xs text-gray-400 m-0">
                    {missionSearch
                      ? "Try refining your search keyword."
                      : activeMissionTab === "assigned"
                      ? "Missions assigned to this volunteer will appear here."
                      : activeMissionTab === "pending"
                      ? "Pending applications from this volunteer will be listed here."
                      : "Finished missions completed by this volunteer will be archived here."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100 text-sm">
                    <thead>
                      <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <th className="pb-3 font-semibold">#</th>
                        <th className="pb-3 font-semibold">Mission Name</th>
                        <th className="pb-3 font-semibold">Organization</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold">Schedule</th>
                        <th className="pb-3 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredMissions.map((mission, index) => {
                        const mId = mission.id || mission._id;
                        const orgName =
                          mission.organization_name ||
                          mission.company_name ||
                          (typeof mission.organization === "string" ? mission.organization : null) ||
                          mission.organization?.name ||
                          mission.organization?.company_name ||
                          "—";

                        return (
                          <tr key={mId || index} className="hover:bg-gray-50/70 transition">
                            <td className="py-3 pr-2 text-xs text-gray-400 font-mono">
                              {index + 1}
                            </td>

                            <td className="py-3 px-3">
                              <span className="font-semibold text-gray-900 block max-w-xs truncate">
                                {mission.name || "Untitled Mission"}
                              </span>
                              {mission.mission_type && (
                                <span className="inline-block mt-0.5 text-[11px] font-medium text-gray-400">
                                  {mission.mission_type}
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-gray-600">
                              <span className="inline-flex items-center gap-1.5 text-xs">
                                <FaBuilding className="text-gray-400 shrink-0 text-[10px]" />
                                <span className="truncate max-w-[150px]">{orgName}</span>
                              </span>
                            </td>

                            <td className="py-3 px-3">
                              <span
                                className={classNames(
                                  "px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap",
                                  getStatusClass(mission.status)
                                )}
                              >
                                {formatStatus(mission.status)}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-xs text-gray-500 whitespace-nowrap">
                              {mission.start_time ? (
                                <span className="flex items-center gap-1">
                                  <FaCalendarAlt className="text-gray-400 text-[10px]" />
                                  {formatDateTime(mission.start_time)}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>

                            <td className="py-3 pl-3 text-right">
                              {mId ? (
                                <Link
                                  to={`/missions/${mId}`}
                                  state={{ mission }}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 hover:bg-admin_primary hover:text-white text-gray-700 rounded-md text-xs font-medium transition no-underline hover:no-underline"
                                >
                                  <FaRegEye size={12} />
                                  <span>View</span>
                                </Link>
                              ) : (
                                <span className="text-gray-400 text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Availability Timing + Basic Information (1 col) */}
        <div className="space-y-6">
          {/* Available Timing Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">
                  <FaClock />
                </div>
                <h2 className="text-base font-bold text-gray-900 m-0">Available Timing</h2>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                {availabilityTiming.length} slots
              </span>
            </div>

            {availabilityTiming.length === 0 ? (
              <div className="text-center py-6">
                <FaClock className="text-gray-300 text-2xl mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700 m-0">No availability set</p>
                <p className="text-xs text-gray-400 mt-1 mb-0">
                  This volunteer has not configured working hours yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-gray-100 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50 text-gray-500 font-semibold uppercase">
                    <tr>
                      <th className="p-2.5 text-left border-b border-gray-100">Day</th>
                      <th className="p-2.5 text-left border-b border-gray-100">From</th>
                      <th className="p-2.5 text-left border-b border-gray-100">To</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {availabilityTiming.map((t, i) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="p-2.5 font-medium text-gray-800 capitalize flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          {t.day || t.day_of_week || `Slot #${i + 1}`}
                        </td>
                        <td className="p-2.5 text-gray-600 font-mono">
                          {t.from || t.start_time || t.start || "—"}
                        </td>
                        <td className="p-2.5 text-gray-600 font-mono">
                          {t.to || t.end_time || t.end || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Basic Information Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm">
                <FaIdBadge />
              </div>
              <h2 className="text-base font-bold text-gray-900 m-0">Basic Information</h2>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-medium">User ID</span>
                <span className="font-semibold text-gray-800 font-mono text-xs">
                  #{volunteer.id || volunteer._id || id}
                </span>
              </div>

              {volunteer.username && (
                <div className="flex justify-between items-center py-1 border-b border-gray-50">
                  <span className="text-xs text-gray-400 font-medium">Username</span>
                  <span className="font-medium text-gray-800 text-xs">
                    @{volunteer.username}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-medium">Account Type</span>
                <span className="font-semibold text-indigo-700 capitalize text-xs bg-indigo-50 px-2 py-0.5 rounded">
                  {volunteer.type || "Volunteer"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-medium">Phone / Contact</span>
                <span className="font-medium text-gray-800 text-xs">
                  {volunteer.contact_no || "—"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-medium">City</span>
                <span className="font-medium text-gray-800 text-xs">
                  {volunteer.city || "—"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-medium">State</span>
                <span className="font-medium text-gray-800 text-xs">
                  {volunteer.state || "—"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-medium">Country</span>
                <span className="font-medium text-gray-800 text-xs">
                  {volunteer.country || "—"}
                </span>
              </div>

              {volunteer.created_at && (
                <div className="flex justify-between items-center py-1">
                  <span className="text-xs text-gray-400 font-medium">Member Since</span>
                  <span className="text-xs text-gray-600">
                    {formatDateTime(volunteer.created_at)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerDetail;

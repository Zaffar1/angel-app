import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import API from "../utils/Config";
import Loader from "../component/Loader";
import classNames from "classnames";
import { getStatusClass, formatStatus } from "../utils/missionStatusUtils";
import {
  FaArrowLeft,
  FaUsers,
  FaAward,
  FaTasks,
  FaMapMarkerAlt,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaBuilding,
  FaUserCheck,
  FaExternalLinkAlt,
  FaSearch,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";

const VolunteerGroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // If passed via route state and matches id, use immediately
  const stateGroup =
    location.state?.group && String(location.state.group.id) === String(id)
      ? location.state.group
      : null;

  const [group, setGroup] = useState(stateGroup);
  const [missions, setMissions] = useState(stateGroup?.missions || []);
  const [members, setMembers] = useState(
    (Array.isArray(stateGroup?.members) ? stateGroup.members : null) ||
    (Array.isArray(stateGroup?.volunteers) ? stateGroup.volunteers : null) ||
    (Array.isArray(stateGroup?.group_members) ? stateGroup.group_members : null) ||
    (Array.isArray(stateGroup?.users) ? stateGroup.users : null) ||
    []
  );
  const [activeTab, setActiveTab] = useState("missions"); // "missions" | "members"
  const [loading, setLoading] = useState(!stateGroup);
  const [membersLoading, setMembersLoading] = useState(
    !(Array.isArray(stateGroup?.members) && stateGroup.members.length > 0)
  );
  const [error, setError] = useState(null);
  const [missionSearch, setMissionSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");

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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getInitials = (name) => {
    if (!name) return "VG";
    return name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const getStatusBadge = (stat) => {
    const s = (stat || "").toString().toUpperCase();
    if (s === "ACTIVE" || s === "APPROVED") {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
          Active
        </span>
      );
    }
    if (s === "INACTIVE" || s === "BLOCKED" || s === "REJECTED") {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
          <span className="w-2 h-2 rounded-full bg-rose-500 mr-2"></span>
          Inactive
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
        <span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span>
        {s || "Pending"}
      </span>
    );
  };

  const extractGroupFromResponse = (resData, targetId) => {
    if (!resData) return null;

    // Single group format: { data: { ... } } or { volunteer_group: { ... } }
    if (
      resData.data &&
      typeof resData.data === "object" &&
      !Array.isArray(resData.data)
    ) {
      if (!resData.data.id || String(resData.data.id) === String(targetId)) {
        return resData.data;
      }
    }

    if (
      resData.volunteer_group &&
      typeof resData.volunteer_group === "object" &&
      !Array.isArray(resData.volunteer_group)
    ) {
      if (
        !resData.volunteer_group.id ||
        String(resData.volunteer_group.id) === String(targetId)
      ) {
        return resData.volunteer_group;
      }
    }

    // List response: { volunteer_groups: [ ... ] } or { data: [ ... ] }
    const list =
      (Array.isArray(resData.volunteer_groups) ? resData.volunteer_groups : null) ||
      (Array.isArray(resData.data) ? resData.data : null) ||
      (Array.isArray(resData) ? resData : null);

    if (list && list.length > 0) {
      const match = list.find((g) => String(g.id) === String(targetId));
      if (match) return match;
    }

    // Direct object
    if (!Array.isArray(resData) && typeof resData === "object" && resData.name) {
      if (!resData.id || String(resData.id) === String(targetId)) {
        return resData;
      }
    }

    return null;
  };

  const fetchGroupMembers = async (targetId, existingGroup) => {
    setMembersLoading(true);
    let fetched = null;

    // Strategy 0: Check existingGroup object
    if (existingGroup) {
      const candidates =
        (Array.isArray(existingGroup.members) && existingGroup.members.length > 0
          ? existingGroup.members
          : null) ||
        (Array.isArray(existingGroup.volunteers) && existingGroup.volunteers.length > 0
          ? existingGroup.volunteers
          : null) ||
        (Array.isArray(existingGroup.group_members) && existingGroup.group_members.length > 0
          ? existingGroup.group_members
          : null) ||
        (Array.isArray(existingGroup.users) && existingGroup.users.length > 0
          ? existingGroup.users
          : null);
      if (candidates) {
        fetched = candidates;
      }
    }

    // Strategy 1: Dedicated endpoint /volunteer/volunteer-group/:id/volunteers
    if (!fetched || fetched.length === 0) {
      try {
        const res = await API.get(`/volunteer/volunteer-group/${targetId}/volunteers`);
        const list =
          res?.data?.volunteers ||
          res?.data?.data ||
          (Array.isArray(res?.data) ? res.data : null);
        if (Array.isArray(list) && list.length > 0) {
          fetched = list;
        }
      } catch (err) {
        console.warn("Strategy 1 (/volunteer/volunteer-group/:id/volunteers) failed:", err?.message);
      }
    }

    // Strategy 2: /volunteer-groups/volunteers (filter by invitedBy == targetId)
    if (!fetched || fetched.length === 0) {
      try {
        const res = await API.get("/volunteer-groups/volunteers");
        const list =
          res?.data?.data ||
          res?.data?.volunteers ||
          (Array.isArray(res?.data) ? res.data : null);
        if (Array.isArray(list) && list.length > 0) {
          const matched = list.filter(
            (v) =>
              String(v.invitedBy) === String(targetId) ||
              String(v.group_id) === String(targetId)
          );
          if (matched.length > 0) {
            fetched = matched;
          }
        }
      } catch (err) {
        console.warn("Strategy 2 (/volunteer-groups/volunteers) failed:", err?.message);
      }
    }

    // Strategy 3: /volunteer-group/:id/volunteers
    if (!fetched || fetched.length === 0) {
      try {
        const res = await API.get(`/volunteer-group/${targetId}/volunteers`);
        const list =
          res?.data?.data ||
          res?.data?.volunteers ||
          (Array.isArray(res?.data) ? res.data : null);
        if (Array.isArray(list) && list.length > 0) {
          fetched = list;
        }
      } catch (err) {
        // ignore
      }
    }

    // Strategy 4: /admin/volunteer-group/:id
    if (!fetched || fetched.length === 0) {
      try {
        const res1 = await API.get(`/admin/volunteer-group/${targetId}`);
        const data1 = res1?.data?.data || res1?.data?.volunteer_group || res1?.data;
        if (data1) {
          const cand =
            (Array.isArray(data1.members) && data1.members.length > 0 ? data1.members : null) ||
            (Array.isArray(res1?.data?.members) && res1.data.members.length > 0 ? res1.data.members : null) ||
            (Array.isArray(data1.volunteers) && data1.volunteers.length > 0 ? data1.volunteers : null) ||
            (Array.isArray(data1.group_members) && data1.group_members.length > 0 ? data1.group_members : null) ||
            (Array.isArray(data1.users) && data1.users.length > 0 ? data1.users : null);
          if (cand) {
            fetched = cand;
          }
        }
      } catch (err1) {
        // ignore
      }
    }

    // Strategy 5: /admin/volunteers?limit=500 (filter by invitedBy)
    if (!fetched || fetched.length === 0) {
      try {
        const resVol = await API.get("/admin/volunteers?limit=500");
        const list =
          resVol?.data?.volunteers ||
          resVol?.data?.data ||
          (Array.isArray(resVol?.data) ? resVol.data : null);
        if (Array.isArray(list) && list.length > 0) {
          const matched = list.filter(
            (v) =>
              String(v.invitedBy) === String(targetId) ||
              String(v.group_id) === String(targetId)
          );
          if (matched.length > 0) {
            fetched = matched;
          }
        }
      } catch (err) {
        // ignore
      }
    }

    // Strategy 6: /volunteers?limit=500 (filter by invitedBy)
    if (!fetched || fetched.length === 0) {
      try {
        const resVol = await API.get("/volunteers?limit=500");
        const list =
          resVol?.data?.volunteers ||
          resVol?.data?.data ||
          (Array.isArray(resVol?.data) ? resVol.data : null);
        if (Array.isArray(list) && list.length > 0) {
          const matched = list.filter(
            (v) =>
              String(v.invitedBy) === String(targetId) ||
              String(v.group_id) === String(targetId)
          );
          if (matched.length > 0) {
            fetched = matched;
          }
        }
      } catch (err) {
        // ignore
      }
    }

    setMembers(fetched || []);
    setMembersLoading(false);
  };

  useEffect(() => {
    let isMounted = true;
    if (!stateGroup) setLoading(true);
    setError(null);

    const fetchDetail = async () => {
      let resolvedGroup = null;

      // Strategy 1: /admin/volunteer-group/:id
      try {
        const res1 = await API.get(`/admin/volunteer-group/${id}`);
        resolvedGroup = extractGroupFromResponse(res1?.data, id);
      } catch (err1) {
        console.warn("Strategy 1 (/admin/volunteer-group/:id) failed:", err1?.message);
      }

      // Strategy 2: /volunteer-group/:id
      if (!resolvedGroup) {
        try {
          const res2 = await API.get(`/volunteer-group/${id}`);
          resolvedGroup = extractGroupFromResponse(res2?.data, id);
        } catch (err2) {
          console.warn("Strategy 2 (/volunteer-group/:id) failed:", err2?.message);
        }
      }

      // Strategy 3: /admin/volunteer-groups list
      if (!resolvedGroup) {
        try {
          const res3 = await API.get("/admin/volunteer-groups?limit=100");
          resolvedGroup = extractGroupFromResponse(res3?.data, id);
        } catch (err3) {
          console.warn("Strategy 3 (/admin/volunteer-groups) failed:", err3?.message);
        }
      }

      if (!isMounted) return;

      if (resolvedGroup) {
        setGroup(resolvedGroup);
        if (resolvedGroup.missions && Array.isArray(resolvedGroup.missions)) {
          setMissions(resolvedGroup.missions);
        }
      } else if (!stateGroup) {
        setError("Volunteer Group not found");
      }

      setLoading(false);

      // Now fetch members using all available fallback strategies
      await fetchGroupMembers(id, resolvedGroup || stateGroup);
    };

    fetchDetail();

    return () => {
      isMounted = false;
    };
  }, [id, stateGroup]);

  // Filter linked missions by search term
  const filteredMissions = (missions || []).filter((m) => {
    if (!missionSearch) return true;
    const term = missionSearch.toLowerCase();
    const nameMatch = m.name?.toLowerCase().includes(term);
    const orgMatch = m.company_name?.toLowerCase().includes(term);
    const statusMatch = m.status?.toLowerCase().includes(term);
    const assignedMatch = m.assigned_by_details?.name?.toLowerCase().includes(term);
    return nameMatch || orgMatch || statusMatch || assignedMatch;
  });

  const extractMemberInfo = (m) => {
    if (!m) return null;
    if (typeof m === "string" || typeof m === "number") {
      return {
        id: m,
        name: `Member #${m}`,
        email: "",
        phone: "",
        image: "",
        role: "Member",
        status: "ACTIVE",
        points: 0,
        location: "",
        joinedDate: null,
      };
    }

    const userObj = m.user || m.volunteer || {};
    const id = m.id || m.user_id || m.volunteer_id || userObj.id;
    const name =
      m.name ||
      userObj.name ||
      [m.first_name || userObj.first_name, m.last_name || userObj.last_name]
        .filter(Boolean)
        .join(" ") ||
      "Volunteer Member";
    const email = m.email || userObj.email || "";
    const phone =
      m.contact_no || m.phone || userObj.contact_no || userObj.phone || "";
    const image = m.image || m.avatar || userObj.image || userObj.avatar || "";
    const role =
      m.group_role ||
      m.role ||
      userObj.role ||
      m.pivot?.role ||
      m.type ||
      userObj.type ||
      "Member";
    const status = m.status || userObj.status || m.membership_status || "ACTIVE";
    const points = m.points ?? userObj.points ?? m.volunteer_points ?? 0;
    const location =
      [
        m.city || userObj.city,
        m.state || userObj.state,
        m.country || userObj.country,
      ]
        .filter(Boolean)
        .join(", ") || "";
    const joinedDate =
      m.joined_at ||
      m.created_at ||
      m.createdAt ||
      userObj.created_at ||
      userObj.createdAt;

    return {
      id,
      name,
      email,
      phone,
      image,
      role,
      status,
      points,
      location,
      joinedDate,
    };
  };

  // Filter group members by search term
  const filteredMembers = (members || []).filter((rawMember) => {
    if (!memberSearch) return true;
    const info = extractMemberInfo(rawMember);
    if (!info) return false;
    const term = memberSearch.toLowerCase();
    return (
      info.name?.toLowerCase().includes(term) ||
      info.email?.toLowerCase().includes(term) ||
      info.phone?.toLowerCase().includes(term) ||
      info.role?.toLowerCase().includes(term) ||
      info.location?.toLowerCase().includes(term) ||
      info.status?.toLowerCase().includes(term) ||
      String(info.id || "").includes(term)
    );
  });

  if (loading && !group) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-500">
        <Loader />
        <span className="mt-3 text-sm font-medium">Loading volunteer group details...</span>
      </div>
    );
  }

  if (error && !group) {
    return (
      <div className="max-w-4xl mx-auto p-6 mt-8">
        <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100">
          <div className="inline-block p-4 rounded-full bg-red-100 text-red-600 mb-3">
            <FaExclamationTriangle size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Error Loading Volunteer Group</h2>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => navigate("/volunteer-groups")}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold rounded-md transition"
            >
              Back to Volunteer Groups
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-admin_primary text-white text-xs font-semibold rounded-md hover:bg-opacity-90 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentGroup = group || {};

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/volunteer-groups")}
          className="inline-flex items-center gap-2 text-sm font-medium text-admin_text_grey hover:text-admin_primary transition bg-white px-3 py-1.5 rounded-md border border-gray-200 shadow-sm"
        >
          <FaArrowLeft size={13} />
          <span>Back to Volunteer Groups</span>
        </button>

        <span className="text-xs text-gray-500 font-mono">
          Group ID: #{currentGroup.id || id}
        </span>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            {currentGroup.image ? (
              <img
                src={currentGroup.image}
                alt={currentGroup.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-gray-100 shadow-md shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-admin_primary text-white flex items-center justify-center font-bold text-2xl shadow-md shrink-0">
                {getInitials(currentGroup.name)}
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                  {currentGroup.name || "Volunteer Group"}
                </h1>
                {getStatusBadge(currentGroup.status)}
              </div>

              {currentGroup.description && (
                <p className="text-sm text-gray-600 mt-1.5 max-w-2xl">
                  {currentGroup.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500">
                {currentGroup.email && (
                  <span className="flex items-center gap-1.5">
                    <FaEnvelope className="text-gray-400" />
                    <span>{currentGroup.email}</span>
                  </span>
                )}
                {currentGroup.contact_no && (
                  <span className="flex items-center gap-1.5">
                    <FaPhone className="text-gray-400" />
                    <span>{currentGroup.contact_no}</span>
                  </span>
                )}
                {(currentGroup.city || currentGroup.state || currentGroup.country) && (
                  <span className="flex items-center gap-1.5">
                    <FaMapMarkerAlt className="text-rose-500" />
                    <span>
                      {[currentGroup.city, currentGroup.state, currentGroup.country]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Role / Tag */}
          <div className="flex flex-row md:flex-col items-start md:items-end justify-between md:justify-center gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg">
              {currentGroup.role || currentGroup.type || "VOLUNTEER_GROUP"}
            </span>
            <span className="text-xs text-gray-400">
              Joined {formatDate(currentGroup.created_at)}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Points */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Points</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {currentGroup.points ?? 0}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <FaAward size={24} />
          </div>
        </div>

        {/* Invited Members */}
        <div
          onClick={() => setActiveTab("members")}
          className={classNames(
            "bg-white rounded-xl shadow-sm p-4 border transition cursor-pointer hover:shadow-md flex items-center justify-between",
            activeTab === "members"
              ? "border-indigo-500 ring-2 ring-indigo-200"
              : "border-gray-100"
          )}
          title="Click to view Group Members"
        >
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Members</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {currentGroup.members_count ?? members.length}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FaUsers size={24} />
          </div>
        </div>

        {/* Linked Missions */}
        <div
          onClick={() => setActiveTab("missions")}
          className={classNames(
            "bg-white rounded-xl shadow-sm p-4 border transition cursor-pointer hover:shadow-md flex items-center justify-between",
            activeTab === "missions"
              ? "border-blue-500 ring-2 ring-blue-200"
              : "border-gray-100"
          )}
          title="Click to view Linked Missions"
        >
          <div>
            <p className="text-xs text-gray-500 font-medium">Linked Missions</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {currentGroup.missions_count ?? missions.length}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FaTasks size={24} />
          </div>
        </div>

        {/* Location / Status */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium">Primary City</p>
            <p className="text-xl font-bold text-gray-900 mt-1 truncate max-w-[150px]">
              {currentGroup.city || "Not Set"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FaMapMarkerAlt size={22} />
          </div>
        </div>
      </div>

      {/* Group Information & Tabbed Missions / Members Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Group Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <h3 className="text-base font-bold text-gray-900 pb-3 border-b border-gray-100">
              Group Information
            </h3>
            <div className="mt-4 space-y-3.5 text-xs">
              <div>
                <span className="text-gray-400 block">Organization Name</span>
                <span className="font-semibold text-gray-800 text-sm">
                  {currentGroup.name || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">Email Address</span>
                <span className="font-medium text-gray-800 break-all">
                  {currentGroup.email || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">Contact Number</span>
                <span className="font-medium text-gray-800">
                  {currentGroup.contact_no || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">City</span>
                <span className="font-medium text-gray-800">
                  {currentGroup.city || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">State / Province</span>
                <span className="font-medium text-gray-800">
                  {currentGroup.state || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">Country</span>
                <span className="font-medium text-gray-800">
                  {currentGroup.country || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">Account Role</span>
                <span className="font-mono text-gray-800">
                  {currentGroup.role || "VOLUNTEER_GROUP"}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">Registration Date</span>
                <span className="text-gray-800">
                  {formatDateTime(currentGroup.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tabbed Content (Linked Missions & Group Members) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            {/* Header Tabs & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("missions")}
                  className={classNames(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition",
                    activeTab === "missions"
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  )}
                >
                  <FaTasks
                    className={
                      activeTab === "missions"
                        ? "text-admin_primary"
                        : "text-gray-400"
                    }
                  />
                  <span>Linked Missions</span>
                  <span className="text-xs px-2 py-0.2 rounded-full bg-blue-100 text-blue-800 font-bold">
                    {missions.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("members")}
                  className={classNames(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition",
                    activeTab === "members"
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  )}
                >
                  <FaUsers
                    className={
                      activeTab === "members"
                        ? "text-indigo-600"
                        : "text-gray-400"
                    }
                  />
                  <span>Group Members</span>
                  <span className="text-xs px-2 py-0.2 rounded-full bg-indigo-100 text-indigo-800 font-bold">
                    {membersLoading ? "..." : (members.length || currentGroup.members_count || 0)}
                  </span>
                </button>
              </div>

              {/* Search bar inside active tab */}
              {activeTab === "missions" && missions.length > 0 && (
                <div className="relative min-w-[200px]">
                  <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  <input
                    type="text"
                    value={missionSearch}
                    onChange={(e) => setMissionSearch(e.target.value)}
                    placeholder="Search linked missions..."
                    className="pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-md w-full focus:outline-none focus:ring-1 focus:ring-admin_primary"
                  />
                </div>
              )}

              {activeTab === "members" && members.length > 0 && !membersLoading && (
                <div className="relative min-w-[200px]">
                  <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search members..."
                    className="pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-md w-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>

            {/* Tab Body */}
            {activeTab === "members" ? (
              <div className="mt-4 space-y-4">
                {membersLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                    <Loader />
                    <span className="mt-3 text-sm font-medium">Loading group members...</span>
                  </div>
                ) : members.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    <FaUsers className="mx-auto text-4xl text-gray-300 mb-3" />
                    <h4 className="text-sm font-semibold text-gray-700">
                      No Members Found
                    </h4>
                    <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                      This volunteer group currently has no members registered or invited.
                    </p>
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    <p className="text-sm">
                      No members match your search query "{memberSearch}".
                    </p>
                    <button
                      onClick={() => setMemberSearch("")}
                      className="mt-2 text-xs text-admin_primary font-medium hover:underline"
                    >
                      Clear Search
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {filteredMembers.map((rawMember, idx) => {
                      const m = extractMemberInfo(rawMember);
                      if (!m) return null;
                      return (
                        <div
                          key={m.id || idx}
                          className="border border-gray-200 rounded-xl p-4 bg-white hover:border-indigo-300 hover:shadow-sm transition-all duration-150 flex flex-col justify-between"
                        >
                          <div>
                            {/* Member Top row: Avatar + Name + Status */}
                            <div className="flex items-start gap-3">
                              {m.image ? (
                                <img
                                  src={m.image}
                                  alt={m.name}
                                  className="w-11 h-11 rounded-full object-cover border border-gray-200 shrink-0"
                                />
                              ) : (
                                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                                  {getInitials(m.name)}
                                </div>
                              )}

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <h4
                                    className="font-semibold text-gray-800 text-sm truncate"
                                    title={m.name}
                                  >
                                    {m.name}
                                  </h4>
                                  {getStatusBadge(m.status)}
                                </div>

                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  {m.id && (
                                    <span className="text-[11px] font-mono text-gray-400">
                                      #{m.id}
                                    </span>
                                  )}
                                  <span className="px-1.5 py-0.2 text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
                                    {m.role}
                                  </span>
                                  {m.points !== undefined && m.points !== null && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                      <FaAward className="text-amber-500 text-[10px]" />
                                      {m.points} pts
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Member Contact Info Grid */}
                            <div className="mt-3 pt-2.5 border-t border-gray-100 space-y-1.5 text-xs text-gray-600">
                              {m.email && (
                                <div className="flex items-center gap-1.5">
                                  <FaEnvelope className="text-gray-400 shrink-0 text-[11px]" />
                                  <span className="truncate" title={m.email}>
                                    {m.email}
                                  </span>
                                </div>
                              )}
                              {m.phone && (
                                <div className="flex items-center gap-1.5">
                                  <FaPhone className="text-gray-400 shrink-0 text-[10px]" />
                                  <span>{m.phone}</span>
                                </div>
                              )}
                              {m.location && (
                                <div className="flex items-center gap-1.5">
                                  <FaMapMarkerAlt className="text-rose-500 shrink-0 text-[11px]" />
                                  <span className="truncate">{m.location}</span>
                                </div>
                              )}
                              {m.joinedDate && (
                                <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                                  <FaCalendarAlt className="shrink-0 text-[10px]" />
                                  <span>Joined {formatDate(m.joinedDate)}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Card bottom: Volunteer details link if id present */}
                          {m.id && (
                            <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-end">
                              <Link
                                to={`/volunteers/${m.id}`}
                                className="inline-flex items-center gap-1 text-xs text-admin_primary hover:underline font-semibold"
                              >
                                <span>Volunteer Profile</span>
                                <FaExternalLinkAlt size={10} />
                              </Link>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* Missions List */
              <div className="mt-4 space-y-4">
                {missions.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    <FaTasks className="mx-auto text-4xl text-gray-300 mb-3" />
                    <h4 className="text-sm font-semibold text-gray-700">
                      No Linked Missions
                    </h4>
                    <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                      This volunteer group currently has no missions linked to it.
                    </p>
                  </div>
                ) : filteredMissions.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    <p className="text-sm">
                      No missions match your search query "{missionSearch}".
                    </p>
                    <button
                      onClick={() => setMissionSearch("")}
                      className="mt-2 text-xs text-admin_primary font-medium hover:underline"
                    >
                      Clear Search
                    </button>
                  </div>
                ) : (
                  filteredMissions.map((mission, idx) => (
                    <div
                      key={mission.id || idx}
                      className="border border-gray-200 rounded-xl p-4.5 hover:border-admin_primary/50 transition-all bg-white shadow-sm hover:shadow"
                    >
                      {/* Mission Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/missions/${mission.id}`}
                              className="font-bold text-gray-900 text-base hover:text-admin_primary transition no-underline"
                            >
                              {mission.name || "Untitled Mission"}
                            </Link>
                            <span className="text-xs font-mono text-gray-400">
                              #{mission.id}
                            </span>
                            <span
                              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${getStatusClass(
                                mission.status
                              )}`}
                            >
                              {formatStatus(mission.status) || mission.status}
                            </span>
                          </div>

                          {mission.description && (
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {mission.description}
                            </p>
                          )}
                        </div>

                        {mission.points !== undefined && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 shrink-0">
                            <FaAward className="text-amber-500" />
                            {mission.points} Points
                          </span>
                        )}
                      </div>

                      {/* Mission Metadata Details */}
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-gray-50 p-3 rounded-lg border border-gray-100">
                        {/* Organization */}
                        <div className="flex items-center gap-2">
                          <FaBuilding className="text-gray-400 shrink-0" />
                          <span className="text-gray-500">Organization:</span>
                          <span className="font-semibold text-gray-800 truncate">
                            {mission.company_name ||
                              (mission.organization_id
                                ? `Org #${mission.organization_id}`
                                : "N/A")}
                          </span>
                          {mission.company_type && (
                            <span className="text-[10px] uppercase font-bold bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">
                              {mission.company_type}
                            </span>
                          )}
                        </div>

                        {/* Volunteer Required */}
                        {mission.volunteer_required !== undefined && (
                          <div className="flex items-center gap-2">
                            <FaUsers className="text-gray-400 shrink-0" />
                            <span className="text-gray-500">Volunteers Needed:</span>
                            <span className="font-semibold text-gray-800">
                              {mission.volunteer_required}
                            </span>
                          </div>
                        )}

                        {/* Schedule Start */}
                        {mission.start_time && (
                          <div className="flex items-center gap-2">
                            <FaCalendarAlt className="text-gray-400 shrink-0" />
                            <span className="text-gray-500">Starts:</span>
                            <span className="font-medium text-gray-800">
                              {formatDateTime(mission.start_time)}
                            </span>
                          </div>
                        )}

                        {/* Schedule End */}
                        {mission.end_time && (
                          <div className="flex items-center gap-2">
                            <FaClock className="text-gray-400 shrink-0" />
                            <span className="text-gray-500">Ends:</span>
                            <span className="font-medium text-gray-800">
                              {formatDateTime(mission.end_time)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Assigned By Section */}
                      <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-500 font-medium">Assigned By:</span>
                          {mission.assigned_by_details ? (
                            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-medium">
                              <FaUserCheck className="text-emerald-600 text-xs" />
                              <span className="font-semibold">
                                {mission.assigned_by_details.name}
                              </span>
                              {mission.assigned_by_details.email && (
                                <span className="text-emerald-700 text-[11px]">
                                  ({mission.assigned_by_details.email})
                                </span>
                              )}
                              <span className="text-[10px] uppercase px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900 font-bold">
                                {mission.assigned_by_details.role ||
                                  mission.assigned_by_details.type ||
                                  "ADMIN"}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs">
                              Direct Organization Mission (Not Assigned)
                            </span>
                          )}
                        </div>

                        {/* View full mission details link */}
                        <Link
                          to={`/missions/${mission.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-admin_primary hover:underline self-end sm:self-auto"
                        >
                          <span>View Mission</span>
                          <FaExternalLinkAlt size={10} />
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerGroupDetail;

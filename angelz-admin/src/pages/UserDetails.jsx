import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import API from "../utils/Config";
import Loader from "../component/Loader";
import classNames from "classnames";
import { getStatusClass, formatStatus } from "../utils/missionStatusUtils";
import {
  FaArrowLeft,
  FaBuilding,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaTasks,
  FaCheckCircle,
  FaClock,
  FaRegEye,
  FaExclamationTriangle,
  FaSearch,
  FaIdBadge,
} from "react-icons/fa";

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Try retrieving cached org from sessionStorage in case of page refresh
  const getCachedOrg = () => {
    try {
      const single = sessionStorage.getItem(`cached_org_${id}`);
      if (single) {
        const parsed = JSON.parse(single);
        if (parsed) return parsed;
      }

      const listRaw = sessionStorage.getItem("admin_orgs_cache");
      if (listRaw) {
        const list = JSON.parse(listRaw);
        if (Array.isArray(list)) {
          const match = list.find(
            (o) =>
              String(o.id) === String(id) ||
              String(o._id) === String(id) ||
              String(o.organization_id) === String(id) ||
              String(o.user_id) === String(id)
          );
          if (match) return match;
        }
      }
    } catch (e) {
      // ignore
    }
    return null;
  };

  const initialCached = getCachedOrg();
  const stateOrg =
    location.state?.org &&
    String(
      location.state.org._id ||
      location.state.org.id ||
      location.state.org.organization_id ||
      location.state.org.user_id
    ) === String(id)
      ? location.state.org
      : initialCached;

  const [user, setUser] = useState(stateOrg);
  const [missions, setMissions] = useState(stateOrg?.missions || []);
  const [loading, setLoading] = useState(!stateOrg);
  const [error, setError] = useState(null);
  const [missionSearch, setMissionSearch] = useState("");

  // Save to cache whenever user changes
  useEffect(() => {
    if (user && id) {
      try {
        sessionStorage.setItem(`cached_org_${id}`, JSON.stringify(user));
      } catch (e) {}
    }
  }, [user, id]);

  // Reset user and missions when route id or stateOrg changes
  useEffect(() => {
    const currentCached = getCachedOrg();
    const active = stateOrg || currentCached;
    setUser(active);
    setMissions(active?.missions || []);
    setLoading(!active);
    setError(null);
  }, [id]);

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name) => {
    if (!name) return "O";
    return name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const getOrgStatusBadge = (status, isApproved) => {
    const stat = (status || isApproved || "pending").toString().toLowerCase();
    if (stat === "active" || stat === "approved" || stat === "1" || stat === "true") {
      return {
        label: "Active",
        className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      };
    }
    if (stat === "inactive" || stat === "blocked" || stat === "0" || stat === "false") {
      return {
        label: "Inactive",
        className: "bg-rose-50 text-rose-700 border border-rose-200",
      };
    }
    return {
      label: "Pending",
      className: "bg-amber-50 text-amber-700 border border-amber-200",
    };
  };

  const extractOrgFromResponse = (resData, targetId) => {
    if (!resData) return null;

    const matchesId = (obj) => {
      if (!obj || typeof obj !== "object") return false;
      return (
        String(obj._id) === String(targetId) ||
        String(obj.id) === String(targetId) ||
        String(obj.organization_id) === String(targetId) ||
        String(obj.user_id) === String(targetId) ||
        String(obj.userId) === String(targetId) ||
        String(obj.org_id) === String(targetId)
      );
    };

    // If resData itself has matching ID
    if (matchesId(resData)) return resData;

    // Check resData.organization
    if (matchesId(resData.organization)) return resData.organization;

    // Check resData.data if it's a single object
    if (resData.data && typeof resData.data === "object" && !Array.isArray(resData.data)) {
      if (matchesId(resData.data)) return resData.data;
      if (matchesId(resData.data.organization)) return resData.data.organization;
      if (matchesId(resData.data.user)) return resData.data.user;
    }

    // Check resData.user
    if (matchesId(resData.user)) return resData.user;

    // Search in array lists
    const list =
      (Array.isArray(resData.organizations) ? resData.organizations : null) ||
      (Array.isArray(resData.data?.organizations) ? resData.data.organizations : null) ||
      (Array.isArray(resData.data) ? resData.data : null) ||
      (Array.isArray(resData) ? resData : null) ||
      (Array.isArray(resData.users) ? resData.users : null);

    if (list && list.length > 0) {
      const match = list.find((item) => matchesId(item));
      if (match) return match;
    }

    // Direct object with org properties from a targeted detail endpoint
    const candidate =
      resData.organization ||
      resData.data?.organization ||
      resData.data?.user ||
      (resData.data && !Array.isArray(resData.data) ? resData.data : null) ||
      (typeof resData === "object" && !Array.isArray(resData) ? resData : null);

    if (candidate && (candidate.company_name || candidate.organization_name || candidate.business_name || candidate.email || candidate.name)) {
      return candidate;
    }

    return null;
  };

  useEffect(() => {
    let isMounted = true;
    const currentCached = getCachedOrg();
    const active = stateOrg || currentCached;

    if (!active) {
      setLoading(true);
    }
    setError(null);

    const fetchOrgData = async () => {
      let resolvedOrg = null;
      console.log(`[UserDetails] Fetching details for organization ID: ${id}`);

      // Strategy 1: /admin/organization/:id (singular)
      try {
        const res1 = await API.get(`/admin/organization/${id}`);
        console.log("[UserDetails] Strategy 1 response:", res1?.data);
        resolvedOrg = extractOrgFromResponse(res1?.data, id);
      } catch (err1) {
        console.warn("[UserDetails] Strategy 1 (/admin/organization/:id) failed:", err1?.response?.status || err1?.message);
      }

      // Strategy 1b: /admin/organizations/:id (plural)
      if (!resolvedOrg) {
        try {
          const res1b = await API.get(`/admin/organizations/${id}`);
          console.log("[UserDetails] Strategy 1b response:", res1b?.data);
          resolvedOrg = extractOrgFromResponse(res1b?.data, id);
        } catch (err1b) {
          console.warn("[UserDetails] Strategy 1b (/admin/organizations/:id) failed:", err1b?.response?.status || err1b?.message);
        }
      }

      // Strategy 1c: /admin/user/:id or /admin/users/:id
      if (!resolvedOrg) {
        try {
          const res1c = await API.get(`/admin/user/${id}`);
          console.log("[UserDetails] Strategy 1c response:", res1c?.data);
          resolvedOrg = extractOrgFromResponse(res1c?.data, id);
        } catch (err1c) {
          // ignore
        }
      }

      // Strategy 2: /organization/:id (public route)
      if (!resolvedOrg) {
        try {
          const res2 = await API.get(`/organization/${id}`);
          console.log("[UserDetails] Strategy 2 response:", res2?.data);
          resolvedOrg = extractOrgFromResponse(res2?.data, id);
        } catch (err2) {
          console.warn("[UserDetails] Strategy 2 failed:", err2?.response?.status || err2?.message);
        }
      }

      // Strategy 3: /admin/organizations search query
      if (!resolvedOrg) {
        try {
          const resSearch = await API.get(`/admin/organizations`, { params: { search: id } });
          console.log("[UserDetails] Strategy 3 search response:", resSearch?.data);
          resolvedOrg = extractOrgFromResponse(resSearch?.data, id);
        } catch (errSearch) {
          // ignore
        }
      }

      // Strategy 4: /admin/organizations list and match by ID (check unpaginated or scan pages)
      if (!resolvedOrg) {
        try {
          const res3 = await API.get(`/admin/organizations`, { params: { limit: 100 } });
          console.log("[UserDetails] Strategy 4 list response:", res3?.data);
          resolvedOrg = extractOrgFromResponse(res3?.data, id);

          // If still not found and there are more pages, check up to page 5
          const totalPages = res3?.data?.totalPages || res3?.data?.pages || 1;
          if (!resolvedOrg && totalPages > 1) {
            for (let p = 2; p <= Math.min(totalPages, 5); p++) {
              try {
                const resNext = await API.get(`/admin/organizations`, { params: { page: p, limit: 100 } });
                resolvedOrg = extractOrgFromResponse(resNext?.data, id);
                if (resolvedOrg) break;
              } catch (e) {
                break;
              }
            }
          }
        } catch (err3) {
          console.warn("[UserDetails] Strategy 4 failed:", err3?.response?.status || err3?.message);
        }
      }

      // Fallback: check sessionStorage cache from list page
      if (!resolvedOrg) {
        resolvedOrg = getCachedOrg();
      }

      if (!isMounted) return;

      const targetOrg = resolvedOrg || active;
      if (resolvedOrg) {
        console.log("[UserDetails] Successfully resolved organization:", resolvedOrg);
        setUser(resolvedOrg);
        try {
          sessionStorage.setItem(`cached_org_${id}`, JSON.stringify(resolvedOrg));
        } catch (e) {}
        // Use ONLY the specific missions belonging to this organization returned by the API
        setMissions(Array.isArray(resolvedOrg.missions) ? resolvedOrg.missions : []);
      } else if (!active) {
        console.error(`[UserDetails] Organization #${id} could not be resolved from any endpoint.`);
        setError("Organization not found");
      }
      setLoading(false);
    };

    fetchOrgData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Loading State
  if (loading && !user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader />
        <p className="mt-3 text-sm text-gray-500 font-medium">Loading organization details...</p>
      </div>
    );
  }

  // Error State
  if (error && !user) {
    return (
      <div className="max-w-4xl mx-auto my-8 p-6 bg-white rounded-xl shadow-sm border border-red-200">
        <div className="flex items-center gap-3 text-red-600 mb-3">
          <FaExclamationTriangle className="text-2xl" />
          <h2 className="text-lg font-semibold">Failed to Load Organization</h2>
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
            onClick={() => navigate("/organizations")}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
          >
            Back to Organizations
          </button>
        </div>
      </div>
    );
  }

  // Not Found State
  if (!user || (!user.id && !user.company_name && !user.email)) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-xl shadow-sm text-center border border-gray-100">
        <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
          <FaBuilding />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Organization Not Found</h2>
        <p className="text-gray-500 text-sm mb-6">
          The requested organization could not be found or may have been deleted.
        </p>
        <button
          onClick={() => navigate("/organizations")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-admin_primary text-white rounded-lg hover:opacity-90 transition text-sm font-medium no-underline"
        >
          <FaArrowLeft size={14} /> Back to Organizations
        </button>
      </div>
    );
  }

  const statusInfo = getOrgStatusBadge(user.status, user.isApproved);
  const companyName = user.company_name || user.name || "No Company Name";

  const totalMissions = missions.length;
  const activeMissions = missions.filter(
    (m) => m.status === "active" || m.status === "open" || m.status === "inprogress"
  ).length;
  const completedMissions = missions.filter((m) => m.status === "completed").length;

  const filteredMissions = missions.filter((m) => {
    if (!missionSearch) return true;
    const term = missionSearch.toLowerCase();
    const nameMatch = m.name?.toLowerCase().includes(term);
    const descMatch = m.description?.toLowerCase().includes(term);
    const typeMatch = m.mission_type?.toLowerCase().includes(term);
    const statusMatch = m.status?.toLowerCase().includes(term);
    return nameMatch || descMatch || typeMatch || statusMatch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <button
          onClick={() => navigate("/organizations")}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-admin_primary transition w-fit bg-transparent border-none p-0 cursor-pointer"
        >
          <FaArrowLeft size={14} />
          <span>Back to Organizations</span>
        </button>

        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Organization ID: #{user.id || id}
        </span>
      </div>

      {/* Header Banner Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-admin_primary to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md flex-shrink-0">
              {getInitials(companyName)}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 capitalize tracking-tight m-0">
                  {companyName}
                </h1>
                {/* <span
                  className={classNames(
                    "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide",
                    statusInfo.className
                  )}
                >
                  {statusInfo.label}
                </span> */}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                {user.company_type && (
                  <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-md text-xs font-medium">
                    {user.company_type}
                  </span>
                )}
                {user.email && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                    <FaEnvelope className="text-gray-400" />
                    <span>{user.email}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metric Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Missions */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 m-0">Total Missions</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1 mb-0">{totalMissions}</h3>
            <p className="text-xs text-gray-500 mt-1 mb-0">Missions posted</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
            <FaTasks />
          </div>
        </div>

        {/* Active / Ongoing Missions */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 m-0">Active Missions</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1 mb-0">{activeMissions}</h3>
            <p className="text-xs text-emerald-600 font-medium mt-1 mb-0">In progress / Open</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
            <FaClock />
          </div>
        </div>

        {/* Completed Missions */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 m-0">Completed</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1 mb-0">{completedMissions}</h3>
            <p className="text-xs text-purple-600 font-medium mt-1 mb-0">Successfully finished</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl">
            <FaCheckCircle />
          </div>
        </div>

        {/* Company Type */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 m-0">Sector / Type</p>
            <h3 className="text-base font-bold text-gray-900 mt-1 mb-0 truncate max-w-[140px]">
              {user.company_type || "Organization"}
            </h3>
            <p className="text-xs text-gray-500 mt-1 mb-0">Registered entity</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl">
            <FaIdBadge />
          </div>
        </div>
      </div>

      {/* Main Content: Left (Missions) & Right (Profile Details) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Missions List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 p-6 gap-4">
              <div>
                <h2 className="text-base font-bold text-gray-900 m-0">Missions by this Organization</h2>
                <p className="text-xs text-gray-400 mt-1 mb-0">
                  {totalMissions} total mission{totalMissions === 1 ? "" : "s"} recorded
                </p>
              </div>

              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="text"
                  value={missionSearch}
                  onChange={(e) => setMissionSearch(e.target.value)}
                  placeholder="Search missions..."
                  className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-admin_primary w-full sm:w-56"
                />
              </div>
            </div>

            {/* Table */}
            <div className="p-6">
              {filteredMissions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
                    <FaTasks />
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    {missionSearch ? "No matching missions found" : "No missions available"}
                  </p>
                  <p className="text-xs text-gray-400 m-0">
                    {missionSearch
                      ? "Try searching with a different term."
                      : "This organization has not created any missions yet."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100 text-sm">
                    <thead>
                      <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <th className="pb-3 font-semibold">#</th>
                        <th className="pb-3 font-semibold">Mission Name</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold">Start Time</th>
                        <th className="pb-3 font-semibold">End Time</th>
                        <th className="pb-3 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredMissions.map((mission, index) => (
                        <tr key={mission.id || index} className="hover:bg-gray-50/70 transition">
                          <td className="py-3 pr-2 text-xs text-gray-400 font-mono">
                            {index + 1}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-gray-900 block max-w-xs truncate">
                              {mission.name || "Untitled Mission"}
                            </span>
                            {mission.mission_type && (
                              <span className="text-xs text-gray-400 block mt-0.5 capitalize">
                                {mission.mission_type}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={classNames(
                                "px-2.5 py-0.5 rounded text-xs font-semibold whitespace-nowrap",
                                getStatusClass(mission.status)
                              )}
                            >
                              {formatStatus(mission.status)}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-xs text-gray-600 whitespace-nowrap">
                            {formatDateTime(mission.start_time)}
                          </td>
                          <td className="py-3 px-3 text-xs text-gray-600 whitespace-nowrap">
                            {formatDateTime(mission.end_time)}
                          </td>
                          <td className="py-3 pl-3 text-right whitespace-nowrap">
                            {mission.id ? (
                              <Link
                                to={`/missions/${mission.id}`}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 hover:bg-admin_primary hover:text-white text-gray-700 rounded-md text-xs font-medium transition no-underline"
                              >
                                <FaRegEye size={12} />
                                <span>View</span>
                              </Link>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Organization Contact & Details */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100 m-0">
              <FaBuilding className="text-admin_primary" />
              <span>Contact & Profile</span>
            </h2>

            <div className="space-y-3.5 text-sm">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">Company Name</span>
                <span className="font-semibold text-gray-900 block mt-0.5">{companyName}</span>
              </div>

              {user.company_type && (
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">Company Type</span>
                  <span className="text-gray-700 block mt-0.5">{user.company_type}</span>
                </div>
              )}

              {user.email && (
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">Email</span>
                  <span className="text-gray-700 flex items-center gap-1.5 mt-0.5">
                    <FaEnvelope className="text-gray-400 text-xs" />
                    <a href={`mailto:${user.email}`} className="text-gray-700 hover:text-admin_primary no-underline break-all">
                      {user.email}
                    </a>
                  </span>
                </div>
              )}

              {user.contact_no && (
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">Contact Phone</span>
                  <span className="text-gray-700 flex items-center gap-1.5 mt-0.5">
                    <FaPhone className="text-gray-400 text-xs" />
                    <span>{user.contact_no}</span>
                  </span>
                </div>
              )}

              {user.address && (
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">Address</span>
                  <span className="text-gray-700 flex items-start gap-1.5 mt-0.5">
                    <FaMapMarkerAlt className="text-gray-400 text-xs mt-1 flex-shrink-0" />
                    <span>{user.address}</span>
                  </span>
                </div>
              )}

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">Status</span>
                <span className="mt-1 inline-block">
                  <span
                    className={classNames(
                      "px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wide",
                      statusInfo.className
                    )}
                  >
                    {statusInfo.label}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetails;

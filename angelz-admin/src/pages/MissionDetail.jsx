import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import API from "../utils/Config";
import Loader from "../component/Loader";
import classNames from "classnames";
import { getStatusClass, formatStatus } from "../utils/missionStatusUtils";
import {
  FaArrowLeft,
  FaUsers,
  FaUserCheck,
  FaUserClock,
  FaAward,
  FaBuilding,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaEnvelope,
  FaPhone,
  FaRegEye,
  FaExclamationTriangle,
  FaExternalLinkAlt,
  FaSearch,
} from "react-icons/fa";

const MissionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const stateMission = location.state?.mission;

  const [activeVolunteerTab, setActiveVolunteerTab] = useState("assigned");
  const [volunteerSearch, setVolunteerSearch] = useState("");
  const [fetchedOrg, setFetchedOrg] = useState(null);

  // API: /admin/mission/:id
  const { data, loading, error, refetch } = useFetch(`/admin/mission/${id}`);

  const rawMission = data?.data?.mission || data?.mission || data?.data || data || {};
  const mission = { ...stateMission, ...rawMission };

  // Helper to normalize strings for robust comparison
  const cleanStr = (str) =>
    (str || "")
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, "");

  const isOrgNameMatch = (candidate, targetName) => {
    if (!candidate || !targetName) return false;
    const target = cleanStr(targetName);
    if (!target) return false;

    const candidateNames = [
      candidate.company_name,
      candidate.name,
      candidate.organization_name,
      candidate.title,
      candidate.business_name,
    ]
      .filter(Boolean)
      .map(cleanStr);

    return candidateNames.some(
      (c) => c === target || (c.length > 3 && (c.includes(target) || target.includes(c)))
    );
  };

  // Resolve the true organization name from mission fields
  const orgName =
    mission?.company_name ||
    stateMission?.company_name ||
    mission?.organization_name ||
    stateMission?.organization_name ||
    (typeof mission?.organization === "string" && mission.organization !== "No Organization"
      ? mission.organization
      : null) ||
    mission?.organization?.company_name ||
    mission?.organization?.name ||
    fetchedOrg?.company_name ||
    fetchedOrg?.name ||
    null;

  // Extract direct organization candidate from API (strictly excluding mission.user)
  const directOrgCandidate =
    (data?.organization && typeof data.organization === "object" && !Array.isArray(data.organization)
      ? data.organization
      : null) ||
    (data?.data?.organization && typeof data.data.organization === "object" && !Array.isArray(data.data.organization)
      ? data.data.organization
      : null) ||
    (mission?.organization && typeof mission.organization === "object" && !Array.isArray(mission.organization)
      ? mission.organization
      : null) ||
    (mission?.organization_details && typeof mission.organization_details === "object"
      ? mission.organization_details
      : null) ||
    null;

  // Only consider directOrg valid IF it genuinely matches orgName
  const validDirectOrg =
    directOrgCandidate && (!orgName || isOrgNameMatch(directOrgCandidate, orgName))
      ? directOrgCandidate
      : null;

  // Search and match organization from /admin/organizations
  useEffect(() => {
    let isMounted = true;
    if (!orgName) return;

    const searchOrg = async () => {
      try {
        // 1. Try search endpoint with orgName
        const resSearch = await API.get("/admin/organizations", {
          params: { search: orgName },
        });
        const list1 =
          resSearch?.data?.organizations ||
          resSearch?.data?.data ||
          resSearch?.data ||
          [];
        if (Array.isArray(list1)) {
          const match1 = list1.find((o) => isOrgNameMatch(o, orgName));
          if (match1 && isMounted) {
            setFetchedOrg(match1);
            return;
          }
        }

        // 2. Try first significant word search if multiple words (e.g. "Helping" from "Helping Hands Foundation")
        const firstWord = orgName.trim().split(/\s+/)[0];
        if (firstWord && firstWord.length > 2 && firstWord.toLowerCase() !== orgName.toLowerCase()) {
          const resWord = await API.get("/admin/organizations", {
            params: { search: firstWord },
          });
          const listWord =
            resWord?.data?.organizations ||
            resWord?.data?.data ||
            resWord?.data ||
            [];
          if (Array.isArray(listWord)) {
            const matchWord = listWord.find((o) => isOrgNameMatch(o, orgName));
            if (matchWord && isMounted) {
              setFetchedOrg(matchWord);
              return;
            }
          }
        }

        // 3. Try general organizations list
        const resAll = await API.get("/admin/organizations", {
          params: { limit: 100 },
        });
        const list2 =
          resAll?.data?.organizations ||
          resAll?.data?.data ||
          resAll?.data ||
          [];
        if (Array.isArray(list2)) {
          const match2 = list2.find((o) => isOrgNameMatch(o, orgName));
          if (match2 && isMounted) {
            setFetchedOrg(match2);
            return;
          }
        }
      } catch (err) {
        console.warn("Could not match organization from organizations list:", err);
      }
    };

    searchOrg();

    return () => {
      isMounted = false;
    };
  }, [orgName]);

  const activeOrg =
    fetchedOrg ||
    validDirectOrg ||
    (orgName
      ? {
          company_name: orgName,
          name: orgName,
        }
      : {});

  // Resolved Org ID:
  // Must belong strictly to the matched organization.
  // Never fallback to mission.organization_id or mission.user_id unless verified to match orgName!
  const matchedOrgId =
    fetchedOrg?.id ||
    fetchedOrg?.organization_id ||
    validDirectOrg?.id ||
    validDirectOrg?.organization_id ||
    null;

  const orgId = matchedOrgId || (orgName ? orgName : null);

  const orgEmail = activeOrg.email || (validDirectOrg && (mission?.organization_email || mission?.company_email));
  const orgContact = activeOrg.contact_no || activeOrg.phone || (validDirectOrg && (mission?.contact_no || mission?.organization_phone));
  const orgAddress = activeOrg.address || (validDirectOrg && (mission?.organization_address || mission?.address));
  const orgType = activeOrg.company_type || activeOrg.type || (validDirectOrg && mission?.company_type);

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
    if (!name) return "V";
    return name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader />
        <p className="mt-3 text-sm text-gray-500 font-medium">Loading mission details...</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="max-w-4xl mx-auto my-8 p-6 bg-white rounded-xl shadow-sm border border-red-200">
        <div className="flex items-center gap-3 text-red-600 mb-3">
          <FaExclamationTriangle className="text-2xl" />
          <h2 className="text-lg font-semibold">Failed to Load Mission</h2>
        </div>
        <p className="text-gray-600 mb-4">{error}</p>
        <div className="flex gap-3">
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-admin_primary text-white rounded-lg hover:opacity-90 transition text-sm font-medium"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate("/missions")}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
          >
            Back to Missions
          </button>
        </div>
      </div>
    );
  }

  // Not Found State
  if (!mission || (!mission.id && !mission.name)) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-xl shadow-sm text-center border border-gray-100">
        <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
          <FaExclamationTriangle />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Mission Not Found</h2>
        <p className="text-gray-500 text-sm mb-6">
          The requested mission could not be found or may have been deleted.
        </p>
        <button
          onClick={() => navigate("/missions")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-admin_primary text-white rounded-lg hover:opacity-90 transition text-sm font-medium no-underline"
        >
          <FaArrowLeft size={14} /> Back to Missions
        </button>
      </div>
    );
  }

  const assignedVolunteers = mission.assigned_volunteers || [];
  const appliedVolunteers = mission.applied_volunteers || [];

  const requiredCount = Number(mission.volunteer_required) || 0;
  const assignedCount = Number(mission.assigned_count ?? assignedVolunteers.length) || 0;
  const appliedCount = Number(mission.applied_count ?? appliedVolunteers.length) || 0;
  const points = mission.points ?? 0;

  const currentVolunteers = activeVolunteerTab === "assigned" ? assignedVolunteers : appliedVolunteers;
  const filteredVolunteers = currentVolunteers.filter((vol) => {
    if (!volunteerSearch) return true;
    const term = volunteerSearch.toLowerCase();
    const nameMatch = vol.name?.toLowerCase().includes(term);
    const emailMatch = vol.email?.toLowerCase().includes(term);
    return nameMatch || emailMatch;
  });

  const progressPercent = requiredCount > 0 ? Math.min(Math.round((assignedCount / requiredCount) * 100), 100) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <button
          onClick={() => navigate("/missions")}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-admin_primary transition w-fit bg-transparent border-none p-0 cursor-pointer"
        >
          <FaArrowLeft size={14} />
          <span>Back to Missions</span>
        </button>

        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Mission ID: #{mission.id}
        </span>
      </div>

      {/* Header Banner Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 capitalize tracking-tight m-0">
                {mission.name || "Untitled Mission"}
              </h1>
              <span
                className={classNames(
                  "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide",
                  getStatusClass(mission.status)
                )}
              >
                {formatStatus(mission.status)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              {mission.mission_type && (
                <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-md text-xs font-medium">
                  {mission.mission_type}
                </span>
              )}
              {orgName && (
                <span className="inline-flex items-center gap-1.5">
                  <FaBuilding className="text-gray-400" />
                  {orgId ? (
                    <Link
                      to={`/organizations/${encodeURIComponent(orgId)}`}
                      state={{ org: activeOrg }}
                      className="text-admin_primary font-medium hover:underline no-underline"
                    >
                      {orgName}
                    </Link>
                  ) : (
                    <span>{orgName}</span>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Key Metric Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Required Volunteers */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 m-0">Required</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1 mb-0">{requiredCount}</h3>
            <p className="text-xs text-gray-500 mt-1 mb-0">Volunteers needed</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
            <FaUsers />
          </div>
        </div>

        {/* Assigned Volunteers */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 m-0">Assigned</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1 mb-0">{assignedCount}</h3>
            <p className="text-xs text-emerald-600 font-medium mt-1 mb-0">{progressPercent}% filled</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
            <FaUserCheck />
          </div>
        </div>

        {/* Applied Volunteers */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 m-0">Applied</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1 mb-0">{appliedCount}</h3>
            <p className="text-xs text-gray-500 mt-1 mb-0">Total applicants</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl">
            <FaUserClock />
          </div>
        </div>

        {/* Points Rewarded */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 m-0">Points</p>
            <h3 className="text-2xl font-bold text-purple-700 mt-1 mb-0">{points}</h3>
            <p className="text-xs text-gray-500 mt-1 mb-0">Points per volunteer</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl">
            <FaAward />
          </div>
        </div>
      </div>

      {/* Main Content: Left & Right Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Details & Volunteers */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mission Overview & Description */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-2">Description</h2>
              <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-line m-0">
                {mission.description || "No description provided for this mission."}
              </p>
            </div>

            {/* Capacity Progress Bar */}
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs font-medium text-gray-600 mb-1.5">
                <span>Volunteer Recruitment Progress</span>
                <span className="font-semibold text-gray-900">
                  {assignedCount} of {requiredCount} assigned
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-admin_primary h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Volunteers Tabs & Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Tabs Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 px-6 pt-4 pb-0 gap-3">
              <div className="flex gap-6">
                <button
                  type="button"
                  onClick={() => {
                    setActiveVolunteerTab("assigned");
                    setVolunteerSearch("");
                  }}
                  className={classNames(
                    "pb-3 text-sm font-semibold transition border-b-2 bg-transparent cursor-pointer border-x-0 border-t-0 p-0",
                    activeVolunteerTab === "assigned"
                      ? "border-admin_primary text-admin_primary"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  )}
                >
                  Assigned Volunteers ({assignedVolunteers.length})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveVolunteerTab("applied");
                    setVolunteerSearch("");
                  }}
                  className={classNames(
                    "pb-3 text-sm font-semibold transition border-b-2 bg-transparent cursor-pointer border-x-0 border-t-0 p-0",
                    activeVolunteerTab === "applied"
                      ? "border-admin_primary text-admin_primary"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  )}
                >
                  Applied Volunteers ({appliedVolunteers.length})
                </button>
              </div>

              {/* Volunteer Search */}
              <div className="pb-3">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  <input
                    type="text"
                    value={volunteerSearch}
                    onChange={(e) => setVolunteerSearch(e.target.value)}
                    placeholder="Search volunteer..."
                    className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-admin_primary w-48 sm:w-56"
                  />
                </div>
              </div>
            </div>

            {/* Volunteers List / Table */}
            <div className="p-6">
              {filteredVolunteers.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-2 text-xl">
                    <FaUsers />
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    {volunteerSearch
                      ? "No matching volunteers found"
                      : activeVolunteerTab === "assigned"
                      ? "No volunteers assigned yet"
                      : "No volunteers applied yet"}
                  </p>
                  <p className="text-xs text-gray-400 m-0">
                    {volunteerSearch
                      ? "Try searching with a different name or email."
                      : activeVolunteerTab === "assigned"
                      ? "Assigned volunteers will show up here once approved."
                      : "Applicants will be listed here once volunteers register interest."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100 text-sm">
                    <thead>
                      <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <th className="pb-3 font-semibold">Volunteer</th>
                        <th className="pb-3 font-semibold">Email</th>
                        {activeVolunteerTab === "assigned" && (
                          <th className="pb-3 font-semibold text-center">Status</th>
                        )}
                        <th className="pb-3 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredVolunteers.map((vol, index) => (
                        <tr key={vol.id || index} className="hover:bg-gray-50/70 transition">
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-admin_primary to-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                                {getInitials(vol.name)}
                              </div>
                              <div>
                                <span className="font-semibold text-gray-900 block">
                                  {vol.name || "Unknown Volunteer"}
                                </span>
                                {vol.contact_no && (
                                  <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <FaPhone size={10} /> {vol.contact_no}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {vol.email || "—"}
                          </td>
                          {activeVolunteerTab === "assigned" && (
                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">
                                Assigned
                              </span>
                            </td>
                          )}
                          <td className="py-3 pl-4 text-right">
                            {vol.id ? (
                              <Link
                                to={`/volunteers/${vol.id}`}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 hover:bg-admin_primary hover:text-white text-gray-700 rounded-md text-xs font-medium transition no-underline"
                              >
                                <FaRegEye size={12} />
                                <span>Profile</span>
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

        {/* Right Column (1 Col): Organization & Schedule Info */}
        <div className="space-y-6">
          {/* Organization Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 m-0">
                <FaBuilding className="text-admin_primary" />
                <span>Organization</span>
              </h2>
              {orgId && (
                <Link
                  to={`/organizations/${orgId}`}
                  state={{ org: activeOrg }}
                  className="text-xs font-semibold text-admin_primary hover:underline inline-flex items-center gap-1 no-underline"
                >
                  <span>View</span>
                  <FaExternalLinkAlt size={10} />
                </Link>
              )}
            </div>

            {orgName ? (
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">Organization Name</span>
                  <span className="font-semibold text-gray-900 block mt-0.5">{orgName}</span>
                </div>

                {orgType && (
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">Company Type</span>
                    <span className="text-gray-700 block mt-0.5">{orgType}</span>
                  </div>
                )}

                {orgEmail && (
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">Email</span>
                    <span className="text-gray-700 flex items-center gap-1.5 mt-0.5">
                      <FaEnvelope className="text-gray-400 text-xs" />
                      <a href={`mailto:${orgEmail}`} className="text-gray-700 hover:text-admin_primary no-underline">
                        {orgEmail}
                      </a>
                    </span>
                  </div>
                )}

                {orgContact && (
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">Contact</span>
                    <span className="text-gray-700 flex items-center gap-1.5 mt-0.5">
                      <FaPhone className="text-gray-400 text-xs" />
                      <span>{orgContact}</span>
                    </span>
                  </div>
                )}

                {orgAddress && (
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">Address</span>
                    <span className="text-gray-700 flex items-start gap-1.5 mt-0.5">
                      <FaMapMarkerAlt className="text-gray-400 text-xs mt-1 flex-shrink-0" />
                      <span>{orgAddress}</span>
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <div className="w-10 h-10 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-2 text-lg">
                  <FaBuilding />
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Independent Mission</p>
                <p className="text-xs text-gray-400 m-0">This mission is not associated with an external organization.</p>
              </div>
            )}
          </div>

          {/* Schedule & Timing Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100 m-0">
              <FaCalendarAlt className="text-admin_primary" />
              <span>Schedule & Timeline</span>
            </h2>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FaClock size={14} />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">Start Time</span>
                  <span className="font-semibold text-gray-800 block mt-0.5">
                    {formatDateTime(mission.start_time)}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FaClock size={14} />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">End Time</span>
                  <span className="font-semibold text-gray-800 block mt-0.5">
                    {formatDateTime(mission.end_time)}
                  </span>
                </div>
              </div>

              {mission.location && (
                <div className="flex items-start gap-3 pt-2 border-t border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FaMapMarkerAlt size={14} />
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">Location</span>
                    <span className="text-gray-800 block mt-0.5">
                      {mission.location}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionDetail;
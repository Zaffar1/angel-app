import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaRegEye,
  FaUsers,
  FaAward,
  FaTasks,
  FaMapMarkerAlt,
  FaEnvelope,
  FaPhone,
  FaSearch,
  FaTimes,
  FaBuilding,
  FaCalendarAlt,
  FaUserCheck,
  FaExternalLinkAlt,
} from "react-icons/fa";
import Loader from "./Loader";
import classNames from "classnames";
import { getStatusClass, formatStatus } from "../utils/missionStatusUtils";
import API from "../utils/Config";

const VolunteerGroupTable = ({
  data = [],
  loading = false,
  error = null,
  page = 1,
  totalPages = 1,
  total = 0,
  limit = 10,
  onPageChange,
  limitChange,
  search = "",
  setSearch,
  status = "",
  setStatus,
  sortBy = "created_at",
  sortOrder = "desc",
  onSortChange,
  onResetFilters,
}) => {
  // Modal state for quick-viewing linked missions
  const [selectedGroupForMissions, setSelectedGroupForMissions] = useState(null);

  // Modal state for quick-viewing members
  const [selectedGroupForMembers, setSelectedGroupForMembers] = useState(null);
  const [membersLoading, setMembersLoading] = useState(false);
  const [groupMembersList, setGroupMembersList] = useState([]);
  const [memberSearch, setMemberSearch] = useState("");

  const handleOpenMembersModal = async (group) => {
    setSelectedGroupForMembers(group);
    setMemberSearch("");

    const directMembers =
      (Array.isArray(group.members) ? group.members : null) ||
      (Array.isArray(group.volunteers) ? group.volunteers : null) ||
      (Array.isArray(group.group_members) ? group.group_members : null) ||
      (Array.isArray(group.users) ? group.users : null) ||
      [];

    if (directMembers.length > 0) {
      setGroupMembersList(directMembers);
      setMembersLoading(false);
      return;
    }

    setGroupMembersList([]);
    setMembersLoading(true);

    try {
      let fetched = null;

      // Strategy 1: Dedicated group volunteers endpoint: /volunteer/volunteer-group/:id/volunteers
      try {
        const res = await API.get(`/volunteer/volunteer-group/${group.id}/volunteers`);
        const list =
          res?.data?.data ||
          res?.data?.volunteers ||
          (Array.isArray(res?.data) ? res.data : null);
        if (Array.isArray(list) && list.length > 0) {
          fetched = list;
        }
      } catch (err) {
        console.warn("Strategy 1 (/volunteer/volunteer-group/:id/volunteers) failed:", err?.message);
      }

      // Strategy 2: /volunteer-groups/volunteers (filter by invitedBy == group.id)
      if (!fetched) {
        try {
          const res = await API.get("/volunteer-groups/volunteers");
          const list =
            res?.data?.data ||
            res?.data?.volunteers ||
            (Array.isArray(res?.data) ? res.data : null);
          if (Array.isArray(list) && list.length > 0) {
            const matched = list.filter(
              (v) =>
                String(v.invitedBy) === String(group.id) ||
                String(v.group_id) === String(group.id)
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
      if (!fetched) {
        try {
          const res = await API.get(`/volunteer-group/${group.id}/volunteers`);
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
      if (!fetched) {
        try {
          const res1 = await API.get(`/admin/volunteer-group/${group.id}`);
          const data1 = res1?.data?.data || res1?.data?.volunteer_group || res1?.data;
          if (data1) {
            fetched =
              (Array.isArray(data1.members) ? data1.members : null) ||
              (Array.isArray(res1?.data?.members) ? res1.data.members : null) ||
              (Array.isArray(data1.volunteers) ? data1.volunteers : null) ||
              (Array.isArray(data1.group_members) ? data1.group_members : null) ||
              (Array.isArray(data1.users) ? data1.users : null);
          }
        } catch (err1) {
          // ignore
        }
      }

      // Strategy 5: /admin/volunteers?limit=100 (filter by invitedBy)
      if (!fetched) {
        try {
          const resVol = await API.get("/admin/volunteers?limit=100");
          const list =
            resVol?.data?.volunteers ||
            resVol?.data?.data ||
            (Array.isArray(resVol?.data) ? resVol.data : null);
          if (Array.isArray(list) && list.length > 0) {
            const matched = list.filter(
              (v) =>
                String(v.invitedBy) === String(group.id) ||
                String(v.group_id) === String(group.id)
            );
            if (matched.length > 0) {
              fetched = matched;
            }
          }
        } catch (err) {
          // ignore
        }
      }

      setGroupMembersList(fetched || []);
      if (group && fetched && Array.isArray(fetched) && fetched.length > 0) {
        group.members = fetched;
      }
    } catch (err) {
      console.error("Failed to load group members:", err);
      setGroupMembersList([]);
    } finally {
      setMembersLoading(false);
    }
  };

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

  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return groupMembersList;
    const term = memberSearch.toLowerCase().trim();
    return (groupMembersList || []).filter((rawMember) => {
      const info = extractMemberInfo(rawMember);
      if (!info) return false;
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
  }, [groupMembersList, memberSearch]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortBy === key && sortOrder === "asc") {
      direction = "desc";
    }
    onSortChange?.(key, direction);
  };

  const sortIcon = (key) => {
    if (sortBy !== key) return <span className="text-gray-400 text-xs ml-1">⇅</span>;
    return (
      <span className="text-admin_primary text-xs ml-1 font-bold">
        {sortOrder === "asc" ? "▲" : "▼"}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
          Active
        </span>
      );
    }
    if (s === "INACTIVE" || s === "BLOCKED" || s === "REJECTED") {
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
        {s || "Pending"}
      </span>
    );
  };

  // Safely extract volunteer group items
  const processedData = useMemo(() => {
    return (data || []).filter(Boolean);
  }, [data]);

  return (
    <div className="w-full bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
      {/* Header, Search & Filter Controls */}
      <div className="p-4 border-b border-gray-200 bg-gray-50/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-admin_primary/10 text-admin_primary rounded-lg shrink-0">
            <FaUsers size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-admin_text_grey leading-tight">
                Volunteer Groups
              </h2>
              <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded-full">
                {total} Total
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              value={search || ""}
              onChange={(e) => {
                setSearch?.(e.target.value);
                onPageChange?.(1);
              }}
              placeholder="Search group, email, city..."
              className="pl-8 pr-7 py-1.5 text-xs border border-gray-300 rounded-md w-full bg-white focus:outline-none focus:ring-1 focus:ring-admin_primary focus:border-admin_primary"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch?.("");
                  onPageChange?.(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FaTimes size={10} />
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <select
            value={status || ""}
            onChange={(e) => {
              setStatus?.(e.target.value);
              onPageChange?.(1);
            }}
            className="py-1.5 px-2.5 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-admin_primary text-gray-700 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          {/* Reset Filters */}
          {(search || status) && (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-md transition whitespace-nowrap cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Loading & Error States */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader />
          <span className="mt-3 text-sm font-medium">Loading volunteer groups...</span>
        </div>
      ) : error ? (
        <div className="p-8 text-center">
          <div className="inline-block p-3 rounded-full bg-red-100 text-red-600 mb-2">
            <FaTimes size={24} />
          </div>
          <p className="text-red-600 font-semibold">{error}</p>
          <button
            type="button"
            onClick={() => onPageChange?.(page)}
            className="mt-3 px-4 py-1.5 bg-admin_primary text-white text-xs font-medium rounded hover:opacity-90"
          >
            Try Again
          </button>
        </div>
      ) : processedData.length === 0 ? (
        <div className="py-16 text-center text-gray-500">
          <FaUsers className="mx-auto text-4xl text-gray-300 mb-3" />
          <h3 className="text-base font-semibold text-gray-700">No Volunteer Groups Found</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            {search || status
              ? "Try adjusting your search criteria or status filter to find matching groups."
              : "There are currently no volunteer groups registered in the system."}
          </p>
          {(search || status) && (
            <button
              type="button"
              onClick={onResetFilters}
              className="mt-4 px-3 py-1.5 bg-admin_primary text-white text-xs font-medium rounded hover:opacity-90"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-x-auto w-full">
          <table className="w-full table-fixed min-w-[960px] divide-y divide-gray-200">
            <colgroup>
              <col style={{ width: "19%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "6%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "8%" }} />
            </colgroup>
            <thead className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th
                  className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100 select-none transition"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-1">
                    <span>Group</span>
                    {sortIcon("name")}
                  </div>
                </th>

                <th
                  className="px-3 py-3 text-left cursor-pointer hover:bg-gray-100 select-none transition"
                  onClick={() => handleSort("email")}
                >
                  <div className="flex items-center gap-1">
                    <span>Contact</span>
                    {sortIcon("email")}
                  </div>
                </th>

                <th className="px-3 py-3 text-left select-none">
                  <div className="flex items-center gap-1">
                    <span>Location</span>
                  </div>
                </th>

                <th
                  className="px-2 py-3 text-center cursor-pointer hover:bg-gray-100 select-none transition"
                  onClick={() => handleSort("members_count")}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Members</span>
                    {sortIcon("members_count")}
                  </div>
                </th>

                <th
                  className="px-2 py-3 text-center cursor-pointer hover:bg-gray-100 select-none transition"
                  onClick={() => handleSort("points")}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Points</span>
                    {sortIcon("points")}
                  </div>
                </th>

                <th className="px-2 py-3 text-center whitespace-nowrap select-none">
                  <div className="flex items-center justify-center gap-1">
                    <span>Missions</span>
                  </div>
                </th>

                <th
                  className="px-2 py-3 text-center cursor-pointer hover:bg-gray-100 select-none transition"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Status</span>
                    {sortIcon("status")}
                  </div>
                </th>

                <th
                  className="px-2 py-3 text-center cursor-pointer hover:bg-gray-100 select-none transition"
                  onClick={() => handleSort("created_at")}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Created</span>
                    {sortIcon("created_at")}
                  </div>
                </th>

                <th className="px-2 py-3 text-center select-none">
                  <div className="flex items-center justify-center">
                    <span>Action</span>
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-100 text-sm">
              {processedData.map((group, index) => {
                const missionsCount =
                  group.missions_count ??
                  (Array.isArray(group.missions) ? group.missions.length : 0);
                const hasMissions = missionsCount > 0;

                const membersCount =
                  group.members_count ??
                  (Array.isArray(group.members)
                    ? group.members.length
                    : Array.isArray(group.volunteers)
                      ? group.volunteers.length
                      : Array.isArray(group.group_members)
                        ? group.group_members.length
                        : Array.isArray(group.users)
                          ? group.users.length
                          : 0);
                const hasMembers = membersCount > 0;

                return (
                  <tr
                    key={group.id || index}
                    className={classNames(
                      "hover:bg-blue-50/50 transition-colors duration-150",
                      { "bg-gray-50/40": index % 2 === 0 }
                    )}
                  >
                    {/* Group Name & Avatar */}
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-3 overflow-hidden">
                        {group.image ? (
                          <img
                            src={group.image}
                            alt={group.name}
                            className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-admin_primary text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                            {getInitials(group.name)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <Link
                            to={`/volunteer-groups/${group.id}`}
                            state={{ group }}
                            className="font-semibold text-gray-800 hover:text-admin_primary transition truncate block text-sm no-underline hover:underline"
                            title={group.name}
                          >
                            {group.name || "Unnamed Group"}
                          </Link>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs text-gray-400 font-mono">
                              ID: #{group.id}
                            </span>
                            {group.role && (
                              <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-gray-100 text-gray-600 rounded">
                                {group.role}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact (Email + Phone) */}
                    <td className="px-3 py-3 align-middle">
                      <div className="space-y-1 overflow-hidden">
                        <div className="flex items-center gap-1.5 text-xs text-gray-700">
                          <FaEnvelope className="text-gray-400 shrink-0 text-[10px]" />
                          <span className="truncate block" title={group.email}>
                            {group.email || "No email"}
                          </span>
                        </div>
                        {group.contact_no && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <FaPhone className="text-gray-400 shrink-0 text-[9px]" />
                            <span className="truncate block">{group.contact_no}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-3 py-3 align-middle text-xs text-gray-600">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <FaMapMarkerAlt className="text-rose-500 text-[11px] shrink-0" />
                        <span
                          className="truncate block"
                          title={[group.city, group.state, group.country].filter(Boolean).join(", ")}
                        >
                          {[group.city, group.state, group.country]
                            .filter(Boolean)
                            .join(", ") || "Location not set"}
                        </span>
                      </div>
                    </td>

                    {/* Members Count */}
                    <td className="px-2 py-3 align-middle text-center">
                      <div className="flex items-center justify-center">
                        {hasMembers ? (
                          <button
                            type="button"
                            onClick={() => handleOpenMembersModal(group)}
                            title="Click to view group members"
                            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 transition cursor-pointer whitespace-nowrap"
                          >
                            <FaUsers className="text-indigo-500 text-xs shrink-0" />
                            <span>
                              {membersCount} {membersCount === 1 ? "member" : "members"}
                            </span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs text-gray-400 bg-gray-50 border border-gray-200/60 whitespace-nowrap">
                            0 members
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Points */}
                    <td className="px-2 py-3 align-middle text-center">
                      <div className="flex items-center justify-center">
                        <span className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                          <FaAward className="text-amber-500 text-xs shrink-0" />
                          <span>{group.points ?? 0}</span>
                        </span>
                      </div>
                    </td>

                    {/* Linked Missions Count */}
                    <td className="px-2 py-3 align-middle text-center">
                      <div className="flex items-center justify-center">
                        {hasMissions ? (
                          <button
                            type="button"
                            onClick={() => setSelectedGroupForMissions(group)}
                            title="Click to preview linked missions"
                            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition cursor-pointer whitespace-nowrap"
                          >
                            <FaTasks className="text-blue-500 text-xs shrink-0" />
                            <span>
                              {missionsCount} {missionsCount === 1 ? "mission" : "missions"}
                            </span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs text-gray-400 bg-gray-50 border border-gray-200/60 whitespace-nowrap">
                            0 missions
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-2 py-3 align-middle text-center">
                      <div className="flex items-center justify-center whitespace-nowrap">
                        {getStatusBadge(group.status)}
                      </div>
                    </td>

                    {/* Created Date */}
                    <td className="px-2 py-3 align-middle text-center text-xs text-gray-600 whitespace-nowrap">
                      <span>{formatDate(group.created_at)}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-2 py-3 align-middle text-center">
                      <div className="flex items-center justify-center">
                        <Link
                          to={`/volunteer-groups/${group.id}`}
                          state={{ group }}
                          className="inline-flex items-center justify-center gap-1.5 bg-admin_primary text-white text-xs font-medium px-3 py-1.5 rounded-md hover:bg-opacity-90 shadow-sm transition no-underline hover:no-underline whitespace-nowrap"
                          title="View Volunteer Group Details"
                        >
                          <FaRegEye size={12} />
                          <span>View</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-gray-200 bg-gray-50 gap-3">
        <div className="flex items-center space-x-2 text-sm">
          <button
            onClick={() => onPageChange?.(1)}
            disabled={page === 1}
            className="px-2 py-1 bg-admin_dark text-white rounded text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black transition"
            title="First Page"
          >
            {"<<"}
          </button>

          <button
            onClick={() => onPageChange?.(page - 1)}
            disabled={page === 1}
            className="px-2 py-1 bg-admin_dark text-white rounded text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black transition"
            title="Previous Page"
          >
            {"<"}
          </button>

          <span className="text-xs text-gray-700 px-1">
            Page <strong>{page}</strong> of <strong>{totalPages || 1}</strong> | Total:{" "}
            <strong>{total}</strong>
          </span>

          <button
            onClick={() => onPageChange?.(page + 1)}
            disabled={page >= totalPages}
            className="px-2 py-1 bg-admin_dark text-white rounded text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black transition"
            title="Next Page"
          >
            {">"}
          </button>

          <button
            onClick={() => onPageChange?.(totalPages)}
            disabled={page >= totalPages}
            className="px-2 py-1 bg-admin_dark text-white rounded text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black transition"
            title="Last Page"
          >
            {">>"}
          </button>
        </div>

        {/* Page Size Selector */}
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span>Show:</span>
          <select
            value={limit}
            onChange={(e) => {
              limitChange?.(Number(e.target.value));
              onPageChange?.(1);
            }}
            className="border border-gray-300 rounded p-1 bg-white focus:outline-none focus:ring-1 focus:ring-admin_primary text-xs"
          >
            {[5, 10, 20, 30, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size} per page
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Missions Preview Modal */}
      {selectedGroupForMissions && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <FaTasks className="text-admin_primary" />
                <h3 className="text-lg font-bold text-gray-800">
                  Linked Missions for {selectedGroupForMissions.name}
                </h3>
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 font-semibold rounded-full">
                  {selectedGroupForMissions.missions?.length || 0}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGroupForMissions(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition"
              >
                <FaTimes size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              {(!selectedGroupForMissions.missions ||
                selectedGroupForMissions.missions.length === 0) ? (
                <div className="text-center py-8 text-gray-500">
                  <FaTasks className="mx-auto text-3xl text-gray-300 mb-2" />
                  <p className="text-sm font-medium">No linked missions found for this volunteer group.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedGroupForMissions.missions.map((mission, mIdx) => (
                    <div
                      key={mission.id || mIdx}
                      className="border border-gray-200 rounded-lg p-4 hover:border-admin_primary/50 transition bg-white shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-800 text-sm">
                              {mission.name || "Untitled Mission"}
                            </h4>
                            <span className="text-xs font-mono text-gray-500">
                              #{mission.id}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getStatusClass(
                                mission.status
                              )}`}
                            >
                              {formatStatus(mission.status) || mission.status}
                            </span>
                          </div>

                          {mission.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {mission.description}
                            </p>
                          )}
                        </div>

                        {mission.points !== undefined && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200 shrink-0">
                            <FaAward className="text-amber-500" />
                            {mission.points} Pts
                          </span>
                        )}
                      </div>

                      {/* Mission Metadata Grid */}
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-md">
                        {/* Organization */}
                        <div className="flex items-center gap-1.5">
                          <FaBuilding className="text-gray-400 shrink-0" />
                          <span className="font-medium text-gray-700">Org:</span>
                          <span className="truncate">
                            {mission.company_name ||
                              (mission.organization_id
                                ? `Org #${mission.organization_id}`
                                : "N/A")}
                          </span>
                          {mission.company_type && (
                            <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 rounded">
                              {mission.company_type}
                            </span>
                          )}
                        </div>

                        {/* Timing */}
                        {(mission.start_time || mission.end_time) && (
                          <div className="flex items-center gap-1.5">
                            <FaCalendarAlt className="text-gray-400 shrink-0" />
                            <span className="truncate">
                              {formatDateTime(mission.start_time)}
                              {mission.end_time && ` - ${formatDateTime(mission.end_time)}`}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Assigned By Section */}
                      <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 font-medium">Assigned By:</span>
                          {mission.assigned_by_details ? (
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                              <FaUserCheck className="text-emerald-600 text-[11px]" />
                              <span>{mission.assigned_by_details.name}</span>
                              <span className="text-[10px] uppercase px-1 py-0.2 rounded bg-emerald-200/60 text-emerald-900 font-bold">
                                {mission.assigned_by_details.role ||
                                  mission.assigned_by_details.type ||
                                  "Admin"}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs">
                              Direct Organization Mission (Not Assigned)
                            </span>
                          )}
                        </div>

                        {/* Link to Mission Details */}
                        <Link
                          to={`/missions/${mission.id}`}
                          className="inline-flex items-center gap-1 text-admin_primary hover:underline font-semibold"
                        >
                          <span>Mission Details</span>
                          <FaExternalLinkAlt size={10} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <Link
                to={`/volunteer-groups/${selectedGroupForMissions.id}`}
                state={{ group: selectedGroupForMissions }}
                className="text-xs font-semibold text-admin_primary hover:underline"
              >
                Go to full Volunteer Group Profile →
              </Link>
              <button
                type="button"
                onClick={() => setSelectedGroupForMissions(null)}
                className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium rounded-md transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Members Preview Modal */}
      {selectedGroupForMembers && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                  <FaUsers size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 leading-tight">
                    Members of {selectedGroupForMembers.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Group ID: #{selectedGroupForMembers.id}
                  </p>
                </div>
                <span className="ml-2 text-xs px-2.5 py-0.5 bg-indigo-100 text-indigo-800 font-semibold rounded-full">
                  {membersLoading ? "..." : groupMembersList.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGroupForMembers(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-200 transition"
              >
                <FaTimes size={18} />
              </button>
            </div>

            {/* Modal Quick Filter Search */}
            {groupMembersList.length > 0 && !membersLoading && (
              <div className="px-6 pt-3 pb-2 bg-white border-b border-gray-100">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search members by name, email, role, location..."
                    className="w-full pl-9 pr-8 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-500"
                  />
                  {memberSearch && (
                    <button
                      type="button"
                      onClick={() => setMemberSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <FaTimes size={12} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 max-h-[60vh]">
              {membersLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                  <Loader />
                  <span className="mt-3 text-sm font-medium">Loading group members...</span>
                </div>
              ) : groupMembersList.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FaUsers className="mx-auto text-4xl text-gray-300 mb-2" />
                  <h4 className="text-sm font-semibold text-gray-700">No Members Found</h4>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                    There are currently no registered or invited members associated with this volunteer group.
                  </p>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <p className="text-sm font-medium">No members match "{memberSearch}"</p>
                  <button
                    type="button"
                    onClick={() => setMemberSearch("")}
                    className="mt-2 text-xs text-admin_primary hover:underline font-semibold"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
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

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <Link
                to={`/volunteer-groups/${selectedGroupForMembers.id}`}
                state={{
                  group: {
                    ...selectedGroupForMembers,
                    members: groupMembersList,
                  },
                }}
                className="text-xs font-semibold text-admin_primary hover:underline"
              >
                Go to full Volunteer Group Profile →
              </Link>
              <button
                type="button"
                onClick={() => setSelectedGroupForMembers(null)}
                className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium rounded-md transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerGroupTable;

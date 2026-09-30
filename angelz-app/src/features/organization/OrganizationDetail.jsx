import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FaMapPin,
  FaChevronLeft,
  FaCalendarDay,
  FaBuilding,
  FaPhone,
  FaGlobe,
  FaTimes,
  FaUserPlus,
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import useUserProfile from "../../hooks/useUserProfile";
import { useGetOrganizationDetail } from "../../api/organization";
import { formatDate } from "../../utils/dateUtils";
import { getImageUrl } from "../../utils/getImageUrl";
import Loader from "../../components/Loader";
import MissionCard from "../../components/mission/missionCard";
import { PhoneNumberDisplay } from "../../components/PhoneNumberDisplay";
import MapComponent from "../../components/MapComponent";
import { useGetAllVolunteerQuery, useInviteVolunteer } from "../../api/volunteer";
import VolunteerCardForOrg from "../../components/organization/VolunteerCardForOrg";
import { PAGE_LIMIT } from "../../constant/PAGE_LIMIT";
import InviteVolunteerDropdown from "../../components/organization/InviteVolunteerDropdown";
import { useGetGroupVolunteers, useAssignGroupVolunteersToOrganization } from "../../api/volunteerGroup";

const CHUNK = PAGE_LIMIT.LIMIT;

const OrganizationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("missions");

  // local pagination state for each tab
  const [visibleMissions, setVisibleMissions] = useState(CHUNK);
  const [visibleVolunteers, setVisibleVolunteers] = useState(CHUNK);

  // IntersectionObserver refs
  const missionObserver = useRef();
  const volunteerObserver = useRef();

  const { user, isLoading: profileLoading } = useUserProfile();
  const { data: orgData, isLoading: orgLoading } = useGetOrganizationDetail(id);

  const { data: volunteerRes, isLoading: volLoading } = useGetAllVolunteerQuery({ page: 1, limit: 1000 });
  const volunteers = volunteerRes?.volunteers || [];

  const { mutate, isPending } = useInviteVolunteer();

  const organization = id ? orgData : user;
  const isLoading = id ? orgLoading : profileLoading;

  const invitedVolunteers = organization?.volunteers || [];
  const organizationMissions = organization?.missions || [];

  // Volunteer Group Assignment States & Mutations
  const queryClient = useQueryClient();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedVolunteersForAssign, setSelectedVolunteersForAssign] = useState([]);

  useEffect(() => {
    if (showAssignModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showAssignModal]);

  const { data: groupVolunteers = [] } = useGetGroupVolunteers({
    enabled: user?.type === "volunteer_group"
  });

  const assignOrgMutation = useAssignGroupVolunteersToOrganization({
    onSuccess: () => {
      setShowAssignModal(false);
      setSelectedVolunteersForAssign([]);
      queryClient.invalidateQueries(["organization", id]);
    }
  });

  const toggleAssignSelect = (volId) => {
    setSelectedVolunteersForAssign(prev =>
      prev.includes(volId) ? prev.filter(id => id !== volId) : [...prev, volId]
    );
  };

  const handleAssignSubmit = () => {
    if (selectedVolunteersForAssign.length === 0) return;
    assignOrgMutation.mutate({
      organization_id: Number(id),
      volunteer_ids: selectedVolunteersForAssign
    });
  };

  const availableVolunteers = groupVolunteers.filter(
    gv => !invitedVolunteers.some(iv => iv.id === gv.id)
  );

  // reset visible counts when switching tabs
  useEffect(() => {
    setVisibleMissions(CHUNK);
    setVisibleVolunteers(CHUNK);
  }, [activeTab]);

  // close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // last-mission sentinel — loads next chunk
  const lastMissionRef = useCallback((node) => {
    if (missionObserver.current) missionObserver.current.disconnect();
    missionObserver.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && visibleMissions < organizationMissions.length) {
        setVisibleMissions((prev) => prev + CHUNK);
      }
    });
    if (node) missionObserver.current.observe(node);
  }, [visibleMissions, organizationMissions.length]);

  // last-volunteer sentinel — loads next chunk
  const lastVolunteerRef = useCallback((node) => {
    if (volunteerObserver.current) volunteerObserver.current.disconnect();
    volunteerObserver.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && visibleVolunteers < invitedVolunteers.length) {
        setVisibleVolunteers((prev) => prev + CHUNK);
      }
    });
    if (node) volunteerObserver.current.observe(node);
  }, [visibleVolunteers, invitedVolunteers.length]);

  if (isLoading || !organization) {
    return <Loader />;
  }

  const imageUrl =
    getImageUrl(organization.image) ||
    "https://via.placeholder.com/800x400?text=Organization+Banner";

  const slicedMissions = organizationMissions.slice(0, visibleMissions);
  const slicedVolunteers = invitedVolunteers.slice(0, visibleVolunteers);
  const hasMissionMore = visibleMissions < organizationMissions.length;
  const hasVolunteerMore = visibleVolunteers < invitedVolunteers.length;

  return (
    <>
      <div className="max-w-7xl mx-auto glass-card flex flex-col h-full relative">
        <div className="relative">
          <img
            src={imageUrl}
            alt="banner"
            className="w-full h-52 object-cover rounded-t-[14px]"
          />
          <div className="absolute inset-0 bg-black/30 rounded-t-[14px]" />
          <button
            onClick={() => navigate(-1)}
            className="absolute top-3 left-3 bg-black/40 p-2 rounded-full hover:bg-black/60"
          >
            <FaChevronLeft className="w-5 h-5 text-white" />
          </button>

          <div className="absolute top-3 right-3" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-white text-2xl"
            >
              …
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg text-sm">
                <button className="block px-4 py-2 hover:bg-gray-100 w-full text-left">
                  Report
                </button>
                <button className="block px-4 py-2 hover:bg-gray-100 w-full text-left">
                  Bug
                </button>
              </div>
            )}
          </div>

          <div className="absolute bottom-3 inset-x-0 flex items-center justify-between px-4 text-white">
            <div>
              <h2 className="text-lg font-semibold">
                {organization.company_name || "Organization Name"}
              </h2>
              <p className="text-sm opacity-90">{organization.city || "City Unknown"}</p>
            </div>
            <div className="flex items-center gap-4">
              {user?.type === "volunteer_group" && (
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold text-xs transition-all shadow-md cursor-pointer border border-blue-500"
                >
                  <FaUserPlus /> Assign My Volunteers
                </button>
              )}
              <div className="flex items-center gap-2 text-sm">
                <FaCalendarDay className="w-4 h-4" />
                <span>
                  Member since{" "}
                  <span className="capitalize">
                    {organization.created_at ? formatDate(organization.created_at) : "N/A"}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-10">
          <div className="mb-8 mt-10">
            <div className="flex flex-wrap items-center justify-between text-gray-700 text-sm gap-2">
              <div className="flex items-center gap-2">
                <FaMapPin className="w-4 h-4 text-blue-600" />
                <span>
                  {organization.address ||
                    `${organization.city || ""}, ${organization.state || ""}, ${organization.country || ""
                    }`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FaPhone className="w-4 h-4 text-green-600" />
                <PhoneNumberDisplay phone={organization?.contact_no} />
              </div>
              <div className="flex items-center gap-2">
                <FaBuilding className="w-4 h-4 text-amber-500" />
                <span>{organization.services || "Type Unknown"}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaGlobe className="w-4 h-4 text-purple-500" />
                <span>{organization.state ? `State: ${organization.state}` : "State N/A"}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900">Organization Description</h3>
            <p className="mt-3 text-sm text-gray-700 leading-relaxed">
              {organization.description || "No description provided for this organization."}
            </p>
          </div>

          {organization.lat && organization.lng && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Location</h3>
              <MapComponent
                defaultLocation={{
                  lat: Number(organization.lat),
                  lng: Number(organization.lng),
                }}
                mode={"view"}
              />
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-10">
        {/* Tab header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {activeTab === "missions"
              ? `All missions by ${organization?.company_name}`
              : `All volunteers of ${organization?.company_name}`}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("missions")}
              className={`px-4 py-2 rounded-lg cursor-pointer ${activeTab === "missions"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
                }`}
            >
              Missions
            </button>

            <button
              onClick={() => setActiveTab("volunteers")}
              className={`px-4 py-2 rounded-lg ${activeTab === "volunteers"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
                }`}
            >
              Volunteers
            </button>
          </div>
        </div>

        {/* ── MISSIONS TAB ── */}
        {activeTab === "missions" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {slicedMissions.length > 0 ? (
                slicedMissions.map((mission, index) => {
                  const isLast = index === slicedMissions.length - 1;
                  return (
                    <div ref={isLast ? lastMissionRef : null} key={mission?.id}>
                      <MissionCard {...mission} />
                    </div>
                  );
                })
              ) : (
                <p className="col-span-3 text-gray-500">No missions to display.</p>
              )}
            </div>

            {hasMissionMore && (
              <div className="py-8 flex justify-center">
                <Loader fullPage={false} />
              </div>
            )}

            {!hasMissionMore && slicedMissions.length > 0 && (
              <p className="text-center py-8 text-gray-500 font-medium">
                No more missions to load.
              </p>
            )}
          </>
        )}

        {/* ── VOLUNTEERS TAB ── */}
        {activeTab === "volunteers" && (
          volLoading ? (
            <Loader />
          ) : (
            <>
              {/* Invite section — only visible to own org */}
              {user?.id === organization?.id && (
                <div className="max-w-7xl mx-auto my-6">
                  <h2 className="text-xl font-semibold mb-4">Invite Volunteer</h2>
                  <InviteVolunteerDropdown
                    volunteers={volunteers.filter(v => !invitedVolunteers?.some(iv => iv.id === v.id))}
                    isLoading={isPending}
                    inviteMutation={mutate}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {slicedVolunteers.length > 0 ? (
                  slicedVolunteers.map((vol, index) => {
                    const isLast = index === slicedVolunteers.length - 1;
                    return (
                      <div ref={isLast ? lastVolunteerRef : null} key={vol?.id}>
                        <VolunteerCardForOrg vol={vol} />
                      </div>
                    );
                  })
                ) : (
                  <p className="col-span-3 text-gray-500">No volunteers found for this organization.</p>
                )}
              </div>

              {hasVolunteerMore && (
                <div className="py-8 flex justify-center">
                  <Loader fullPage={false} />
                </div>
              )}

              {!hasVolunteerMore && slicedVolunteers.length > 0 && (
                <p className="text-center py-8 text-gray-500 font-medium">
                  No more volunteers to load.
                </p>
              )}
            </>
          )
        )}
      </div>

      {/* Assign Volunteers Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden relative shadow-2xl border border-gray-100 flex flex-col">
            {/* Modal Header */}
            <div style={{ backgroundColor: "oklch(54.6% 0.245 262.881)" }} className="text-white p-6 sm:p-8 relative">
              <button
                onClick={() => setShowAssignModal(false)}
                className="absolute right-5 top-5 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <FaTimes className="text-lg" />
              </button>
              <h2 className="text-2xl font-bold text-white">Assign Volunteers</h2>
              <p className="text-xs text-white/80 mt-1.5">
                Select volunteers from your group to assign to this organization.
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col flex-1 max-h-[50vh] overflow-y-auto space-y-3 bg-gray-50/50">
              {availableVolunteers.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-sm">No available volunteers to assign.</p>
              ) : (
                availableVolunteers.map((vol) => (
                  <label
                    key={vol.id}
                    className="flex items-center gap-3 p-3.5 rounded-2xl border border-gray-100 bg-white hover:bg-blue-50/40 cursor-pointer transition-colors shadow-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedVolunteersForAssign.includes(vol.id)}
                      onChange={() => toggleAssignSelect(vol.id)}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{vol.name}</p>
                      <p className="text-xs text-gray-400">{vol.email}</p>
                    </div>
                  </label>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end rounded-b-3xl">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-5 py-2 border border-gray-200 rounded-full text-gray-600 hover:bg-gray-100 font-semibold cursor-pointer bg-white transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={selectedVolunteersForAssign.length === 0 || assignOrgMutation.isPending}
                onClick={handleAssignSubmit}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-full font-semibold transition-colors cursor-pointer shadow-sm"
              >
                {assignOrgMutation.isPending ? "Assigning..." : `Assign Selected (${selectedVolunteersForAssign.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrganizationDetail;

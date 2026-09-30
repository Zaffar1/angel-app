import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaMapPin, FaPhone, FaEnvelope, FaBuilding, FaUsers, FaTrophy, FaArrowLeft, FaAward } from "react-icons/fa";
import { useGetVolunteerGroupDetail, useGetVolunteerGroupVolunteers } from "../../api/volunteer";
import { getImageUrl } from "../../utils/getImageUrl";
import Loader from "../../components/Loader";
import { PhoneNumberDisplay } from "../../components/PhoneNumberDisplay";
import MapComponent from "../../components/MapComponent";

export default function VolunteerGroupDetailForOrg() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: group, isLoading: groupLoading, isError: groupError } = useGetVolunteerGroupDetail(id);
  const { data: members, isLoading: membersLoading, isError: membersError } = useGetVolunteerGroupVolunteers(id);

  if (groupLoading || membersLoading) {
    return <Loader />;
  }

  if (groupError || !group) {
    return (
      <div className="max-w-4xl mx-auto my-12 text-center p-8 bg-red-50 rounded-2xl border border-red-200">
        <h3 className="text-xl font-bold text-red-700">Error Loading Group</h3>
        <p className="text-red-500 mt-2">Could not load the requested volunteer group details.</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-full">
          Go Back
        </button>
      </div>
    );
  }

  const imageUrl = getImageUrl(group.image) || "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=300&auto=format&fit=crop";

  const getInitials = (fullName) => {
    if (!fullName) return "?";
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="max-w-7xl mx-auto my-6 space-y-8 px-4 sm:px-6">
      <div>
        <button
          onClick={() => navigate("/organization/volunteer-list")}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-bold transition-colors"
        >
          <FaArrowLeft /> Back to Volunteers
        </button>
      </div>

      <div className="glass-card overflow-hidden border border-gray-100 shadow-md">
        <div className="h-56 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 relative"></div>
        <div className="px-6 pb-6 relative flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16">
          <img
            src={imageUrl}
            alt={group.name}
            className="w-36 h-36 rounded-full border-4 border-white shadow-lg object-cover bg-white"
          />
          <div className="flex-1 text-center md:text-left space-y-1">
            <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider">
              Volunteer Group
            </span>
            <h1 className="text-3xl font-extrabold text-gray-800">{group.name}</h1>
            <p className="text-gray-500 flex items-center justify-center md:justify-start gap-1">
              <FaMapPin className="text-blue-500" />
              {group.city ? `${group.city}, ${group.state}, ${group.country}` : "Location not set"}
            </p>
          </div>

          <div className="flex gap-4">
            <div className="bg-blue-50/80 backdrop-blur-md px-5 py-3 rounded-2xl border border-blue-100 text-center">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Members</p>
              <p className="font-extrabold text-blue-600 text-2xl">{group.members_count || 0}</p>
            </div>
            <div className="bg-yellow-50/80 backdrop-blur-md px-5 py-3 rounded-2xl border border-yellow-100 text-center">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Group Points</p>
              <p className="font-extrabold text-yellow-600 text-2xl">{group.points || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6 lg:col-span-1">
          <div className="glass-card p-6 space-y-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-extrabold text-gray-800 border-b border-gray-100 pb-3">Contact Details</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3.5 text-sm text-gray-600">
                <FaEnvelope className="text-blue-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-bold text-gray-700">Email</p>
                  <p className="break-all">{group.email}</p>
                </div>
              </div>
              {group.contact_no && (
                <div className="flex items-start gap-3.5 text-sm text-gray-600">
                  <FaPhone className="text-blue-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-gray-700">Phone</p>
                    <PhoneNumberDisplay number={group.contact_no} />
                  </div>
                </div>
              )}
              {group.address && (
                <div className="flex items-start gap-3.5 text-sm text-gray-600">
                  <FaBuilding className="text-blue-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-gray-700">Base Address</p>
                    <p>{group.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {group.lat && group.lng && (
            <div className="glass-card p-6 space-y-4 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-extrabold text-gray-800">Base Location Map</h3>
              <div className="rounded-2xl overflow-hidden border border-gray-100 h-64">
                <MapComponent
                  defaultLocation={{ lat: parseFloat(group.lat), lng: parseFloat(group.lng) }}
                  address={group.address}
                  readOnly={true}
                />
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card p-6 space-y-4 border border-gray-100 shadow-sm">
            <h3 className="text-xl font-extrabold text-gray-800">About Group</h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {group.description || "No description provided for this group."}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
                <FaUsers className="text-blue-600" /> Group Volunteers ({members?.length || 0})
              </h3>
            </div>

            {membersError && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl">
                Failed to load volunteers for this group.
              </div>
            )}

            {!members || members.length === 0 ? (
              <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-gray-150 border-dashed">
                <FaUsers className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 font-medium">No volunteers are associated with this group yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {members.map((member) => {
                  const memberImgUrl = getImageUrl(member.image);
                  return (
                    <div
                      key={member.id}
                      onClick={() => navigate(`/organization/volunteer/${member.id}`)}
                      className="group p-5 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
                    >
                      <div className="flex items-start gap-4">
                        {memberImgUrl ? (
                          <img
                            src={memberImgUrl}
                            alt={member.name}
                            className="w-14 h-14 rounded-full object-cover border border-gray-100"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                            {getInitials(member.name)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {member.name}
                          </h4>
                          <p className="text-xs text-gray-400 truncate mt-0.5">{member.email}</p>
                          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                            <FaMapPin className="text-blue-400 text-[10px]" />
                            {member.city ? `${member.city}, ${member.country}` : "Location not set"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3.5 border-t border-gray-50 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <FaAward className="text-indigo-500 w-4 h-4" />
                          <span>Missions: <strong className="text-gray-700">{member.missions?.length || 0}</strong></span>
                        </div>
                        <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-full font-bold">
                          <FaTrophy className="text-yellow-500 w-3.5 h-3.5" />
                          <span>{member.points || 0} pts</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

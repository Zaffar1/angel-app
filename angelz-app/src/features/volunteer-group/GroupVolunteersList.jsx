import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Link } from "react-router-dom";
import {
  FaUserPlus,
  FaBuilding,
  FaBullseye,
  FaSearch,
  FaTimes,
  FaUserCheck,
  FaChevronDown,
  FaEye
} from "react-icons/fa";
import {
  useGetGroupVolunteers,
  useInviteVolunteerByGroup,
  useAssignGroupVolunteersToMission,
  useAssignGroupVolunteersToOrganization
} from "../../api/volunteerGroup";
import { useAllMissions } from "../../api/mission";
import { useGetAllOrganizationQuery } from "../../api/organization";
import { inviteVolunteerSchema } from "../../schema/volunteerGroup";
import { InputField } from "../../components/InputField";
import { ThemeButton } from "../../components/ThemeButton";
import { PhoneNumberDisplay } from "../../components/PhoneNumberDisplay";
import { PhoneInput } from "../../components/PhoneInput";
import Loader from "../../components/Loader";
import VolunteerDetailsModal from "./components/VolunteerDetailsModal";

export default function GroupVolunteersList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedVolunteerForDetails, setSelectedVolunteerForDetails] = useState(null);

  const { data: volunteers = [], isLoading: volLoading } = useGetGroupVolunteers();

  const inviteMutation = useInviteVolunteerByGroup({
    onSuccess: () => {
      setShowInviteModal(false);
      resetInviteForm();
    }
  });

  const {
    register: registerInvite,
    handleSubmit: handleInviteSubmit,
    reset: resetInviteForm,
    control: controlInvite,
    formState: { errors: inviteErrors },
  } = useForm({
    resolver: yupResolver(inviteVolunteerSchema)
  });

  const handleInvite = (data) => {
    inviteMutation.mutate(data);
  };

  const filteredVolunteers = volunteers.filter(
    v =>
      v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (volLoading) return <Loader />;

  return (
    <div className="max-w-6xl mx-auto my-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Invited Volunteers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage, invite, and assign your volunteer group members.</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-all shadow-md hover:shadow-lg cursor-pointer"
        >
          <FaUserPlus /> Invite Volunteer
        </button>
      </div>


      <div className="glass-card p-6 space-y-6">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search volunteers by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-full outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        {filteredVolunteers.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <p className="text-gray-400 text-lg">No volunteers found.</p>
            {volunteers.length === 0 && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="px-6 py-2 border border-blue-500 text-blue-500 rounded-full hover:bg-blue-50 transition-colors font-medium cursor-pointer"
              >
                Invite Your First Volunteer
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 text-sm">
                  <th className="py-3 px-4 font-semibold">Name</th>
                  <th className="py-3 px-4 font-semibold">Email</th>
                  <th className="py-3 px-4 font-semibold">Phone</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredVolunteers.map((vol) => (
                  <tr key={vol.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-800">{vol.name}</div>
                    </td>
                    <td className="py-4 px-4 text-gray-600">{vol.email}</td>
                    <td className="py-4 px-4 text-gray-600">
                      <PhoneNumberDisplay number={vol.contact_no} />
                    </td>
                    <td className="py-4 px-4">
                      <span className="bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full font-semibold">
                        Invited
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => setSelectedVolunteerForDetails(vol)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <FaEye /> View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full relative shadow-2xl">
            <button
              onClick={() => setShowInviteModal(false)}
              className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer"
            >
              <FaTimes />
            </button>
            <h2 className="text-xl font-bold text-gray-800 mb-6">Invite a New Volunteer</h2>
            <form onSubmit={handleInviteSubmit(handleInvite)} className="space-y-4">
              <InputField label="Name" placeholder="Volunteer full name" {...registerInvite("name")} error={inviteErrors.name?.message} />
              <InputField label="Email" type="email" placeholder="Volunteer email address" {...registerInvite("email")} error={inviteErrors.email?.message} />
              <PhoneInput control={controlInvite} name="contact_no" label="Phone Number" error={inviteErrors.contact_no} />
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Description / Notes</label>
                <textarea {...registerInvite("description")} rows={3} placeholder="Add any details or qualifications..." className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-5 py-2 border rounded-full text-gray-600 hover:bg-gray-50 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <ThemeButton type="submit" isLoading={inviteMutation.isPending}>Send Invitation</ThemeButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Volunteer Details Modal */}
      {selectedVolunteerForDetails && (
        <VolunteerDetailsModal
          volunteer={selectedVolunteerForDetails}
          onClose={() => setSelectedVolunteerForDetails(null)}
        />
      )}
    </div>
  );
}

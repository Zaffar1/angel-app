import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Link } from "react-router-dom";
import useLocale from "../../hooks/useLocale";
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
  const { t } = useLocale("volunteerGroup");
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
          <h1 className="text-2xl font-bold text-gray-800">{t("list.title")}</h1>
          <p className="text-sm text-gray-500 mt-1">{t("list.subtitle")}</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-all shadow-md hover:shadow-lg cursor-pointer"
        >
          <FaUserPlus /> {t("list.inviteVolunteer")}
        </button>
      </div>


      <div className="glass-card p-6 space-y-6">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder={t("list.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full ps-10 pe-4 py-2.5 border border-gray-200 rounded-full outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
          <FaSearch className="absolute start-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        {filteredVolunteers.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <p className="text-gray-400 text-lg">{t("list.noVolunteers")}</p>
            {volunteers.length === 0 && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="px-6 py-2 border border-blue-500 text-blue-500 rounded-full hover:bg-blue-50 transition-colors font-medium cursor-pointer"
              >
                {t("list.inviteFirst")}
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 text-sm">
                  <th className="py-3 px-4 font-semibold">{t("list.table.name")}</th>
                  <th className="py-3 px-4 font-semibold">{t("list.table.email")}</th>
                  <th className="py-3 px-4 font-semibold">{t("list.table.phone")}</th>
                  <th className="py-3 px-4 font-semibold">{t("list.table.status")}</th>
                  <th className="py-3 px-4 font-semibold text-end">{t("list.table.actions")}</th>
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
                        {t("list.invited")}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-end">
                      <button
                        onClick={() => setSelectedVolunteerForDetails(vol)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <FaEye /> {t("list.viewDetails")}
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden relative shadow-2xl border border-gray-100 flex flex-col">
            {/* Modal Header */}
            <div style={{ backgroundColor: "oklch(54.6% 0.245 262.881)" }} className="text-white p-6 sm:p-8 relative">
              <button
                type="button"
                onClick={() => {
                  setShowInviteModal(false);
                  resetInviteForm();
                }}
                className="absolute end-5 top-5 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                aria-label={t("common.closeModal")}
              >
                <FaTimes className="text-lg" />
              </button>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
                <FaUserPlus className="text-xl" /> {t("list.invite.title")}
              </h2>
              <p className="text-xs text-white/80 mt-1.5">
                {t("list.invite.subtitle")}
              </p>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleInviteSubmit(handleInvite)} className="flex flex-col flex-1">
              <div className="p-6 sm:p-8 space-y-4 bg-gray-50/50 flex-1 overflow-y-auto max-h-[60vh]">
                <InputField
                  label={t("list.invite.name")}
                  placeholder={t("list.invite.namePlaceholder")}
                  {...registerInvite("name")}
                  error={inviteErrors.name?.message}
                />
                <InputField
                  label={t("list.invite.email")}
                  type="email"
                  dir="ltr"
                  placeholder={t("list.invite.emailPlaceholder")}
                  {...registerInvite("email")}
                  error={inviteErrors.email?.message}
                />
                <PhoneInput
                  control={controlInvite}
                  name="contact_no"
                  label={t("list.invite.phone")}
                  error={inviteErrors.contact_no}
                />
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-1.5">
                    {t("list.invite.description")}
                  </label>
                  <textarea
                    {...registerInvite("description")}
                    rows={3}
                    placeholder={t("list.invite.descriptionPlaceholder")}
                    className="w-full p-3.5 border border-gray-200 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm transition-all resize-none"
                  />
                  {inviteErrors.description?.message && (
                    <p className="text-red-500 text-xs mt-1">{inviteErrors.description.message}</p>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    resetInviteForm();
                  }}
                  className="px-5 py-2.5 border border-gray-200 rounded-full text-gray-600 hover:bg-gray-100 font-semibold cursor-pointer bg-white transition-colors text-sm shadow-sm"
                >
                  {t("common.cancel")}
                </button>
                <ThemeButton
                  type="submit"
                  isLoading={inviteMutation.isPending}
                  className="!rounded-full font-semibold shadow-sm text-sm !px-6"
                >
                  {t("list.invite.send")}
                </ThemeButton>
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

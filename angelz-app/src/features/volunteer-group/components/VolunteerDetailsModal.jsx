import React, { useEffect } from "react";
import {
  FaTimes,
  FaEnvelope,
  FaPhone
} from "react-icons/fa";
import { PhoneNumberDisplay } from "../../../components/PhoneNumberDisplay";
import { getImageUrl } from "../../../utils/getImageUrl";
import { useGetGroupVolunteerById } from "../../../api/volunteerGroup";
import { formatStatus } from "../../../utils/missionStatusUtils";

export default function VolunteerDetailsModal({ volunteer: initialVolunteer, onClose }) {
  const { data: volunteer = initialVolunteer } = useGetGroupVolunteerById(initialVolunteer?.id);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  if (!volunteer) return null;

  const imageUrl = getImageUrl(volunteer.image) || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop";

  const missions = volunteer.missions || [];

  const renderStatusBadge = (status) => {
    const displayVal = formatStatus(
      status === "process" 
        ? "pending" 
        : (status === "in_progress" || status === "inprogress") 
          ? "started" 
          : status
    );
    
    // Determine colors/classes based on status
    let colorClass = "bg-gray-100 text-gray-700 border-gray-200";
    let dotClass = "bg-gray-400";
    
    const s = status?.toLowerCase();
    if (s === 'completed') {
      colorClass = "bg-green-50 text-green-700 border border-green-200";
      dotClass = "bg-green-500";
    } else if (s === 'in_progress' || s === 'inprogress') {
      colorClass = "bg-blue-50 text-blue-700 border border-blue-200";
      dotClass = "bg-blue-500 animate-pulse";
    } else if (s === 'process' || s === 'scheduled' || s === 'started') {
      colorClass = "bg-amber-50 text-amber-700 border border-amber-200";
      dotClass = "bg-amber-500 animate-pulse";
    } else if (s === 'completion_requested') {
      colorClass = "bg-indigo-50 text-indigo-700 border border-indigo-200";
      dotClass = "bg-indigo-500 animate-pulse";
    } else if (s === 'ended') {
      colorClass = "bg-red-50 text-red-700 border border-red-200";
      dotClass = "bg-red-500";
    }
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`}></span> {displayVal}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-100 relative">
        {/* Modal Header */}
        <div style={{ backgroundColor: "oklch(54.6% 0.245 262.881)" }} className="text-white p-6 sm:p-8 relative">
          <button
            onClick={onClose}
            className="absolute right-5 top-5 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <FaTimes className="text-lg" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white/20 shadow-md bg-white/20 text-white font-bold flex items-center justify-center text-3xl sm:text-4xl uppercase select-none">
              {volunteer.name ? volunteer.name[0] : "V"}
            </div>
            <div className="text-center sm:text-left space-y-1">
              <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-semibold tracking-wide uppercase text-white/90 border border-white/10">
                Volunteer Details
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">{volunteer.name}</h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-white/80 pt-1">
                <span className="flex items-center gap-1.5">
                  <FaEnvelope className="text-white opacity-80" /> {volunteer.email}
                </span>
                {volunteer.contact_no && (
                  <span className="flex items-center gap-1.5">
                    <FaPhone className="text-white opacity-80" />
                    <PhoneNumberDisplay number={volunteer.contact_no} className="!text-white hover:!text-white hover:underline" />
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 bg-gray-50/50 overflow-y-auto max-h-[60vh]">
          {/* Volunteer Information Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Volunteer Information</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700 pt-2">
              <div>
                <span className="text-gray-400 block text-xs font-medium">Full Name</span>
                <p className="font-semibold text-gray-800 mt-0.5">{volunteer.name || "N/A"}</p>
              </div>
              <div>
                <span className="text-gray-400 block text-xs font-medium">Email Address</span>
                <p className="font-semibold text-gray-800 mt-0.5">{volunteer.email || "N/A"}</p>
              </div>
              <div>
                <span className="text-gray-400 block text-xs font-medium">Phone Number</span>
                <div className="font-semibold text-gray-800 mt-0.5">
                  {volunteer.contact_no ? (
                    <PhoneNumberDisplay number={volunteer.contact_no} className="!text-gray-800 hover:!text-gray-800" />
                  ) : (
                    "N/A"
                  )}
                </div>
              </div>
              <div>
                <span className="text-gray-400 block text-xs font-medium">Points Earned</span>
                <p className="font-semibold text-blue-600 mt-0.5">{volunteer.points || 0} Point(s)</p>
              </div>
            </div>

            {volunteer.description && (
              <div className="border-t pt-4">
                <span className="text-gray-400 block text-xs font-medium">Description / Notes</span>
                <p className="text-gray-600 mt-1 whitespace-pre-line leading-relaxed">{volunteer.description}</p>
              </div>
            )}
          </div>

          {/* Assigned Missions List */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-700 tracking-wide uppercase border-b pb-3">
              Assigned Missions & Status
            </h3>
            {missions.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-4">No missions assigned to this volunteer yet.</p>
            ) : (
              <div className="divide-y divide-gray-100 space-y-3">
                {missions.map((m) => (
                  <div key={m.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                    <p className="font-semibold text-gray-800 text-sm">{m.name}</p>
                    {renderStatusBadge(m.assigned_status || m.status)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-white p-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full font-medium transition-colors cursor-pointer text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

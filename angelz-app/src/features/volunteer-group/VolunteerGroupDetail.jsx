import React from "react";
import { FaMapPin, FaPhone, FaEnvelope, FaBuilding } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import useUserProfile from "../../hooks/useUserProfile";
import { getImageUrl } from "../../utils/getImageUrl";
import Loader from "../../components/Loader";
import { PhoneNumberDisplay } from "../../components/PhoneNumberDisplay";
import MapComponent from "../../components/MapComponent";

export default function VolunteerGroupDetail() {
  const navigate = useNavigate();
  const { user, isLoading } = useUserProfile();

  if (isLoading || !user) {
    return <Loader />;
  }

  const imageUrl = getImageUrl(user.image) || "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=300&auto=format&fit=crop";

  return (
    <div className="max-w-4xl mx-auto my-8 space-y-6">
      {/* Group Card Header */}
      <div className="glass-card overflow-hidden">
        <div className="h-48 bg-gradient-to-r from-blue-500 to-indigo-600 relative"></div>
        <div className="px-6 pb-6 relative flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16">
          <img
            src={imageUrl}
            alt={user.name}
            className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover bg-white"
          />
          <div className="flex-1 text-center md:text-left space-y-1">
            <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider">
              Volunteer Group
            </span>
            <h1 className="text-3xl font-bold text-gray-800">{user.name}</h1>
            <p className="text-gray-500 flex items-center justify-center md:justify-start gap-1">
              <FaMapPin className="text-blue-500" />
              {user.city ? `${user.city}, ${user.state}, ${user.country}` : "Location not set"}
            </p>
          </div>
          <button
            onClick={() => navigate("/volunteer_group/edit")}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-all shadow-md hover:shadow-lg"
          >
            Edit Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info Sidebar */}
        <div className="glass-card p-6 space-y-6 md:col-span-1">
          <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Details</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <FaEnvelope className="text-blue-500 mt-1" />
              <div>
                <p className="font-semibold text-gray-700">Email</p>
                <p>{user.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <FaPhone className="text-blue-500 mt-1" />
              <div>
                <p className="font-semibold text-gray-700">Phone</p>
                <PhoneNumberDisplay number={user.contact_no} />
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <FaBuilding className="text-blue-500 mt-1" />
              <div>
                <p className="font-semibold text-gray-700">Address</p>
                <p>{user.address || "No address provided"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-xl font-bold text-gray-800">About Group</h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {user.description || "No description provided."}
            </p>
          </div>

          {user.lat && user.lng && (
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-xl font-bold text-gray-800">Base Location Map</h3>
              <MapComponent
                defaultLocation={{ lat: parseFloat(user.lat), lng: parseFloat(user.lng) }}
                address={user.address}
                readOnly={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

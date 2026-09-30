import React, { useState } from "react";
import {
  FaWifi,
  FaUtensils,
  FaCar,
  FaMusic,
  FaBeer,
  FaPaw,
  FaAccessibleIcon,
  FaArrowRight,
} from "react-icons/fa";
import useFacilities from "../hooks/useFacilities";
import Loader from "./Loader";

// Icons for different amenities
const amenityIcons = {
  "Wi-Fi": <FaWifi />,
  "Outdoor Seating": <FaUtensils />,
  Parking: <FaCar />,
  "Live Music": <FaMusic />,
  "Bar/Alcohol Service": <FaBeer />,
  "Pet-Friendly": <FaPaw />,
  "Accessible Restrooms": <FaAccessibleIcon />,
  // Add more mappings here
};

const Amenities = () => {
  const {
    facilities,
    loading,
    error,
    addNewFacility,
    updateExistingFacility,
    deleteExistingFacility,
    refetchFacilities,
  } = useFacilities();

  const [selectedFacility, setSelectedFacility] = useState(null);
  const [facilityName, setFacilityName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleEditFacility = (facility) => {
    setSelectedFacility(facility);
    setFacilityName(facility.name);
  };

  const handleAddOrUpdateFacility = async () => {
    if (isProcessing) return; // Prevent further action while processing

    setIsProcessing(true);

    try {
      if (selectedFacility) {
        // Update existing facility
        await updateExistingFacility(selectedFacility.id, {
          name: facilityName.trim(),
        });
        setSelectedFacility(null);
      } else if (facilityName.trim()) {
        // Add new facility
        await addNewFacility({ name: facilityName.trim() });
      }
      setFacilityName("");
      // Refetch facilities after successful add/update
      await refetchFacilities();
    } catch (err) {
      console.error(
        selectedFacility
          ? "Error updating facility:"
          : "Error adding facility:",
        err
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteFacility = async (facilityId) => {
    if (isProcessing) return; // Prevent further action while processing

    try {
      await deleteExistingFacility(facilityId);
      // Refetch facilities after successful delete
      await refetchFacilities();
    } catch (err) {
      console.error("Error deleting facility:", err);
    }
  };

  if (loading) return <Loader />;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg sm:text-lg font-bold text-admin_text_grey mb-3 capitalize">
          Add/Update Facility
        </h2>
        <input
          id="facility-name"
          type="text"
          value={facilityName}
          onChange={(e) => setFacilityName(e.target.value)}
          className="p-2 border rounded w-full"
          placeholder="Enter facility name"
        />
        <p className="text-red-500 text-sm">
          {facilityName === "" && "Facility name is required."}
        </p>
        <button
         onClick={() => {
          if (!facilityName) {
            alert("Facility name is required.");
            return;
          }
          handleAddOrUpdateFacility();
        }}
          // onClick={handleAddOrUpdateFacility}
          className={`p-2 mt-2 ${
            isProcessing
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-admin_primary hover:bg-pink-700"
          } text-white rounded`}
          disabled={isProcessing}
        >
          {isProcessing
            ? "Processing..."
            : selectedFacility
            ? "Update Facility"
            : "Add Facility"}
        </button>
      </div>

      <div className="flex flex-wrap gap-4">
        {facilities.map((facility) => (
          <div
            key={facility.id}
            className="flex items-center space-x-2 bg-white border rounded-lg p-2 shadow-md"
          >
            <div className="text-lg">
              {amenityIcons[facility.name] || <FaArrowRight />}
            </div>
            <span>{facility.name}</span>
            <button
              onClick={() => handleEditFacility(facility)}
              className="text-blue-500 text-xs"
            >
              Edit
            </button>
            <button
              onClick={() => handleDeleteFacility(facility.id)}
              className="text-red-500 text-xs"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Amenities;

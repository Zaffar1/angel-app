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
import useKitchens from "../hooks/useKitchens";
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

const Kitchens = () => {
  const {
    kitchens,
    loading,
    error,
    addNewKitchen,
    updateExistingKitchen,
    deleteExistingKitchen,
    refetchKitchens,
  } = useKitchens();

  const [selectedKitchen, setSelectedKitchen] = useState(null);
  const [kitchenName, setKitchenName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleEditKitchen = (kitchen) => {
    setSelectedKitchen(kitchen);
    setKitchenName(kitchen.name);
  };

  const handleAddOrUpdateKitchen = async () => {
    if (isProcessing) return; // Prevent further action while processing

    setIsProcessing(true);

    try {
      if (selectedKitchen) {
        // Update existing kitchen
        await updateExistingKitchen(selectedKitchen.id, { name: kitchenName.trim() });
        setSelectedKitchen(null);
      } else if (kitchenName.trim()) {
        // Add new kitchen
        await addNewKitchen({ name: kitchenName.trim() });
      }
      setKitchenName("");
      // Refetch kitchens after successful add/update
      await refetchKitchens();
    } catch (err) {
      console.error(
        selectedKitchen ? "Error updating kitchen:" : "Error adding kitchen:",
        err
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteKitchen = async (kitchenId) => {
    if (isProcessing) return; // Prevent further action while processing

    try {
      await deleteExistingKitchen(kitchenId);
      // Refetch kitchens after successful delete
      await refetchKitchens();
    } catch (err) {
      console.error("Error deleting kitchen:", err);
    }
  };

  if (loading) return <Loader />;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg sm:text-lg font-bold text-admin_text_grey mb-3 capitalize">
          Add/Update Kitchens
        </h2>
        <input
          id="kitchen-name"
          type="text"
          value={kitchenName}
          onChange={(e) => setKitchenName(e.target.value)}
          className="p-2 border rounded w-full"
          placeholder="Enter kitchen name"
        />
        <p className="text-red-500 text-sm">
          {kitchenName === "" && "Kitchen name is required."}
        </p>
        <button
          // onClick={handleAddOrUpdateKitchen}
          onClick={() => {
            if (!kitchenName) {
              alert("Kitchen name is required.");
              return;
            }
            handleAddOrUpdateKitchen();
          }}
          className={`p-2 mt-2 ${
            isProcessing
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-admin_primary hover:bg-pink-700"
          } text-white rounded`}
          disabled={isProcessing}
        >
          {isProcessing
            ? "Processing..."
            : selectedKitchen
            ? "Update Kitchen"
            : "Add Kitchen"}
        </button>
      </div>

      <div className="flex flex-wrap gap-4">
        {kitchens.map((kitchen) => (
          <div
            key={kitchen.id}
            className="flex items-center space-x-2 bg-white border rounded-lg p-2 shadow-md"
          >
            <div className="text-lg">
              {amenityIcons[kitchen.name] || <FaArrowRight />}
            </div>
            <span>{kitchen.name}</span>
            <button
              onClick={() => handleEditKitchen(kitchen)}
              className="text-blue-500 text-xs"
            >
              Edit
            </button>
            <button
              onClick={() => handleDeleteKitchen(kitchen.id)}
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

export default Kitchens;

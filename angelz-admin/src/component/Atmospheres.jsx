import React, { useState } from "react";
import {
  FaArrowRight,
} from "react-icons/fa";
import useAtmosphere from '../hooks/useAtmosphere'
import Loader from "./Loader";

// Icons for different atmospheres


const Atmospheres = () => {
  const {
    atmospheres,
    loading,
    error,
    addNewAtmosphere,
    updateExistingAtmosphere,
    deleteExistingAtmosphere,
    refetchAtmospheres,
  } = useAtmosphere();

  const [selectedAtmosphere, setSelectedAtmosphere] = useState(null);
  const [atmosphereName, setAtmosphereName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleEditAtmosphere = (atmosphere) => {
    setSelectedAtmosphere(atmosphere);
    setAtmosphereName(atmosphere.name);
  };

  const handleAddOrUpdateAtmosphere = async () => {
    if (isProcessing) return; // Prevent further action while processing

    setIsProcessing(true);

    try {
      if (selectedAtmosphere) {
        // Update existing atmosphere
        await updateExistingAtmosphere(selectedAtmosphere.id, { name: atmosphereName.trim() });
        setSelectedAtmosphere(null);
      } else if (atmosphereName.trim()) {
        // Add new atmosphere
        await addNewAtmosphere({ name: atmosphereName.trim() });
      }
      setAtmosphereName("");
      // Refetch atmospheres after successful add/update
      await refetchAtmospheres();
    } catch (err) {
      console.error(
        selectedAtmosphere ? "Error updating atmosphere:" : "Error adding atmosphere:",
        err
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAtmosphere = async (atmosphereId) => {
    if (isProcessing) return; // Prevent further action while processing

    try {
      await deleteExistingAtmosphere(atmosphereId);
      // Refetch atmospheres after successful delete
      await refetchAtmospheres();
    } catch (err) {
      console.error("Error deleting atmosphere:", err);
    }
  };

  if (loading) return <Loader />;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg sm:text-lg font-bold text-admin_text_grey mb-3 capitalize">
          Add/Update Atmospheres
        </h2>
        <input
          id="atmosphere-name"
          type="text"
          value={atmosphereName}
          onChange={(e) => setAtmosphereName(e.target.value)}
          className="p-2 border rounded w-full"
          placeholder="Enter atmosphere name"
        />
         <p className="text-red-500 text-sm">
          {atmosphereName === "" && "Kitchen name is required."}
        </p>
        <button
          // onClick={handleAddOrUpdateAtmosphere}
          onClick={() => {
            if (!atmosphereName) {
              alert("Kitchen name is required.");
              return;
            }
            handleAddOrUpdateAtmosphere();
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
            : selectedAtmosphere
            ? "Update Atmosphere"
            : "Add Atmosphere"}
        </button>
      </div>

      <div className="flex flex-wrap gap-4">
        {atmospheres.map((atmosphere) => (
          <div
            key={atmosphere.id}
            className="flex items-center space-x-2 bg-white border rounded-lg p-2 shadow-md"
          >
            <div className="text-lg">
             <FaArrowRight />
            </div>
            <span>{atmosphere.name}</span>
            <button
              onClick={() => handleEditAtmosphere(atmosphere)}
              className="text-blue-500 text-xs"
            >
              Edit
            </button>
            <button
              onClick={() => handleDeleteAtmosphere(atmosphere.id)}
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

export default Atmospheres;

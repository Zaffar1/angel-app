import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { fallback } from "../assets";
import useFetch from "../hooks/useFetch";

// Custom icon for the map marker
const customIcon = new L.Icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const RestaurantDetail = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const { data, loading, error: fetchError } = useFetch("admin/getUsers/hotel");

  useEffect(() => {
    // Check if the data is already available
    if (data && data.length) {
      const restaurantData = data.find((rest) => rest.id.toString() === id);
      console.log(restaurantData, "restaurantData");

      if (restaurantData) {
        setRestaurant(restaurantData);
        setIsLoading(false);
      } else {
        setError("Restaurant not found");
        setIsLoading(false);
      }
    } else if (!loading && fetchError) {
      // If there's an error from useFetch
      setError(fetchError);
      setIsLoading(false);
    }
  }, [data, id, loading, fetchError]);

  // If the data is still loading from the API or Redux
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // If there was an error fetching or finding the data
  if (error) {
    return <div>{error}</div>;
  }

  const {
    name,
    status,
    phone,
    email,
    address,
    is_approved,
    latitude,
    longitude,
    profile_image,
  } = restaurant;

  return (
    <div className="">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold mb-6 capitalize">{name || "No Name"}</h2>
        <p className="flex justify-between items-center space-x-2 capitalize">
          <strong>Status:</strong>{" "}
          <span className="rounded-full px-3 text-white bg-admin_primary text-sm py-1">
            {status || "Unknown"}
          </span>{" "}
          <span className="rounded-full px-3 text-white bg-admin_dark text-sm py-1">
            {is_approved ? "approved" : "unapproved"}
          </span>
        </p>
      </div>
      <div className="flex flex-col md:flex-row md:space-x-6">
        {/* Image and Information Section */}
        <div className="w-full">
          <img
            src={profile_image || fallback}
            alt={name || "Restaurant"}
            className="w-full h-64 object-cover mb-4 rounded-lg"
          />

          <p>
            <strong>Phone:</strong> {phone || "No Phone"}
          </p>
          <p>
            <strong>Email:</strong> {email || "No Email"}
          </p>
          <p>
            <strong>Address:</strong> {address || "No Address"}
          </p>
        </div>

        {/* Map Section */}
        {/* <div className="md:w-1/2 h-64">
          {latitude && longitude ? (
            <MapContainer
              center={[latitude, longitude]}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={[latitude, longitude]} icon={customIcon}>
                <Popup>{name}</Popup>
              </Marker>
            </MapContainer>
          ) : (
            <p>No location data available</p>
          )}
        </div> */}
      </div>
    </div>
  );
};

export default RestaurantDetail;

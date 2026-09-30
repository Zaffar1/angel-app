import React, { useEffect, useRef, useState } from "react";
import { googleMapsLoader } from "../utils/googleMapsLoader";

export default function MapComponent({
  defaultLocation = { lat: 40.73061, lng: -73.935242 },
  address = "",
  onLocationSelect = () => { },
  mode = "interactive",
}) {
  const mapRef = useRef(null);
  const inputRef = useRef(null);
  const [currentAddress, setCurrentAddress] = useState(address);

  const mapInstance = useRef(null);
  const markerInstance = useRef(null);
  const geocoderInstance = useRef(null);

  useEffect(() => {
    setCurrentAddress(address);
  }, [address]);

  useEffect(() => {
    let autocomplete;

    const initMap = async () => {
      const { Map, Marker, Geocoder, Autocomplete } = await googleMapsLoader();

      if (!mapInstance.current) {
        mapInstance.current = new Map(mapRef.current, {
          center: defaultLocation,
          zoom: 14,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        });

        markerInstance.current = new Marker({
          map: mapInstance.current,
          position: defaultLocation
        });

        geocoderInstance.current = new Geocoder();
      } else {
        mapInstance.current.setCenter(defaultLocation);
        markerInstance.current.setPosition(defaultLocation);
      }

      if (!address && defaultLocation.lat && defaultLocation.lng) {
        try {
          const { results } = await geocoderInstance.current.geocode({
            location: defaultLocation
          });
          if (results?.[0]) {
            setCurrentAddress(results[0].formatted_address);
          }
        } catch (error) {
          console.error("Reverse geocode failed:", error);
        }
      }

      if (mode === "interactive") {
        autocomplete = new Autocomplete(inputRef.current, {
          fields: ["address_components", "geometry", "formatted_address"],
        });

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (!place.geometry) return;

          const pos = place.geometry.location;
          markerInstance.current.setPosition(pos);
          mapInstance.current.panTo(pos);

          const location = {};
          place.address_components?.forEach(component => {
            const types = component.types;
            if (types.includes('locality')) location.city = component.long_name;
            if (types.includes('administrative_area_level_1')) location.state = component.short_name;
            if (types.includes('country')) location.country = component.long_name;
          });

          setCurrentAddress(place.formatted_address);
          onLocationSelect({
            lat: pos.lat(),
            lng: pos.lng(),
            address: place.formatted_address,
            ...location
          });
        });

        mapInstance.current.addListener("click", async (e) => {
          const pos = e.latLng;
          markerInstance.current.setPosition(pos);

          try {
            const { results } = await geocoderInstance.current.geocode({ location: pos });
            if (results?.[0]) {
              const fullAddress = results[0].formatted_address;

              const location = {};
              results[0].address_components?.forEach(component => {
                const types = component.types;
                if (types.includes('locality')) location.city = component.long_name;
                if (types.includes('administrative_area_level_1')) location.state = component.short_name;
                if (types.includes('country')) location.country = component.long_name;
              });

              setCurrentAddress(fullAddress);
              onLocationSelect({
                lat: pos.lat(),
                lng: pos.lng(),
                address: fullAddress,
                ...location
              });
            } else {
              onLocationSelect({
                lat: pos.lat(),
                lng: pos.lng(),
                address: "",
              });
            }
          } catch (error) {
            console.error("Reverse geocode failed:", error);
            onLocationSelect({
              lat: pos.lat(),
              lng: pos.lng(),
              address: "",
            });
          }
        });
      }
    };

    initMap();

    return () => {
      if (autocomplete) {
        autocomplete.unbindAll();
      }
    };
  }, [defaultLocation.lat, defaultLocation.lng, mode]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  const handleInputChange = (e) => {
    setCurrentAddress(e.target.value);
  };

  useEffect(() => {
    if (mode === "interactive" && defaultLocation.lat && defaultLocation.lng) {
      onLocationSelect({
        lat: defaultLocation.lat,
        lng: defaultLocation.lng,
        address: currentAddress || "",
      });
    }
  }, [defaultLocation.lat, defaultLocation.lng, mode]);

  return (
    <div className="space-y-2">
      {mode === "interactive" && (
        <input
          ref={inputRef}
          type="text"
          placeholder="Search Location....."
          className="w-full border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white border-gray-300 rounded-lg"
          onKeyDown={handleKeyDown}
          value={currentAddress}
          onChange={handleInputChange}
        />
      )}
      <div
        ref={mapRef}
        className="w-full h-[350px] rounded-lg border border-[#EBF1FF] shadow-inner overflow-hidden"
      />
      {currentAddress && (
        <p className="text-gray-700 text-sm">📍 {currentAddress}</p>
      )}
    </div>
  );
}
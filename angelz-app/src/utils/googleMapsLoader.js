import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

let loaded = false;
let googleLibs = {};

export async function googleMapsLoader() {
  if (loaded) return googleLibs;
  setOptions({
    key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });
  const [maps, marker, geocoding, places] = await Promise.all([
    importLibrary("maps"),
    importLibrary("marker"),
    importLibrary("geocoding"),
    importLibrary("places"),
  ]);
  googleLibs = { ...maps, ...marker, ...geocoding, ...places };
  loaded = true;
  return googleLibs;
}

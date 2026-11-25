import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { getLanguage } from "../i18n";

let loaded = false;
let loadedLanguage = null;
let googleLibs = {};

export async function googleMapsLoader() {
  if (loaded) return googleLibs;
  loadedLanguage = getLanguage();
  setOptions({
    key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    language: loadedLanguage, // Maps JS can only load once per page; a language switch applies after reload
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

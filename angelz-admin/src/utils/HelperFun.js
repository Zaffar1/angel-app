import { fallback } from "../assets";

export const transformData = (apiResponse) => {
  if (!apiResponse || !Array.isArray(apiResponse)) return [];
  return apiResponse.map((item) => ({
    id: item?.id,
    title: item?.name,
    location: item?.address,
    images:
      item?.galleries && item.galleries.length > 0
        ? item.galleries.map((gallery) => gallery?.image)
        : [fallback],
    rating: item?.rating || 0,
    cuisine:
      item?.kitchens && item.kitchens.length > 0
        ? item.kitchens.map((kitchen) => kitchen?.name).join(", ")
        : "N/A",
    timeline:
      item?.tables && item.tables.length > 0
        ? item.tables.map((table) => `Seats: ${table?.seats}`)
        : ["N/A"],
    kitchens: item?.kitchens || [],
    atmospheres: item?.atmospheres || [],
    facilities: item?.facilities || [],
    areas: item?.areas || [],
    menuTypes: item?.menuTypes || [],
  }));
};


export const restrictWordCount = (text, maxWords = 50) => {
  return text.split(" ").slice(0, maxWords).join(" ") + (text.split(" ").length > maxWords ? "..." : "");
};
import i18n from "../i18n";

export const ORGANIZATAION_TYPE_OPTIONS = [
  "Food Distribution",
  "Medical Assistance",
  "Education Support",
  "Shelter Management",
  "Disaster Relief",
  "Community Outreach",
  "Environmental Projects",
  "Elderly Care",
  "Child Welfare",
];

const TYPE_SLUGS = {
  "Food Distribution": "foodDistribution",
  "Medical Assistance": "medicalAssistance",
  "Education Support": "educationSupport",
  "Shelter Management": "shelterManagement",
  "Disaster Relief": "disasterRelief",
  "Community Outreach": "communityOutreach",
  "Environmental Projects": "environmentalProjects",
  "Elderly Care": "elderlyCare",
  "Child Welfare": "childWelfare",
};

// Returns the translated display label for a backend organization type value
// (falls back to the raw value when it is not a known type).
export const getOrganizationTypeLabel = (value) => {
  const slug = TYPE_SLUGS[value];
  return slug ? i18n.t(`organization:types.${slug}`) : value;
};

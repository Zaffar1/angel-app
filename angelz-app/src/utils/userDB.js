// Real Unsplash image IDs for profile pictures
const PROFILE_IMAGES = [
    '1472099645785-5658abf4ff4e', // Woman
    '1507003211169-0a1dd7228f2d', // Man with glasses
    '1535713875002-d1d0ac377430', // Man in suit
    '1494790108755-2616b612b786', // Woman smiling
    '1500648767791-00dcc994a43e', // Man smiling
    '1519244703997-f4e0f30006d5', // Woman with hat
    '1517841905240-472988babdf9', // Model
    '1500595046743-cd271d694d30', // Business woman
    '1531427186611-ecfd6d936c79', // Man with beard
    '1489424731084-a5d8b219a5bb'  // Woman with short hair
];

const CITIES = ["New York", "Los Angeles", "Chicago", "Toronto", "Miami", "London", "Sydney", "Tokyo", "Berlin", "Paris"];
const COUNTRIES = ["USA", "Canada", "UK", "Australia", "Japan", "Germany", "France"];
const NAMES = [
    "Armin Chen", "Sarah Smith", "Michael Lee", "Emma Wilson", "Chris Evans",
    "David Brown", "Lisa Wang", "James Miller", "Olivia Garcia", "Robert Johnson",
    "Sophia Martinez", "William Davis", "Isabella Rodriguez", "Benjamin Wilson", "Mia Anderson"
];

export const generateUserImage = (index) => {
    const imageId = PROFILE_IMAGES[index % PROFILE_IMAGES.length];
    return `https://images.unsplash.com/photo-${imageId}?ixlib=rb-4.0.3&w=150&h=150&fit=crop&crop=face`;
};

export const generateMockUsers = (count = 50, startIndex = 0) => {
    return Array.from({ length: count }, (_, index) => {
        const globalIndex = startIndex + index;
        return {
            id: globalIndex + 1,
            name: NAMES[globalIndex % NAMES.length],
            email: `${NAMES[globalIndex % NAMES.length].toLowerCase().replace(/\s+/g, '.')}@example.com`,
            points: 3000 - (globalIndex * 45) + Math.floor(Math.random() * 100),
            city: CITIES[globalIndex % CITIES.length],
            country: COUNTRIES[globalIndex % COUNTRIES.length],
            trend: Math.random() > 0.5 ? 'up' : 'down',
            change: Math.floor(Math.random() * 50) + 1,
            image: generateUserImage(globalIndex)
        };
    });
};

export const fetchUsers = async (page = 1, pageSize = 15) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const startIndex = (page - 1) * pageSize;
    const users = generateMockUsers(pageSize, startIndex);
    const hasMore = page < 5;
    return { users, hasMore };
};
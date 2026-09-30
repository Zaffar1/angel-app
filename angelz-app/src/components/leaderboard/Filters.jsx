import React from 'react';
import { FaFilter, FaSyncAlt, FaMapMarkerAlt, FaGlobe, FaTimes, FaTrophy, FaBuilding, FaUsers } from 'react-icons/fa';

export const Filters = ({
    filter,
    onFilterChange,
    cities = [],
    states = [],
    countries = [],
    onToggleFilters,
    onClearFilters,
    isOrgView,
    onToggleMode,
    loggedInAsOrg,
    top = 6,
    organizations = [],
    mode = 'global',
    volunteerGroups = []
}) => {

    const normalizeOptions = (list) => {
        const seen = new Map();
        list.forEach(item => {
            if (!item) return;
            const key = item.toLowerCase();
            if (!seen.has(key)) {
                seen.set(key, item);
            }
        });
        return Array.from(seen.values()).sort();
    };

    const normalizedCities = normalizeOptions(cities);
    const normalizedStates = normalizeOptions(states);
    const normalizedCountries = normalizeOptions(countries);

    return (
        <div className={`glass-card p-6 sticky top-${top}`}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <FaFilter className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Filters</h3>
                        <p className="text-sm text-gray-500">Refine your leaderboard</p>
                    </div>
                </div>

                <button
                    onClick={onToggleFilters}
                    className="lg:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <FaTimes className="w-5 h-5" />
                </button>
            </div>

            {/* Mode Toggle */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/20 rounded-xl mb-6 border border-white/30">
                <button
                    onClick={() => onToggleMode('global')}
                    className={`w-full flex items-center justify-center gap-1.5 py-2.5 px-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${mode === 'global' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <FaTrophy className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Global</span>
                </button>
                <button
                    onClick={() => onToggleMode('organization')}
                    className={`w-full flex items-center justify-center gap-1.5 py-2.5 px-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${mode === 'organization' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <FaBuilding className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Org</span>
                </button>
                <button
                    onClick={() => onToggleMode('group')}
                    className={`w-full flex items-center justify-center gap-1.5 py-2.5 px-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${mode === 'group' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <FaUsers className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Group</span>
                </button>
            </div>

            {/* Active Filters Display */}
            {((mode === 'global' && (filter.city || filter.state || filter.country)) || (mode === 'group' && filter.volunteer_group_id)) && (
                <div className="flex items-center justify-between mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex-1">
                        <span className="text-sm text-blue-700 font-medium block mb-1">
                            Active filters:
                        </span>
                        <div className="text-xs text-blue-600 flex flex-wrap gap-1">
                            {mode === 'group' && filter.volunteer_group_id && (
                                <span className="inline-flex items-center gap-1 bg-blue-100 px-2 py-1 rounded">
                                    <FaUsers className="w-3 h-3" />
                                    {volunteerGroups.find(g => String(g.id) === String(filter.volunteer_group_id))?.name || "Group"}
                                </span>
                            )}
                            {mode === 'global' && filter.country && (
                                <span className="inline-flex items-center gap-1 bg-blue-100 px-2 py-1 rounded">
                                    <FaMapMarkerAlt className="w-3 h-3" />
                                    {filter.country}
                                </span>
                            )}
                            {mode === 'global' && filter.city && (
                                <span className="inline-flex items-center gap-1 bg-blue-100 px-2 py-1 rounded">
                                    <FaMapMarkerAlt className="w-3 h-3" />
                                    {filter.city}
                                </span>
                            )}
                            {mode === 'global' && filter.state && (
                                <span className="inline-flex items-center gap-1 bg-blue-100 px-2 py-1 rounded">
                                    <FaGlobe className="w-3 h-3" />
                                    {filter.state}
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClearFilters}
                        className="flex items-center gap-2 px-3 py-1 text-blue-600 hover:text-blue-800 transition-colors text-sm bg-white rounded-lg border border-blue-200 self-start"
                    >
                        <FaSyncAlt className="w-3 h-3" />
                        Clear
                    </button>
                </div>
            )}

            {/* Filters inputs */}
            <div className="space-y-6">
                {mode === 'organization' && !loggedInAsOrg && (
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                            <FaBuilding className="w-4 h-4 text-blue-500" />
                            Organization
                        </label>
                        <select
                            value={filter.organization_id}
                            onChange={(e) => onFilterChange('organization_id', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-sm"
                        >
                            <option value="">Select Organization</option>
                            {organizations.map(org => (
                                <option key={org.organization_id || org.id} value={org.organization_id || org.id}>
                                    {org.company_name || org.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {mode === 'global' && (
                    <>
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                                <FaGlobe className="w-4 h-4 text-blue-500" />
                                Country
                            </label>
                            <select
                                value={filter.country}
                                onChange={(e) => onFilterChange('country', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                            >
                                <option value="">All Countries</option>
                                {normalizedCountries.map(country => (
                                    <option key={country} value={country}>{country}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                                <FaGlobe className="w-4 h-4 text-blue-500" />
                                State
                            </label>
                            <select
                                value={filter.state}
                                onChange={(e) => onFilterChange('state', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                            >
                                <option value="">All States</option>
                                {normalizedStates.map(state => (
                                    <option key={state} value={state}>{state}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                                <FaMapMarkerAlt className="w-4 h-4 text-blue-500" />
                                City
                            </label>
                            <select
                                value={filter.city}
                                onChange={(e) => onFilterChange('city', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                            >
                                <option value="">All Cities</option>
                                {normalizedCities.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>
                    </>
                )}

                {mode === 'group' && (
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                            <FaUsers className="w-4 h-4 text-blue-500" />
                            Volunteer Group
                        </label>
                        <select
                            value={filter.volunteer_group_id || ""}
                            onChange={(e) => onFilterChange('volunteer_group_id', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-sm"
                        >
                            <option value="">All Groups</option>
                            {volunteerGroups.map(group => (
                                <option key={group.id} value={group.id}>{group.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <button
                onClick={onToggleFilters}
                className="hidden lg:flex w-full items-center justify-center gap-2 mt-8 px-4 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-xl border border-gray-200 transition-colors font-medium"
            >
                <FaTimes className="w-4 h-4" />
                Hide Filters
            </button>
        </div>
    );
};

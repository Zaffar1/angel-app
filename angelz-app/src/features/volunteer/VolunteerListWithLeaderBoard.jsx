import React, { useState, useMemo, useCallback, useEffect } from 'react';
import useLocale from "../../hooks/useLocale";
import { FaTrophy, FaCode } from 'react-icons/fa';
import EmbedCodeModal from '../../components/EmbedCodeModal';
import { Filters } from '../../components/leaderboard/Filters';
import { UserRow } from '../../components/leaderboard/UserRow';
import { LoadingSkeleton } from '../../components/leaderboard/Loading';
import { InfiniteScroll } from '../../components/InfiniteScroll';
import { useGetVolunteerLeaderboardQuery, useGetVolunteerOrgLeaderboardQuery, useGetVolunteerGroupLeaderboardQuery, useGetVolunteerGroups } from '../../api/volunteer';
import { useGetAllOrganizationQuery } from '../../api/organization';
import { PAGE_LIMIT } from '../../constant/PAGE_LIMIT';
import useUserProfile from '../../hooks/useUserProfile';

const VolunteerListWithLeaderBoard = () => {
  const { t } = useLocale('volunteer');
  const { user } = useUserProfile();
  const loggedInAsOrg = user?.role === 'organization';

  const [showEmbedModal, setShowEmbedModal] = useState(false);

  const [filter, setFilter] = useState({ city: "", state: "", country: "", organization_id: "", volunteer_group_id: "" });
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(true);
  const [leaderboardMode, setLeaderboardMode] = useState(loggedInAsOrg ? 'organization' : 'global');

  const [allUsers, setAllUsers] = useState([]);
  const [masterUsers, setMasterUsers] = useState([]);

  const { data: orgsData } = useGetAllOrganizationQuery({ page: 1, limit: 100 });
  const organizations = orgsData?.all_orgs || [];

  const { data: groupsData } = useGetVolunteerGroups();
  const volunteerGroups = groupsData || [];

  useEffect(() => {
    if (organizations.length > 0) {
      console.log('Leaderboard Organizations List:', organizations);
    }
  }, [organizations]);

  const activeOrgId = leaderboardMode === 'organization' ? (loggedInAsOrg ? user?.organization_id : filter.organization_id) : "";
  const isViewingOrgLeaderboard = !!activeOrgId;
  const isViewGroupLeaderboard = leaderboardMode === 'group';

  const params = {
    page,
    limit: PAGE_LIMIT.LIMIT,
    city: filter.city || undefined,
    state: filter.state || undefined,
    country: filter.country || undefined,
    volunteer_group_id: filter.volunteer_group_id || undefined,
    ...(isViewingOrgLeaderboard && { organization_id: activeOrgId })
  };

  const globalQuery = useGetVolunteerLeaderboardQuery(params, {
    enabled: leaderboardMode === 'global' ||
      (leaderboardMode === 'organization' && !activeOrgId) ||
      leaderboardMode === 'group'
  });
  const orgQuery = useGetVolunteerOrgLeaderboardQuery(params, { enabled: isViewingOrgLeaderboard });
  const groupQuery = useGetVolunteerGroupLeaderboardQuery(params, { enabled: false });

  const { data, isLoading, isFetching } = leaderboardMode === 'group'
    ? globalQuery
    : (isViewingOrgLeaderboard ? orgQuery : globalQuery);

  useEffect(() => {
    if (data?.data) {
      console.log(
        isViewGroupLeaderboard
          ? 'Group Leaderboard Data:'
          : (isViewingOrgLeaderboard ? 'Organization Volunteers Data:' : 'Global Volunteers Data:'),
        data.data
      );
    }
  }, [data, isViewingOrgLeaderboard, isViewGroupLeaderboard]);

  useEffect(() => {
    if (data?.data) {
      const normalizedData = data.data.map((item, index) => ({
        ...item,
        id: item.id ?? item.volunteer_id ?? item.volunteer?.id ?? `vol-${index}`,
        rank: item.rank || ((page - 1) * PAGE_LIMIT.LIMIT + index + 1),
        points: item.points ?? item.total_points ?? 0,
        city: item.city ?? item.volunteer?.city ?? (item.address ? item.address.split(',')[0] : 'N/A'),
        country: item.country ?? item.volunteer?.country ?? 'N/A',
        name: item.name ?? item.volunteer?.name ?? 'Unknown',
        email: item.email ?? item.volunteer?.email,
        image: item.image ?? item.volunteer?.image ?? item.file ?? null,
        trend: item.trend ?? item.volunteer?.trend,
        change: item.change ?? item.volunteer?.change,
      }));

      if (page === 1) {
        setAllUsers(normalizedData);

        if (masterUsers.length === 0) {
          setMasterUsers(normalizedData);
        }
      } else {
        setAllUsers(prev => [...prev, ...normalizedData]);
      }
    }
  }, [data, page]);

  const hasMore = data ? data.page < data.pages : false;

  const cities = useMemo(() =>
    [...new Set(masterUsers.map(u => u.city?.trim()).filter(Boolean))],
    [masterUsers]
  );

  const states = useMemo(() =>
    [...new Set(masterUsers.map(u => u.state?.trim()).filter(Boolean))],
    [masterUsers]
  );

  const countries = useMemo(() =>
    [...new Set(masterUsers.map(u => u.country?.trim()).filter(Boolean))],
    [masterUsers]
  );

  const handleFilterChange = useCallback((key, value) => {
    setFilter(prev => {
      const newFilter = { ...prev, [key]: value };

      if (['city', 'state', 'country'].includes(key) && value !== "") {
        newFilter.organization_id = "";
      }

      if (key === 'organization_id' && value !== "") {
        newFilter.city = "";
        newFilter.state = "";
        newFilter.country = "";
        setLeaderboardMode('organization');
      }

      return newFilter;
    });
    setPage(1);
    setAllUsers([]);
  }, []);

  const clearFilters = useCallback(() => {
    setFilter({ city: "", state: "", country: "", organization_id: "", volunteer_group_id: "" });
    setPage(1);
    setAllUsers([]);
  }, []);

  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  const handleToggleMode = (mode) => {
    setLeaderboardMode(mode);
    setFilter({ city: "", state: "", country: "", organization_id: "", volunteer_group_id: "" });
    setPage(1);
    setAllUsers([]);
  };

  const loadMoreUsers = useCallback(() => {
    if (hasMore && !isFetching) {
      setPage(prev => prev + 1);
    }
  }, [hasMore, isFetching]);

  return (
    <div className="max-w-7xl mx-auto min-h-screen pt-2">

      <EmbedCodeModal open={showEmbedModal} onClose={() => setShowEmbedModal(false)} />

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
        {showFilters && (
          <div className="lg:w-80 flex-shrink-0 mt-3">
            <Filters
              filter={filter}
              onFilterChange={handleFilterChange}
              cities={cities}
              states={states}
              countries={countries}
              onToggleFilters={toggleFilters}
              onClearFilters={clearFilters}
              isOrgView={leaderboardMode === 'organization'}
              onToggleMode={handleToggleMode}
              loggedInAsOrg={loggedInAsOrg}
              organizations={organizations}
              mode={leaderboardMode}
              volunteerGroups={volunteerGroups}
            />

            {/* Embed Leaderboard button under filters */}
            <button
              onClick={() => setShowEmbedModal(true)}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md text-sm font-medium"
            >
              <FaCode className="w-4 h-4" />
              {t('leaderboard.embedButton')}
            </button>
          </div>
        )}

        <div className={`${showFilters ? 'flex-1' : 'w-full'}`}>
          {!showFilters && (
            <div className="mb-4 sm:mb-6">
              <button
                onClick={toggleFilters}
                className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md text-sm sm:text-base w-full sm:w-auto justify-center"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                {t('leaderboard.showFilters')}
              </button>
            </div>
          )}

          <div className="glass-card overflow-hidden mt-2">
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-white/20 rounded-xl sm:rounded-2xl backdrop-blur-sm">
                    <FaTrophy className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white">
                      {leaderboardMode === 'group'
                        ? t('leaderboard.titles.group')
                        : (isViewingOrgLeaderboard ? t('leaderboard.titles.organization') : t('leaderboard.titles.global'))}
                    </h1>
                    <p className="text-blue-100 text-xs sm:text-sm">
                      {leaderboardMode === 'group'
                        ? (filter.volunteer_group_id ? t('leaderboard.subtitles.volunteersIn', { name: volunteerGroups.find(g => String(g.id) === String(filter.volunteer_group_id))?.name || t('leaderboard.defaults.group') }) : t('leaderboard.subtitles.allGroups'))
                        : (isViewingOrgLeaderboard
                          ? (loggedInAsOrg ? t('leaderboard.subtitles.yourOrganization') : t('leaderboard.subtitles.topIn', { name: organizations.find(o => (o.organization_id || o.id) == activeOrgId)?.company_name || t('leaderboard.defaults.organization') }))
                          : t('leaderboard.subtitles.worldwide'))}
                    </p>
                  </div>
                </div>

                {showFilters && (
                  <button
                    onClick={toggleFilters}
                    className="hidden lg:flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors backdrop-blur-sm text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {t('leaderboard.hideFilters')}
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-12 gap-2 sm:gap-4 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 bg-[linear-gradient(#FFFFFF80,#FFFFFF80)] border-b-3 border-blue-200 text-xs sm:text-sm font-semibold text-gray-700">
              <div className="col-span-2 md:col-span-2">{t('leaderboard.columns.rank')}</div>
              <div className="col-span-4 md:col-span-4">{t('leaderboard.columns.volunteer')}</div>
              <div className="col-span-3">{t('leaderboard.columns.location')}</div>
              <div className="col-span-3 text-end">{t('leaderboard.columns.points')}</div>
            </div>

            <div className="min-h-[300px] sm:min-h-[400px]">
              <InfiniteScroll
                hasMore={hasMore}
                loading={isFetching && page > 1}
                onLoadMore={loadMoreUsers}
                loader={<LoadingSkeleton />}
                endMessage={
                  <div className="text-center py-6 sm:py-8 text-gray-500">
                    <FaTrophy className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2 sm:mb-3" />
                    <p className="font-semibold text-sm sm:text-base">{t('leaderboard.endTitle')}</p>
                    <p className="text-xs sm:text-sm">{t('leaderboard.endText')}</p>
                  </div>
                }
              >
                {allUsers.length > 0 ? (
                  allUsers.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      rank={user.rank}
                    />
                  ))
                ) : !isLoading ? (
                  <div className="text-center py-12 sm:py-16 text-gray-500">
                    <FaTrophy className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                    <p className="text-lg font-semibold">{t('leaderboard.noData')}</p>
                    <p className="text-sm">{t('leaderboard.adjustFilters')}</p>
                  </div>
                ) : null}
              </InfiniteScroll>
            </div>
          </div>

          <div className="mt-3 sm:mt-4 text-center text-xs sm:text-sm text-gray-500">
            {t('leaderboard.showing', { count: allUsers.length })}
            {(filter.city || filter.state || filter.organization_id || filter.volunteer_group_id) && (
              <span>
                {t('leaderboard.filteredBy')}
                {filter.volunteer_group_id && t('leaderboard.filteredGroup', { name: volunteerGroups.find(g => String(g.id) === String(filter.volunteer_group_id))?.name || t('leaderboard.defaults.group') })}
                {filter.volunteer_group_id && (filter.organization_id || filter.city || filter.state) && t('leaderboard.and')}
                {filter.organization_id && t('leaderboard.filteredOrganization')}
                {!filter.organization_id && filter.city && `${filter.city}`}
                {!filter.organization_id && filter.city && filter.state && ', '}
                {!filter.organization_id && filter.state && `${filter.state}`}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerListWithLeaderBoard;
import React, { useState, useCallback, useEffect } from 'react';
import { FaTrophy } from 'react-icons/fa';
import { UserRow } from '../../components/leaderboard/UserRow';
import { LoadingSkeleton } from '../../components/leaderboard/Loading';
import { InfiniteScroll } from '../../components/InfiniteScroll';
import { useGetVolunteerLeaderboardQuery } from '../../api/volunteer';
import { PAGE_LIMIT } from '../../constant/PAGE_LIMIT';

/**
 * LeaderboardEmbedPage
 * A fully standalone leaderboard — no header, no footer.
 * Served at /leaderboard/embed so it can be safely iframed on any website.
 */
const LeaderboardEmbedPage = () => {
  const [page, setPage] = useState(1);
  const [allUsers, setAllUsers] = useState([]);

  const params = {
    page,
    limit: PAGE_LIMIT.LIMIT,
  };

  const { data, isLoading, isFetching } = useGetVolunteerLeaderboardQuery(params);

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
      } else {
        setAllUsers(prev => [...prev, ...normalizedData]);
      }
    }
  }, [data, page]);

  const hasMore = data ? data.page < data.pages : false;

  const loadMoreUsers = useCallback(() => {
    if (hasMore && !isFetching) setPage(prev => prev + 1);
  }, [hasMore, isFetching]);

  return (
    <div className="lg:h-screen h-auto overflow-hidden flex flex-col" style={{ fontFamily: 'inherit', background: 'transparent' }}>
      <div className="max-w-7xl flex-1 overflow-hidden pt-2 px-2 py-3">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 h-full">
          <div className="w-full flex flex-col overflow-hidden">
            <div className="glass-card overflow-hidden my-2 flex flex-col flex-1">
              <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 bg-white/20 rounded-xl sm:rounded-2xl backdrop-blur-sm">
                      <FaTrophy className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl font-bold text-white">
                        Global Leaderboard
                      </h1>
                      <p className="text-blue-100 text-xs sm:text-sm">
                        Top volunteers worldwide
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="sticky top-0 z-10 grid grid-cols-12 gap-2 sm:gap-4 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 bg-white border-b-3 border-blue-200 text-xs sm:text-sm font-semibold text-gray-700">
                <div className="col-span-2 md:col-span-2">Rank</div>
                <div className="col-span-4 md:col-span-4">Volunteer</div>
                <div className="col-span-3">Location</div>
                <div className="col-span-3 text-right">Points</div>
              </div>
              <div id="scrollableDiv" className="flex-1 overflow-y-auto min-h-0">
                <InfiniteScroll
                  dataLength={allUsers.length}
                  next={loadMoreUsers}
                  hasMore={hasMore}
                  loader={<LoadingSkeleton />}
                  scrollableTarget="scrollableDiv"
                  endMessage={
                    allUsers.length > 0 ? (
                      <div className="text-center py-6 sm:py-8 text-gray-500">
                        <FaTrophy className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mb-2 sm:mb-3" />
                        <p className="font-semibold text-sm sm:text-base">You've reached the end!</p>
                        <p className="text-xs sm:text-sm">No more data to load</p>
                      </div>
                    ) : null
                  }
                >
                  {allUsers.length > 0 ? (
                    allUsers.map((user) => (
                      <UserRow key={user.id} user={user} rank={user.rank} />
                    ))
                  ) : !isLoading ? (
                    <div className="flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px] text-gray-500">
                      <FaTrophy className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mb-3 sm:mb-4" />
                      <p className="text-lg font-semibold">No data found</p>
                    </div>
                  ) : null}
                </InfiniteScroll>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardEmbedPage;


import { useCallback } from "react";
import { useInfiniteFeeds } from "../../api/mission";
import Loader from "../../components/Loader";
import FeedCardComponent from "../../components/FeedCardComponent";
import PostCard from "../../components/PostCard";
import { InfiniteScroll } from "../../components/InfiniteScroll";
import { PAGE_LIMIT } from "../../constant/PAGE_LIMIT";

export default function FeedList() {
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        error,
    } = useInfiniteFeeds({ limit: PAGE_LIMIT.LIMIT });

    const loadMore = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const feeds = data?.pages.flatMap(page => page.feeds ?? []) || [];
    const posts = data?.pages.flatMap(page => page["all-posts"] ?? []) || [];

    const combined = [
        ...feeds.map(f => ({ ...f, _type: "mission" })),
        ...posts.map(p => ({ ...p, _type: "post" })),
    ].sort((a, b) => {
        const dateA = new Date(a.created_at || a.start_time || 0).getTime();
        const dateB = new Date(b.created_at || b.start_time || 0).getTime();
        return dateB - dateA;
    });

    if (isLoading && !combined.length) return <Loader />;

    if (isError)
        return (
            <p className="text-center py-10 text-red-500">
                Failed to load feeds: {error?.response?.data?.message || error?.message}
            </p>
        );

    return (
        <div className="max-w-7xl mx-auto pb-10">
            <h1 className="ml-4 text-lg sm:text-xl font-semibold text-gray-700 mb-6">
                All Feeds
            </h1>
            <InfiniteScroll
                hasMore={hasNextPage}
                loading={isFetchingNextPage}
                onLoadMore={loadMore}
                loader={<div className="py-10"><Loader fullPage={false} /></div>}
                endMessage={
                    <div className="text-center py-10 text-gray-500 font-medium">
                        No more feeds to load.
                    </div>
                }
            >
                <div className="max-w-xl mx-auto space-y-6">
                    {combined.map((item, i) =>
                        item._type === "post" ? (
                            <PostCard key={`post-${item.id ?? i}`} {...item} />
                        ) : (
                            <FeedCardComponent key={`feed-${item.id ?? i}`} {...item} />
                        )
                    )}
                </div>
            </InfiniteScroll>
        </div>
    );
}

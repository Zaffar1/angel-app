import { useCallback } from 'react';
import { useInfiniteOrganizations } from '../../api/organization'
import OrganizationCard from '../../components/OrganizationCard';
import Loader from '../../components/Loader';
import { InfiniteScroll } from '../../components/InfiniteScroll';
import { PAGE_LIMIT } from '../../constant/PAGE_LIMIT';

const OrganizationList = () => {
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        error
    } = useInfiniteOrganizations({ limit: PAGE_LIMIT.LIMIT });

    const loadMoreOrgs = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const organizations = data?.pages.flatMap(page => page.all_orgs) || [];
    const organizationCount = data?.pages[0]?.total || 0;

    if (isLoading && organizations.length === 0) return <Loader />;

    if (isError)
        return (
            <p className="text-center py-10 text-red-500">
                Failed to load organizations: {error?.response?.data?.message || error.message}
            </p>
        );

    return (
        <div className="max-w-7xl mx-auto pb-10">
            <div className="flex justify-between items-center mb-10">
                <div className="">
                    <h2 className="text-2xl font-semibold capitalize">All Organizations</h2>
                    <p className="font-medium text-lg capitalize text-gray-600">Total: {organizationCount}</p>
                </div>
            </div>

            <InfiniteScroll
                hasMore={hasNextPage}
                loading={isFetchingNextPage}
                onLoadMore={loadMoreOrgs}
                loader={<div className="py-10"><Loader fullPage={false} /></div>}
                endMessage={
                    <div className="text-center py-10 text-gray-500 font-medium">
                        No more organizations to load.
                    </div>
                }
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {organizations?.map((organization) => (
                        <OrganizationCard key={organization?.id} {...organization} />
                    ))}
                </div>
            </InfiniteScroll>
        </div>
    )
}

export default OrganizationList;

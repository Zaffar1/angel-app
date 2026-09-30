import React, { useEffect, useCallback, useRef } from 'react';

export const InfiniteScroll = ({
  children,
  hasMore,
  loading,
  onLoadMore,
  threshold = 1.0,
  loader,
  endMessage,
  className = ""
}) => {
  const sentinelRef = useRef(null);

  const handleObserver = useCallback((entries) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasMore && !loading) {
      onLoadMore();
    }
  }, [hasMore, loading, onLoadMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      threshold,
      rootMargin: '100px'
    });

    const currentSentinel = sentinelRef.current;

    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [handleObserver, threshold]);

  return (
    <div className={className}>
      {children}

      <div ref={sentinelRef} className="h-4" />

      {loading && loader}

      {!hasMore && !loading && endMessage}
    </div>
  );
};
export const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="grid grid-cols-12 items-center gap-4 px-6 py-4">
        <div className="col-span-1 flex justify-center">
          <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
        </div>
        <div className="col-span-5 space-y-2">
          <div className="h-5 bg-gray-300 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
        <div className="col-span-3">
          <div className="h-4 bg-gray-300 rounded w-2/3"></div>
        </div>
        <div className="col-span-3">
          <div className="h-6 bg-gray-300 rounded w-1/3 ml-auto"></div>
        </div>
      </div>
    ))}
  </div>
);
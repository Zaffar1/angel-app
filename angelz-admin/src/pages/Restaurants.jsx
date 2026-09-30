import React, { useEffect, useState } from "react";
import { Loader, RestaurantTable } from "../component";
import useFetch from "../hooks/useFetch";
// import RestaurantManagement from "../component/RestaurantManagement";

const Missions = () => {

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState("");
  // const [getData, setGetData] = useState(null);
  const { data, loading, error, refetch } = useFetch("admin/missions", {
    page,
    limit,
    search,
  });

  if (loading) return <p className="text-center"><Loader /></p>;
  if (error) return <p>Error: {error}</p>;
  if (!data || data.length === 0) return <p>No data found.</p>;

  return (
    <>
      <div className="grid grid-cols-1 gap-4">
        <RestaurantTable
          data={data}
          isLoading={loading}
          onActionCompleted={refetch}
        />
      </div>
    </>
  );
};

export default Missions;

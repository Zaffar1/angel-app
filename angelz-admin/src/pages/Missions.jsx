import React, { useState, useEffect } from "react";
import MissionTable from "../component/MissionTable";
import useFetch from "../hooks/useFetch";

const Missions = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState("desc");

  const buildUrl = () => {
    const params = new URLSearchParams({
      page,
      limit,
      search,
      sortBy,
      sortOrder,
    });
    return `/admin/missions?${params.toString()}`;
  };

  const { data, loading, error, refetch } = useFetch(buildUrl());

  useEffect(() => {
    refetch(buildUrl());
  }, [page, limit, search, sortBy, sortOrder, refetch]);

  const handleSortChange = (column, direction) => {
    setSortBy(column);
    setSortOrder(direction);
    setPage(1);
  };

  return (
    <MissionTable
      data={data?.missions || []}
      loading={loading}
      error={error}
      page={data?.pagination?.page || page}
      totalPages={data?.pagination?.totalPages || 1}
      total={data?.pagination?.total || 0}
      limit={limit}
      onPageChange={setPage}
      limitChange={setLimit}
      search={search}
      setSearch={setSearch}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSortChange={handleSortChange}
    />
  );
};

export default Missions;

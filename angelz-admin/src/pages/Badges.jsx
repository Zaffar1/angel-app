import React, { useState } from "react";
import BadgeTable from "../component/BadgeTable";
import useFetch from "../hooks/useFetch";

const Badges = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const { data, loading, error } = useFetch("/admin/badges", {
    page,
    limit,
    search,
  });

  return (
    <BadgeTable
      data={data?.badges || []}
      loading={loading}
      error={error}
      page={data?.page || page}
      totalPages={data?.totalPages || 1}
      total={data?.totalBadges || 0}
      limit={limit}
      onPageChange={setPage}
      limitChange={setLimit}
      search={search}
      setSearch={setSearch}
    />
  );
};

export default Badges;

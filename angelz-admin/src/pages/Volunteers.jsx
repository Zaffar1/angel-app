import React, { useState, useEffect } from "react";
import VolunteerTable from "../component/VolunteerTable";
import useFetch from "../hooks/useFetch";

const Volunteers = () => {
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
    return `/admin/volunteers?${params.toString()}`;
  };

  const url = buildUrl();
  const { data, loading, error } = useFetch(url);

  console.log("[Volunteers Page] API data:", data, "loading:", loading, "error:", error);

  const volunteersList =
    (Array.isArray(data?.volunteers) ? data.volunteers : null) ||
    (Array.isArray(data?.data) ? data.data : null) ||
    (Array.isArray(data?.users) ? data.users : null) ||
    (Array.isArray(data) ? data : null) ||
    [];

  // Cache volunteers for quick lookups and refresh resilience
  useEffect(() => {
    if (volunteersList.length > 0) {
      try {
        const existingRaw = sessionStorage.getItem("admin_volunteers_cache");
        const existing = existingRaw ? JSON.parse(existingRaw) : [];
        const mergedMap = new Map();
        existing.forEach((v) => {
          const key = String(v.id || v._id || v.user_id);
          if (key) mergedMap.set(key, v);
        });
        volunteersList.forEach((v) => {
          const key = String(v.id || v._id || v.user_id);
          if (key) mergedMap.set(key, v);
        });
        sessionStorage.setItem("admin_volunteers_cache", JSON.stringify(Array.from(mergedMap.values())));
      } catch (e) {}
    }
  }, [volunteersList]);

  const totalVolunteers =
    data?.totalVolunteers ??
    data?.total ??
    data?.count ??
    volunteersList.length;

  const totalPages =
    data?.totalPages ??
    data?.pages ??
    (Math.ceil(totalVolunteers / limit) || 1);

  const handleSortChange = (column, direction) => {
    setSortBy(column);
    setSortOrder(direction);
    setPage(1);
  };

  return (
    <VolunteerTable
      data={volunteersList}
      loading={loading}
      error={error}
      page={data?.page || page}
      totalPages={totalPages}
      total={totalVolunteers}
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

export default Volunteers;

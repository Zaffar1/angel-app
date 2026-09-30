import React, { useState } from "react";
import { UserTable } from "../component";
import useFetch from "../hooks/useFetch";

const Users = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const { data, loading, error } = useFetch("/admin/organizations", {
    page,
    limit,
    search,
  });

  console.log("[Organizations Page] API data:", data, "loading:", loading, "error:", error);

  // Extract organizations from any common response format
  const organizationsList =
    (Array.isArray(data?.organizations) ? data.organizations : null) ||
    (Array.isArray(data?.data) ? data.data : null) ||
    (Array.isArray(data) ? data : null) ||
    [];

  // Cache organizations for quick lookups and refresh resilience
  React.useEffect(() => {
    if (organizationsList.length > 0) {
      try {
        const existingRaw = sessionStorage.getItem("admin_orgs_cache");
        const existing = existingRaw ? JSON.parse(existingRaw) : [];
        const mergedMap = new Map();
        existing.forEach((o) => {
          const key = String(o.id || o._id || o.organization_id || o.user_id);
          if (key) mergedMap.set(key, o);
        });
        organizationsList.forEach((o) => {
          const key = String(o.id || o._id || o.organization_id || o.user_id);
          if (key) mergedMap.set(key, o);
        });
        sessionStorage.setItem("admin_orgs_cache", JSON.stringify(Array.from(mergedMap.values())));
      } catch (e) {}
    }
  }, [organizationsList]);

  const totalCount =
    data?.total ??
    data?.count ??
    data?.totalRecords ??
    organizationsList.length;

  const totalPageCount =
    data?.totalPages ??
    data?.pages ??
    (Math.ceil(totalCount / limit) || 1);

  return (
    <UserTable
      data={organizationsList}
      loading={loading}
      error={error}
      page={data?.page || page}
      totalPages={totalPageCount}
      total={totalCount}
      limit={limit}
      onPageChange={setPage}
      limitChange={setLimit}
      search={search}
      setSearch={setSearch}
    />
  );
};

export default Users;
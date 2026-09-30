import React, { useState, useEffect, useCallback } from "react";
import VolunteerGroupTable from "../component/VolunteerGroupTable";
import API from "../utils/Config";

const VolunteerGroups = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVolunteerGroups = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = {
      page,
      limit,
      search: search.trim() || undefined,
      status: status || undefined,
      sortBy,
      sortOrder,
    };

    let result = null;
    let fetchError = null;

    // Strategy 1: Primary admin endpoint: /admin/volunteer-groups
    try {
      const response = await API.get("/admin/volunteer-groups", { params });
      result = response?.data;
    } catch (err1) {
      console.warn("Primary /admin/volunteer-groups failed, trying fallback:", err1?.message);
      fetchError = err1;

      // Strategy 2: Fallback direct endpoint: /volunteer-groups
      try {
        const response2 = await API.get("/volunteer-groups", { params });
        result = response2?.data;
        fetchError = null;
      } catch (err2) {
        console.warn("Fallback /volunteer-groups also failed:", err2?.message);
        fetchError = err2;
      }
    }

    if (result) {
      setData(result);
    } else {
      setError(
        fetchError?.response?.data?.message ||
          fetchError?.message ||
          "Failed to fetch volunteer groups."
      );
    }

    setLoading(false);
  }, [page, limit, search, status, sortBy, sortOrder]);

  useEffect(() => {
    fetchVolunteerGroups();
  }, [fetchVolunteerGroups]);

  const handleSortChange = (column, direction) => {
    setSortBy(column);
    setSortOrder(direction);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatus("");
    setPage(1);
  };

  // Backend response format:
  // { success: true, page, limit, total, totalPages, data: [ ... ], volunteer_groups: [ ... ] }
  const groupsList = data?.volunteer_groups || data?.data || [];
  const totalCount = data?.total ?? groupsList.length;
  const totalPages = data?.totalPages ?? Math.max(1, Math.ceil(totalCount / limit));

  return (
    <div className="p-4 md:p-6 space-y-6">
      <VolunteerGroupTable
        data={groupsList}
        loading={loading}
        error={error}
        page={data?.page || page}
        totalPages={totalPages}
        total={totalCount}
        limit={limit}
        onPageChange={setPage}
        limitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        search={search}
        setSearch={setSearch}
        status={status}
        setStatus={setStatus}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        onResetFilters={handleResetFilters}
      />
    </div>
  );
};

export default VolunteerGroups;

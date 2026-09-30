import React, { useMemo, useState } from "react";
import { FaRegEye } from "react-icons/fa";
import { Link } from "react-router-dom";
import Loader from "./Loader";
import classNames from "classnames";

const VolunteerTable = ({
  data = [],
  loading,
  error,
  page = 1,
  totalPages = 1,
  total = 0,
  limit = 10,
  onPageChange,
  limitChange,
  search,
  setSearch,
  sortBy,
  sortOrder,
  onSortChange,
}) => {

  const handleSort = (key) => {
    let direction = "asc";

    if (sortBy === key && sortOrder === "asc") {
      direction = "desc";
    }

    onSortChange?.(key, direction);
  };

  // sort icon UI
  const sortIcon = (key) => {
    if (sortBy !== key) return "⇅";
    return sortOrder === "asc" ? "▲" : "▼";
  };

  // NO FRONTEND SORTING
  const processedData = useMemo(() => {
    let formatted = (data || [])
      .filter(Boolean)
      .map((vol) => ({
        ...vol,
        name:
          vol?.name ||
          (vol?.first_name ? `${vol.first_name} ${vol.last_name || ""}`.trim() : null) ||
          vol?.username ||
          "Unknown",
        email: vol?.email || "No Email",
        status: vol?.status || "N/A",
      }));

    // frontend search only
    if (search) {
      formatted = formatted.filter(
        (vol) =>
          vol.name.toLowerCase().includes(search.toLowerCase()) ||
          vol.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    return formatted;
  }, [data, search]);

  if (loading) return <div className="text-center"><Loader /></div>;
  if (error) return <div className="text-center text-red-600 font-semibold">{error}</div>;

  return (
    <div className="w-full bg-white shadow-md rounded-lg">

      {/* Header + Search */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-bold text-admin_text_grey">Volunteers</h2>

        <input
          type="text"
          value={search || ""}
          onChange={(e) => {
            setSearch?.(e.target.value);
            onPageChange?.(1);
          }}
          placeholder="Search volunteer name"
          className="p-2 border rounded w-auto"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <div className="max-h-[90vh] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200 table-auto">
            <thead className="bg-gray-200">
              <tr>
                <th
                  className="px-4 py-3 cursor-pointer"
                  onClick={() => handleSort("name")}
                >
                  Name {sortIcon("name")}
                </th>
                <th
                  className="px-4 py-3 cursor-pointer"
                  onClick={() => handleSort("email")}
                >
                  Email {sortIcon("email")}
                </th>
                <th
                  className="px-4 py-3 cursor-pointer"
                  onClick={() => handleSort("status")}
                >
                  Status {sortIcon("status")}
                </th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {processedData.map((vol, index) => (
                <tr
                  key={vol.id || vol._id || vol.user_id || index}
                  className={classNames({ "bg-gray-50": index % 2 === 0 })}
                >
                  <td className="px-4 py-3">{vol.name}</td>
                  <td className="px-4 py-3">{vol.email}</td>

                  <td className="px-4 py-3">
                    <span
                      className={classNames("px-2 py-1 rounded text-white", {
                        "bg-green-600": vol.status === "active",
                        "bg-red-600": vol.status === "inactive",
                      })}
                    >
                      {vol.status?.charAt(0).toUpperCase() + vol.status?.slice(1)}
                    </span>
                  </td>

                <td className="px-4 py-3">
                  <Link
                    to={`/volunteers/${vol.id || vol._id || vol.user_id}`}
                    state={{ volunteer: vol }}
                    onClick={() => {
                      try {
                        sessionStorage.setItem(`cached_volunteer_${vol.id || vol._id || vol.user_id}`, JSON.stringify(vol));
                      } catch (e) {}
                    }}
                    className="inline-flex w-fit items-center gap-1 bg-admin_primary text-white px-2 py-1 rounded-md hover:scale-105 transition no-underline hover:no-underline"
                  >
                    <FaRegEye size={16} />
                    <span>View</span>
                  </Link>
                </td>
                  {/* <td className="px-4 py-3">
                    <Link
                      to={`/volunteer/${vol.id}`}
                      className="flex items-center space-x-1 bg-admin_primary text-white px-2 py-1 rounded-md hover:scale-105 transition"
                    >
                      <FaRegEye size={16} />
                      <span>View</span>
                    </Link>
                  </td> */}
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between p-4 border-t">
        <div className="flex items-center space-x-2">
          <button onClick={() => onPageChange(1)} disabled={page === 1} className="px-1 bg-admin_dark text-white rounded">{"<<"}</button>

          <button onClick={() => onPageChange(page - 1)} disabled={page === 1} className="px-1 bg-admin_dark text-white rounded">{"<"}</button>

          <span>
            Page <strong>{page}</strong> of {totalPages} | Total: {total}
          </span>

          <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages} className="px-1 bg-admin_dark text-white rounded">{">"}</button>

          <button onClick={() => onPageChange(totalPages)} disabled={page === totalPages} className="px-1 bg-admin_dark text-white rounded">{">>"}</button>
        </div>

        <select
          value={limit}
          onChange={(e) => {
            limitChange?.(Number(e.target.value));
            onPageChange?.(1);
          }}
          className="border border-gray-300 rounded p-1"
        >
          {[5, 10, 20, 30, 50, 100].map((size) => (
            <option key={size} value={size}>Show {size}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default VolunteerTable;

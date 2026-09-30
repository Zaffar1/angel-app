import React, { useMemo, useState } from "react";
import { FaRegEye } from "react-icons/fa";
import { Link } from "react-router-dom";
import Loader from "./Loader";
import classNames from "classnames";

const UserTable = ({
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
  setSearch
}) => {

  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  const processedData = useMemo(() => {
    let arr = (data || []).filter(Boolean);

    // Search
    if (search) {
      arr = arr.filter((u) =>
        u.company_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Sorting
    if (sortConfig.key) {
      arr.sort((a, b) => {
        const x = a[sortConfig.key]?.toString().toLowerCase() || "";
        const y = b[sortConfig.key]?.toString().toLowerCase() || "";

        if (x < y) return sortConfig.direction === "asc" ? -1 : 1;
        if (x > y) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return arr;
  }, [data, search, sortConfig]);

  const sortIcon = (key) => {
    if (sortConfig.key !== key) return "⇅";
    return sortConfig.direction === "asc" ? "▲" : "▼";
  };

  if (loading) return <div className="text-center"><Loader /></div>;
  if (error) return <div className="text-center text-red-600 font-semibold">{error}</div>;

  return (
    <div className="w-full bg-white shadow-md rounded-lg">

      {/* Header + Search */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-bold text-admin_text_grey">Organizations</h2>

        <input
          type="text"
          value={search || ""}
          onChange={(e) => {
            setSearch?.(e.target.value);
            onPageChange?.(1);
          }}
          placeholder="Search organization"
          className="p-2 border rounded w-auto"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <div className="max-h-[90vh] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200 table-auto">
            
            {/* Header */}
            <thead className="bg-gray-200">
              <tr>
                <th
                  className="px-4 py-3 cursor-pointer text-left text-xs font-medium text-gray-500 uppercase"
                  onClick={() => handleSort("company_name")}
                >
                  Company Name {sortIcon("company_name")}
                </th>

                <th
                  className="px-4 py-3 cursor-pointer text-left text-xs font-medium text-gray-500 uppercase"
                  onClick={() => handleSort("email")}
                >
                  Email {sortIcon("email")}
                </th>

                <th
                  className="px-4 py-3 cursor-pointer text-left text-xs font-medium text-gray-500 uppercase"
                  onClick={() => handleSort("status")}
                >
                  Status {sortIcon("status")}
                </th>

                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>

            {/* Body */}
            <tbody className="bg-white divide-y divide-gray-200">
              {processedData.map((org, index) => (
                <tr
                  key={org.id || org._id || org.organization_id || index}
                  className={classNames({
                    "bg-gray-50": index % 2 === 0,
                  })}
                >
                  <td className="px-4 py-3 text-base text-gray-700">
                    {org.company_name}
                  </td>

                  <td className="px-4 py-3 text-base text-gray-700">
                    {org.email}
                  </td>

                  <td className="px-4 py-3 text-base text-gray-700">
                    <span
                      className={classNames("px-2 py-1 rounded text-white", {
                        "bg-green-600": org.status === "active",
                        "bg-red-600": org.status === "inactive",
                        "bg-yellow-600": org.status === "pending",
                      })}
                    >
                      {org.status?.charAt(0).toUpperCase() + org.status?.slice(1)}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <Link
                      to={`/organizations/${org.id || org._id || org.organization_id || org.user_id}`}
                      state={{ org }}
                      onClick={() => {
                        try {
                          sessionStorage.setItem(`cached_org_${org.id || org._id || org.organization_id || org.user_id}`, JSON.stringify(org));
                        } catch (e) {}
                      }}
                      className="inline-flex w-fit items-center space-x-1 bg-admin_primary text-white px-2 py-1 rounded-md hover:scale-105 transition no-underline hover:no-underline"
                    >
                      <FaRegEye size={16} />
                      <span>View</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between p-4 border-t">

        {/* Pagination controls */}
        <div className="flex items-center space-x-2">
          <button onClick={() => onPageChange(1)} disabled={page === 1} className="px-1 bg-admin_dark text-white rounded">{"<<"}</button>

          <button onClick={() => onPageChange(page - 1)} disabled={page === 1} className="px-1 bg-admin_dark text-white rounded">{"<"}</button>

          <span>
            Page <strong>{page}</strong> of {totalPages} | Total: {total}
          </span>

          <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages} className="px-1 bg-admin_dark text-white rounded">{">"}</button>

          <button onClick={() => onPageChange(totalPages)} disabled={page === totalPages} className="px-1 bg-admin_dark text-white rounded">{">>"}</button>
        </div>

        {/* Limit Selector */}
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

export default UserTable;

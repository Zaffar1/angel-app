import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import Loader from "./Loader";
import classNames from "classnames";
import { deleteItem } from "../utils/Api";

const BadgeTable = ({
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
}) => {
  const navigate = useNavigate();

  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  // Local state to manage badges after deletion
  const [badgeData, setBadgeData] = useState(data);

  // Update local badge data if parent data changes
  React.useEffect(() => {
    setBadgeData(data);
  }, [data]);

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

  const token = localStorage.getItem("adminToken");

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this badge?")) return;

    try {
      await deleteItem(`/admin/badges/${id}`, token);
      alert("Badge deleted successfully!");
      // Remove deleted badge from local state
      setBadgeData((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      alert("Failed to delete badge");
    }
  };

  const processedData = useMemo(() => {
    let arr = [...badgeData];

    // Search filter
    if (search) {
      arr = arr.filter(
        (b) =>
          b.title?.toLowerCase().includes(search.toLowerCase()) ||
          b.description?.toLowerCase().includes(search.toLowerCase())
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
  }, [badgeData, search, sortConfig]);

  const sortIcon = (key) => {
    if (sortConfig.key !== key) return "⇅";
    return sortConfig.direction === "asc" ? "▲" : "▼";
  };

  if (loading)
    return (
      <div className="text-center">
        <Loader />
      </div>
    );

  if (error)
    return (
      <div className="text-center text-red-600 font-semibold">{error}</div>
    );

  return (
    <div className="w-full bg-white shadow-md rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-bold text-admin_text_grey">Badges</h2>

        <div className="flex gap-2">
          <input
            type="text"
            value={search || ""}
            onChange={(e) => {
              setSearch?.(e.target.value);
              onPageChange?.(1);
            }}
            placeholder="Search badges"
            className="p-2 border rounded"
          />

          <button
            onClick={() => navigate("/badges/create")}
            className="flex items-center gap-2 bg-admin_primary text-white px-3 py-2 rounded"
          >
            <FaPlus size={14} />
            Add Badge
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <div className="max-h-[90vh] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200 table-auto">
            <thead className="bg-gray-200">
              <tr>
                <th
                  className="px-4 py-3 cursor-pointer text-left text-xs font-medium text-gray-500 uppercase"
                  onClick={() => handleSort("title")}
                >
                  Title {sortIcon("title")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Points
                </th>
                <th
                  className="px-4 py-3 cursor-pointer text-left text-xs font-medium text-gray-500 uppercase"
                  onClick={() => handleSort("status")}
                >
                  Status {sortIcon("status")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Description
                </th>
                <th
                  className="px-4 py-3 cursor-pointer text-left text-xs font-medium text-gray-500 uppercase"
                  onClick={() => handleSort("created_at")}
                >
                  Created {sortIcon("created_at")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {processedData.length ? (
                processedData.map((badge, index) => (
                  <tr
                    key={badge.id}
                    className={classNames({ "bg-gray-50": index % 2 === 0 })}
                  >
                    <td className="px-4 py-3 text-base text-gray-700">
                      {badge.title}
                    </td>
                    <td className="px-4 py-3 text-base text-gray-700">
                      {badge.min_points} – {badge.max_points}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={classNames(
                          "px-2 py-1 rounded text-white text-sm uppercase",
                          {
                            "bg-green-600": badge.status === "active",
                            "bg-red-600": badge.status === "inactive",
                          }
                        )}
                      >
                        {badge.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {badge.description || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {new Date(badge.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => navigate(`/badges/edit/${badge.id}`)}
                          className="text-blue-600 hover:scale-110 transition"
                          title="Edit"
                        >
                          <FaEdit size={16} />
                        </button>

                        <button
                          onClick={() => handleDelete(badge.id)}
                          className="text-red-600 hover:scale-110 transition"
                          title="Delete"
                        >
                          <FaTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-4 text-center">
                    No badges found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between p-4 border-t">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(1)}
            disabled={page === 1}
            className="px-1 bg-admin_dark text-white rounded"
          >
            {"<<"}
          </button>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="px-1 bg-admin_dark text-white rounded"
          >
            {"<"}
          </button>

          <span>
            Page <strong>{page}</strong> of {totalPages} | Total: {total}
          </span>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="px-1 bg-admin_dark text-white rounded"
          >
            {">"}
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={page === totalPages}
            className="px-1 bg-admin_dark text-white rounded"
          >
            {">>"}
          </button>
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
            <option key={size} value={size}>
              Show {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default BadgeTable;

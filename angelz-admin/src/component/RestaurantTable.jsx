import React, { useMemo, useState, useCallback } from "react";
import { useTable, useSortBy, usePagination } from "react-table";
import { Link } from "react-router-dom";
import { fallback } from "../assets";
import { ApproveIcon, BlockIcon, UnblockIcon, ViewIcon } from "./IconComponent";
import Modal from "./Modal";
import Loader from "./Loader";
import {
  approveHotel,
  toggleBlockUnblockHotel,
  toggleFeaturedHotel,
} from "../utils/Api";
import { useSelector } from "react-redux";
import classNames from "classnames";
import { FaBan, FaCheck, FaClock } from "react-icons/fa";
import { restrictWordCount } from "../utils/HelperFun";

const RestaurantTable = ({ data = [], isLoading, onActionCompleted }) => {
  const [filterInput, setFilterInput] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [actionType, setActionType] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const token = useSelector((state) => state.auth.userData?.token);

  const handleAction = useCallback(async () => {
    setIsUpdating(true);
    try {
      if (actionType === "approve") {
        await approveHotel(selectedId, { is_approved: true }, token);
      } else if (actionType === "block") {
        await toggleBlockUnblockHotel(selectedId, { status: "block" }, token);
      } else if (actionType === "unblock") {
        await toggleBlockUnblockHotel(selectedId, { status: "active" }, token);
      }
      onActionCompleted();
      setShowModal(false);
    } catch (error) {
      console.error(`Error in ${actionType}:`, error);
      setShowModal(false);
    } finally {
      setIsUpdating(false);
    }
  }, [actionType, selectedId, token, onActionCompleted]);

  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.filter((item) =>
      (item.name || "").toLowerCase().includes(filterInput.toLowerCase())
    );
  }, [data, filterInput]);

  const handleToggleFeatured = useCallback(
    async (id, isFeatured) => {
      try {
        // Call the API to toggle the featured status
        await toggleFeaturedHotel(id, { is_featured: !isFeatured });

        // Notify that the action is completed
        onActionCompleted();
      } catch (error) {
        console.error("Error toggling featured status:", error.message);
      }
    },
    [onActionCompleted]
  );

  const columns = useMemo(
    () => [
      // {
      //   Header: "Image",
      //   accessor: "profile_image",
      //   Cell: ({ value }) => (
      //     <img
      //       src={value || fallback}
      //       alt="Profile"
      //       className="w-10 h-10 object-cover rounded-full"
      //     />
      //   ),
      // },
      {
        Header: "Name",
        accessor: "name",
        Cell: ({ row }) => (
          <Link
            to={`/Missions/${row.original.id}`}
            className="text-base font-semibold text-admin_dark no-underline"
          >
            {row.values.name || "No Name"}
          </Link>
        ),
      },
      {
        Header: "Description",
        accessor: "description",
        Cell: ({ value }) => (
          <div className="w-[250px] text-balance overflow-y-scroll max-h-24">
            {restrictWordCount(value || "No Description")}
          </div>
        ),
      },

      {
        Header: "Address",
        accessor: "address",
        Cell: ({ value }) => value || "No Address",
      },
      {
        Header: "Status",
        accessor: "status",
        Cell: ({ row }) => {
          const { is_approved, status } = row.original;

          if (!is_approved) {
            return (
              <span className="flex items-center text-yellow-500">
                <FaClock />
                <span className="ml-1">Pending</span>
              </span>
            );
          }

          // Display status based on the `status` value
          if (status === "active") {
            return (
              <span className="flex items-center text-green-500">
                <FaCheck />
                <span className="ml-1">Approved</span>
              </span>
            );
          } else if (status === "block") {
            return (
              <span className="flex items-center text-red-500">
                <FaBan /> <span className="ml-1">Blocked</span>
              </span>
            );
          }

          // Return empty string if status is not defined
          return <span className="text-gray-500">N/A</span>;
        },
      },
      {
        Header: "Actions",
        Cell: ({ row }) => {
          const { is_approved, status, id } = row.original;

          const is_checker = Boolean(!is_approved == 0);

          return (
            <div className="flex items-center space-x-2">
              <Link
                to={`/Missions/${row.original.id}`}
                className="text-blue-500 no-underline hover:no-underline flex items-center"
                title="View Details"
              >
                <ViewIcon />
              </Link>
              {!is_checker && (
                <ApproveIcon
                  onClick={() => {
                    setSelectedId(id);
                    setActionType("approve");
                    setShowModal(true);
                  }}
                  title="Approve"
                />
              )}
              {is_checker && status === "block" && (
                <UnblockIcon
                  onClick={() => {
                    setSelectedId(id);
                    setActionType("unblock");
                    setShowModal(true);
                  }}
                  title="Unblock"
                />
              )}
              {is_checker && status === "active" && (
                <BlockIcon
                  onClick={() => {
                    setSelectedId(id);
                    setActionType("block");
                    setShowModal(true);
                  }}
                  title="Block"
                />
              )}
            </div>
          );
        },
      },
      {
        Header: "Featured",
        accessor: "is_featured",
        Cell: ({ row }) => {
          const { id, is_featured } = row.original;

          // Handle toggle switch change
          const handleChange = () => {
            handleToggleFeatured(id, is_featured);
          };

          return (
            <div className="flex items-center">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={is_featured}
                  onChange={handleChange}
                  className="form-checkbox h-4 w-8 text-blue-500"
                />
                {/* <span className="ml-2 block w-10 h-5 bg-gray-200 rounded-full relative">
                  <span
                    className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform ${
                      is_featured ? "transform translate-x-5" : ""
                    }`}
                  ></span>
                </span> */}
              </label>
              <span className="mr-2 text-admin_text_grey">
                {is_featured ? "Yes" : "No"}
              </span>
            </div>
          );
        },
      },
    ],
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    state: { pageIndex, pageSize },
    canPreviousPage,
    canNextPage,
    pageOptions,
    gotoPage,
    previousPage,
    nextPage,
    setPageSize,
  } = useTable(
    {
      columns,
      data: filteredData,
      initialState: { pageIndex: 0, pageSize: 10 },
    },
    useSortBy,
    usePagination
  );

  if (isLoading || isUpdating) {
    return <Loader />;
  }

  // if (filteredData.length === 0) {
  //   return <p className="text-center text-gray-500">No data found.</p>;
  // }

  return (
    <div className="w-full bg-white shadow-md rounded-lg">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg sm:text-lg font-bold text-admin_text_grey">
          Missions
        </h2>
        <input
          type="text"
          value={filterInput}
          onChange={(e) => setFilterInput(e.target.value || "")}
          placeholder="Search by name"
          className="p-2 border rounded w-auto"
        />
      </div>
      {/* {filteredData.length === 0 ? (
        <p className="text-center text-gray-500 pt-3">No data found.</p>
      ) : ( */}
        <div className="overflow-x-auto">
          <table
            {...getTableProps()}
            className="min-w-full divide-y  divide-gray-200"
          >
            <thead className="bg-gray-200">
              {headerGroups.map((headerGroup) => (
                <tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map((column) => (
                    <th
                      {...column.getHeaderProps(column.getSortByToggleProps())}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {column.render("Header")}
                      <span>
                        {column.isSorted
                          ? column.isSortedDesc
                            ? " 🔽"
                            : " 🔼"
                          : " 🔽"}
                      </span>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody
              {...getTableBodyProps()}
              className="bg-white divide-y divide-gray-200"
            >
              {page.map((row, index) => {
                prepareRow(row);
                return (
                  <tr
                    {...row.getRowProps()}
                    className={classNames({
                      "opacity-50 cursor-not-allowed":
                        row.original.status === "block",
                      "bg-gray-50": index % 2 === 0, // Apply stripe effect
                    })}
                  >
                    {row.cells.map((cell) => (
                      <td
                        {...cell.getCellProps()}
                        className="px-4 py-3 whitespace-nowrap text-base text-gray-700"
                      >
                        {cell.render("Cell")}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      

      <div className="flex items-center justify-between p-4 border-t">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => gotoPage(0)}
            disabled={!canPreviousPage}
            className="px-1 py-0 bg-admin_dark text-white rounded"
            title="First Page"
          >
            {"<<"}
          </button>
          <button
            onClick={() => previousPage()}
            disabled={!canPreviousPage}
            className="px-1 py-0 bg-admin_dark text-white rounded"
            title="Previous Page"
          >
            {"<"}
          </button>
          <span>
            Page{" "}
            <strong>
              {pageIndex + 1} of {pageOptions.length}
            </strong>{" "}
          </span>
          <button
            onClick={() => nextPage()}
            disabled={!canNextPage}
            className="px-1 py-0 bg-admin_dark text-white rounded"
            title="Next Page"
          >
            {">"}
          </button>
          <button
            onClick={() => gotoPage(pageOptions.length - 1)}
            disabled={!canNextPage}
            className="px-1 py-0 bg-admin_dark text-white rounded"
            title="Last Page"
          >
            {">>"}
          </button>
        </div>
        <select
          className="border border-gray-300 rounded p-1"
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
        >
          {[5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 99].map((size) => (
            <option key={size} value={size}>
              Show {size}
            </option>
          ))}
        </select>
      </div>

      {showModal && (
        <Modal
          show={showModal}
          onClose={() => setShowModal(false)}
          onConfirm={handleAction}
          title={`Confirm ${
            actionType === "approve"
              ? "Approval"
              : actionType === "block"
              ? "Block"
              : "Unblock"
          }`}
        >
          {isUpdating ? (
            <Loader />
          ) : (
            <p>
              Are you sure you want to{" "}
              {actionType === "approve"
                ? "approve"
                : actionType === "block"
                ? "block"
                : "unblock"}{" "}
              this restaurant?
            </p>
          )}
        </Modal>
      )}
    </div>
  );
};

export default RestaurantTable;

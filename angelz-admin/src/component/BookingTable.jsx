import React, { useState, useMemo } from "react";
import { useTable, useSortBy, usePagination } from "react-table";
import { Link } from "react-router-dom";
import Loader from "./Loader";
import { FaEye, FaBan } from "react-icons/fa";
import classNames from "classnames";

const BookingTable = ({ data = [], loading, error }) => {
  const [search, setSearch] = useState("");

  const filteredData = useMemo(
    () =>
      data.filter((booking) => {
        const restaurantName = booking.hotel?.name || "";
        const userName = booking.user?.name || "";
        return (
          restaurantName.toLowerCase().includes(search.toLowerCase()) ||
          userName.toLowerCase().includes(search.toLowerCase())
        );
      }),
    [data, search]
  );

  const columns = useMemo(
    () => [
      {
        Header: "Restaurant Name",
        accessor: (booking) =>
          (
            <h4 className="text-base font-semibold text-admin_dark no-underline capitalize">
              {" "}
              {booking.hotel?.restaurant_name}
            </h4>
          ) || "",
      },
      {
        Header: "User Name",
        accessor: (booking) => booking.user?.name || "Guest",
      },
      {
        Header: "Date",
        accessor: "date",
      },
      {
        Header: "Time",
        accessor: "time",
      },
      // {
      //   Header: "Actions",
      //   accessor: "id",
      //   Cell: ({ row }) => (
      //     <div className="flex space-x-2">
      //       {/* <Link to={`/bookings/${row.original.id}`}>
      //         <FaEye className="text-blue-500 hover:text-blue-700" />
      //       </Link> */}

      //       <span className="flex items-center space-x-1 text-base bg-red-600 text-white px-2 py-1 rounded-md  no-underline cursor-pointer transition-transform duration-200 ease-in-out transform hover:scale-105">
      //         <FaBan
      //           onClick={() =>
      //             console.log(`Block booking with ID: ${row.original.id}`)
                  
      //           }
      //           size={14}
      //         />
      //         <span>Block</span>
      //       </span>
      //     </div>
      //   ),
      // },
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

  if (loading)
    return (
      <p className="text-center">
        <Loader />
      </p>
    );
  if (error) return <p className="text-center">Error: {error}</p>;

  return (
    <div className="w-full bg-white shadow-md rounded-lg">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg sm:text-lg font-bold text-admin_text_grey">
          Bookings
        </h2>
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name"
            className="p-2 border rounded w-auto"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table
          {...getTableProps()}
          className="min-w-full divide-y divide-gray-200"
        >
          <thead className="bg-gray-200">
            {headerGroups.map((headerGroup) => (
              <tr key={headerGroup.id} {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column) => (
                  <th
                    key={column.id}
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column.render("Header")}
                    <span>
                      {column.isSorted
                        ? column.isSortedDesc
                          ? " 🔽"
                          : " 🔼"
                        : "🔽"}
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
                  key={row.id}
                  {...row.getRowProps()}
                  className={classNames({
                    "opacity-50 cursor-not-allowed":
                      row.original.status === "block",
                    "bg-gray-50": index % 2 === 0, // Apply stripe effect
                  })}
                >
                  {row.cells.map((cell) => (
                    <td
                      key={cell.column.id}
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
          >
            {"<<"}
          </button>
          <button
            onClick={() => previousPage()}
            disabled={!canPreviousPage}
            className="px-1 py-0 bg-admin_dark text-white rounded"
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
          >
            {">"}
          </button>
          <button
            onClick={() => gotoPage(pageOptions.length - 1)}
            disabled={!canNextPage}
            className="px-1 py-0 bg-admin_dark text-white rounded"
          >
            {">>"}
          </button>
        </div>
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className="border border-gray-300 rounded p-1"
        >
          {[5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 99].map((size) => (
            <option key={size} value={size}>
              Show {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default BookingTable;

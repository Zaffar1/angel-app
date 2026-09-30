import React, { useState, useMemo } from "react";
import { useTable, usePagination } from "react-table";
import Loader from "./Loader"; // Assuming you have this component

const NewsletterTable = ({ data = [], loading, error }) => {
  const [search, setSearch] = useState("");

  // Process the data, providing a default for email only
  const processedData = useMemo(() => {
    return data.map((subscriber) => ({
      email: subscriber.email || "N/A",
    }));
  }, [data]);

  // Filter the data based on the search query (search by email)
  const filteredData = useMemo(
    () =>
      processedData.filter((subscriber) =>
        subscriber.email.toLowerCase().includes(search.toLowerCase())
      ),
    [processedData, search]
  );

  // Define the table columns (only email column)
  const columns = useMemo(
    () => [
      {
        Header: "Email",
        accessor: "email",
      },
    ],
    []
  );

  // Use react-table hooks
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
    usePagination
  );

  // Render loading or error states
  if (loading)
    return (
      <p className="text-center">
        <Loader />
      </p>
    );
  if (error) return <p className="text-center">Error: {error}</p>;

  return (
    <div className="w-full bg-white shadow-md rounded-lg">
      {/* Search input */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg sm:text-lg font-bold text-admin_text_grey">
          Newsletter Subscribers
        </h2>
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email"
            className="p-2 border rounded w-auto"
          />
        </div>
      </div>

      {/* Table */}
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
                    {...column.getHeaderProps()}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column.render("Header")}
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
                <tr key={row.id} {...row.getRowProps()} className="bg-gray-50">
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

      {/* Pagination */}
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
          {[5, 10, 20, 30, 40, 50].map((size) => (
            <option key={size} value={size}>
              Show {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default NewsletterTable;

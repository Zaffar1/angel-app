import React, { useMemo } from "react";
import { FaRegEye } from "react-icons/fa";
import { Link } from "react-router-dom";
import Loader from "./Loader";
import classNames from "classnames";
import { getStatusClass, formatStatus } from "../utils/missionStatusUtils";

const MissionTable = ({
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

  const sortIcon = (key) => {
    if (sortBy !== key) return "⇅";
    return sortOrder === "asc" ? "▲" : "▼";
  };

  // ---------- PROCESS & SEARCH (NO FRONTEND SORTING) ----------
  const processedData = useMemo(() => {
    let formatted = (data || []).map((mission) => ({
      ...mission,
      name: mission?.name ?? "Untitled Mission",
      mission_type: mission?.mission_type ?? "N/A",
      organization_name:
        mission.company_name ??
        mission?.organization?.company_name ??
        "N/A",
      status: mission?.status ?? "N/A",
    }));

    if (search) {
      formatted = formatted.filter((mission) =>
        mission.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    return formatted;
  }, [data, search]);

  if (loading) return <div className="text-center"><Loader /></div>;
  if (error) return <div className="text-center text-red-600 font-semibold">{error}</div>;

  return (
    <div className="w-full bg-white shadow-md rounded-lg">

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-bold text-admin_text_grey">Missions</h2>

        <input
          type="text"
          value={search || ""}
          onChange={(e) => {
            setSearch?.(e.target.value);
            onPageChange?.(1);
          }}
          placeholder="Search missions"
          className="p-2 border rounded"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[90vh]">
        <table className="min-w-full divide-y divide-gray-200 table-auto">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort("name")}>
                Mission Name {sortIcon("name")}
              </th>

              <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort("mission_type")}>
                Type {sortIcon("mission_type")}
              </th>

              <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort("organization_name")}>
                Organization {sortIcon("organization_name")}
              </th>

              <th className="px-4 py-3">Required</th>
              <th className="px-4 py-3">Applied</th>
              <th className="px-4 py-3">Assigned</th>

              <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort("status")}>
                Status {sortIcon("status")}
              </th>

              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {processedData.map((mission, index) => (
              <tr
                key={mission.id || index}
                className={classNames({ "bg-gray-50": index % 2 === 0 })}
              >
                <td className="px-4 py-3">{mission.name}</td>
                <td className="px-4 py-3">{mission.mission_type}</td>
                <td className="px-4 py-3">{mission.organization_name}</td>
                <td className="px-4 py-3 text-center">{mission.volunteer_required}</td>
                <td className="px-4 py-3 text-center">{mission.applied_count}</td>
                <td className="px-4 py-3 text-center">{mission.assigned_count}</td>

                <td className="px-4 py-3">
                  <span
                    className={classNames(
                      "px-2 py-1 rounded text-xs font-semibold whitespace-nowrap",
                      getStatusClass(mission.status)
                    )}
                  >
                    {formatStatus(mission.status)}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <Link
                    to={`/missions/${mission.id}`}
                    state={{ mission }}
                    className="inline-flex items-center gap-1 bg-admin_primary text-white px-2 py-1 rounded-md hover:scale-105 transition no-underline hover:no-underline"
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

      {/* Pagination */}
      <div className="flex items-center justify-between p-4 border-t">
        <div className="flex items-center space-x-2">
          <button onClick={() => onPageChange(1)} disabled={page === 1}>{"<<"}</button>
          <button onClick={() => onPageChange(page - 1)} disabled={page === 1}>{"<"}</button>

          <span>
            Page <strong>{page}</strong> of {totalPages} | Total: {total}
          </span>

          <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>{">"}</button>
          <button onClick={() => onPageChange(totalPages)} disabled={page === totalPages}>{">>"}</button>
        </div>

        <select
          value={limit}
          onChange={(e) => {
            limitChange?.(Number(e.target.value));
            onPageChange?.(1);
          }}
          className="border rounded p-1"
        >
          {[5, 10, 20, 30, 50, 100].map((size) => (
            <option key={size} value={size}>Show {size}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default MissionTable;


// import React, { useMemo, useState } from "react";
// import { FaRegEye } from "react-icons/fa";
// import { Link } from "react-router-dom";
// import Loader from "./Loader";
// import classNames from "classnames";

// const MissionTable = ({
//   data = [],
//   loading,
//   error,
//   page = 1,
//   totalPages = 1,
//   total = 0,
//   limit = 10,
//   onPageChange,
//   limitChange,
//   search,
//   setSearch
// }) => {

// const MissionTable = ({
//   ...
//   sortBy,
//   sortOrder,
//   onSortChange
// })

// const handleSort = (key) => {
//   let direction = "asc";

//   if (sortBy === key && sortOrder === "asc") {
//     direction = "desc";
//   }

//   onSortChange(key, direction);
// };


//   // ------- Process, Filter, Sort -------
//   const processedData = useMemo(() => {
//     let formatted = (data || []).map((mission) => ({
//       ...mission,
//       name: mission?.name ?? "Untitled Mission",
//       mission_type: mission?.mission_type ?? "N/A",
//       organization_name: mission.company_name ?? mission?.organization?.company_name ?? "N/A",
//       status: mission?.status ?? "N/A",
//     }));

//     // Searching
//     if (search) {
//       formatted = formatted.filter((mission) =>
//         mission.name.toLowerCase().includes(search.toLowerCase())
//       );
//     }

//     // Sorting
//     const processedData = useMemo(() => {
//       let formatted = (data || []).map((mission) => ({
//         ...mission,
//         name: mission?.name ?? "Untitled Mission",
//         mission_type: mission?.mission_type ?? "N/A",
//         organization_name: mission.company_name ?? "N/A",
//         status: mission?.status ?? "N/A",
//       }));

//       if (search) {
//         formatted = formatted.filter((mission) =>
//           mission.name.toLowerCase().includes(search.toLowerCase())
//         );
//       }

//       return formatted;
//     }, [data, search]);


//     return formatted;
//   }, [data, search, sortConfig]);

//   if (loading) return <div className="text-center"><Loader /></div>;
//   if (error) return <div className="text-center text-red-600 font-semibold">{error}</div>;

//   const sortIcon = (key) => {
//     if (sortBy !== key) return "⇅";
//     return sortOrder === "asc" ? "▲" : "▼";
//   };


//   return (
//     <div className="w-full bg-white shadow-md rounded-lg">

//       {/* Header */}
//       <div className="flex items-center justify-between p-4 border-b">
//         <h2 className="text-lg font-bold text-admin_text_grey">Missions</h2>

//         <input
//           type="text"
//           value={search || ""}
//           onChange={(e) => {
//             setSearch?.(e.target.value);
//             onPageChange?.(1);
//           }}
//           placeholder="Search missions"
//           className="p-2 border rounded w-auto"
//         />
//       </div>

//       {/* Table */}
//       <div className="overflow-x-auto">
//         <div className="max-h-[90vh] overflow-y-auto">
//           <table className="min-w-full divide-y divide-gray-200 table-auto">
//             <thead className="bg-gray-200">
//               <tr>
//                 <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort("name")}>
//                   Mission Name {sortIcon("name")}
//                 </th>

//                 <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort("mission_type")}>
//                   Type {sortIcon("mission_type")}
//                 </th>

//                 <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort("organization_name")}>
//                   Organization {sortIcon("organization_name")}
//                 </th>

//                 <th className="px-4 py-3">Required</th>
//                 <th className="px-4 py-3">Applied</th>
//                 <th className="px-4 py-3">Assigned</th>

//                 <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort("status")}>
//                   Status {sortIcon("status")}
//                 </th>

//                 <th className="px-4 py-3">Actions</th>
//               </tr>
//             </thead>

//             <tbody className="bg-white divide-y divide-gray-200">
//               {processedData.map((mission, index) => (
//                 <tr
//                   key={mission.id || index}
//                   className={classNames({ "bg-gray-50": index % 2 === 0 })}
//                 >
//                   <td className="px-4 py-3">{mission.name}</td>
//                   <td className="px-4 py-3">{mission.mission_type}</td>
//                   <td className="px-4 py-3">{mission.organization_name}</td>
//                   <td className="px-4 py-3 text-center">{mission.volunteer_required}</td>
//                   <td className="px-4 py-3 text-center">{mission.applied_count}</td>
//                   <td className="px-4 py-3 text-center">{mission.assigned_count}</td>

//                   <td className="px-4 py-3">
//                     <span
//                       className={classNames("px-2 py-1 rounded text-white", {
//                         "bg-yellow-500": mission.status === "requested",
//                         "bg-green-600": mission.status === "active",
//                         "bg-red-600": mission.status === "inactive",
//                       })}
//                     >
//                       {mission.status.charAt(0).toUpperCase() + mission.status.slice(1)}
//                     </span>
//                   </td>

//                   <td className="px-4 py-3">
//                     <Link
//                       to={`/mission/${mission.id}`}
//                       className="inline-flex w-fit items-center space-x-1 bg-admin_primary text-white px-2 py-1 rounded-md hover:scale-105 transition"
//                     >
//                       <FaRegEye size={16} />
//                       <span>View</span>
//                     </Link>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>

//           </table>
//         </div>
//       </div>

//       {/* Pagination */}
//       <div className="flex items-center justify-between p-4 border-t">
//         <div className="flex items-center space-x-2">
//           <button onClick={() => onPageChange(1)} disabled={page === 1} className="px-1 bg-admin_dark text-white rounded">{"<<"}</button>

//           <button onClick={() => onPageChange(page - 1)} disabled={page === 1} className="px-1 bg-admin_dark text-white rounded">{"<"}</button>

//           <span>
//             Page <strong>{page}</strong> of {totalPages} | Total: {total}
//           </span>

//           <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages} className="px-1 bg-admin_dark text-white rounded">{">"}</button>

//           <button onClick={() => onPageChange(totalPages)} disabled={page === totalPages} className="px-1 bg-admin_dark text-white rounded">{">>"}</button>
//         </div>

//         <select
//           value={limit}
//           onChange={(e) => {
//             limitChange?.(Number(e.target.value));
//             onPageChange?.(1);
//           }}
//           className="border border-gray-300 rounded p-1"
//         >
//           {[5, 10, 20, 30, 50, 100].map((size) => (
//             <option key={size} value={size}>Show {size}</option>
//           ))}
//         </select>
//       </div>
//     </div>
//   );
// };

// export default MissionTable;

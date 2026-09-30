import React from "react";
import {
  FaCheck,
  FaBan,
  FaUndo,
  FaRegEye,
} from "react-icons/fa";
import Tooltip from "./Tooltip"; // Import the Tooltip component

const iconBaseStyles =
  "cursor-pointer transition-transform duration-200 ease-in-out transform hover:scale-110 p-2 rounded-full";

const ApproveIcon = ({ onClick }) => (
  <Tooltip text="Approve">
    <div
      className={`bg-green-600 hover:bg-green-700 text-white ${iconBaseStyles} shadow-md`}
      onClick={onClick}
    >
      <FaCheck size={14} />
    </div>
  </Tooltip>
);

const BlockIcon = ({ onClick }) => (
  <Tooltip text="Block">
    <div
      className={`bg-red-600 hover:bg-red-700 text-white ${iconBaseStyles} shadow-md`}
      onClick={onClick}
    >
      <FaBan size={14} />
    </div>
  </Tooltip>
);

const UnblockIcon = ({ onClick }) => (
  <Tooltip text="Unblock">
    <div
      className={`bg-yellow-600 hover:bg-yellow-700 text-white ${iconBaseStyles} shadow-md`}
      onClick={onClick}
    >
      <FaUndo size={14} />
    </div>
  </Tooltip>
);

const ViewIcon = ({ onClick }) => (
  <Tooltip text="View Details">
    <div
      className={`bg-admin_dark hover:bg-admin_primary text-white ${iconBaseStyles} shadow-md`}
      onClick={onClick}
    >
      <FaRegEye size={14} />
    </div>
  </Tooltip>
);

export { ApproveIcon, BlockIcon, UnblockIcon, ViewIcon };

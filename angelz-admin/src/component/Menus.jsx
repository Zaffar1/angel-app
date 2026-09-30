import React, { useState } from "react";
import { FaArrowRight } from "react-icons/fa";
import useMenu from "../hooks/useMenu";
import Loader from "./Loader";

const Menus = () => {
  const {
    menus,
    loading,
    error,
    addNewMenu,
    updateExistingMenu,
    deleteExistingMenu,
    refetchMenus,
  } = useMenu();

  const [selectedMenu, setSelectedMenu] = useState(null);
  const [menuName, setMenuName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleEditMenu = (menu) => {
    setSelectedMenu(menu);
    setMenuName(menu.name);
  };

  const handleAddOrUpdateMenu = async () => {
    if (isProcessing) return; // Prevent further action while processing

    setIsProcessing(true);

    try {
      if (selectedMenu) {
        // Update existing menu
        await updateExistingMenu(selectedMenu.id, { name: menuName.trim() });
        setSelectedMenu(null);
      } else if (menuName.trim()) {
        // Add new menu
        await addNewMenu({ name: menuName.trim() });
      }
      setMenuName("");
      // Refetch menus after successful add/update
      await refetchMenus();
    } catch (err) {
      console.error(
        selectedMenu ? "Error updating menu:" : "Error adding menu:",
        err
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteMenu = async (menuId) => {
    if (isProcessing) return; // Prevent further action while processing

    try {
      await deleteExistingMenu(menuId);
      // Refetch menus after successful delete
      await refetchMenus();
    } catch (err) {
      console.error("Error deleting menu:", err);
    }
  };

  if (loading) return <Loader />;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg sm:text-lg font-bold text-admin_text_grey mb-3 capitalize">
          Add/Update Menu
        </h2>
        <input
          id="menu-name"
          type="text"
          value={menuName}
          onChange={(e) => setMenuName(e.target.value)}
          className="p-2 border rounded w-full"
          placeholder="Enter menu name"
        />
         <p className="text-red-500 text-sm">
          {menuName === "" && "Kitchen name is required."}
        </p>
        <button
          // onClick={handleAddOrUpdateMenu}
          onClick={() => {
            if (!menuName) {
              alert("Kitchen name is required.");
              return;
            }
            handleAddOrUpdateMenu();
          }}
          className={`p-2 mt-2 ${
            isProcessing
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-admin_primary hover:bg-pink-700"
          } text-white rounded`}
          disabled={isProcessing}
        >
          {isProcessing
            ? "Processing..."
            : selectedMenu
            ? "Update Menu"
            : "Add Menu"}
        </button>
      </div>

      <div className="flex flex-wrap gap-4">
        {menus.map((menu) => (
          <div
            key={menu.id}
            className="flex items-center space-x-2 bg-white border rounded-lg p-2 shadow-md"
          >
            <div className="text-lg">
              <FaArrowRight />
            </div>
            <span>{menu.name}</span>
            <button
              onClick={() => handleEditMenu(menu)}
              className="text-blue-500 text-xs"
            >
              Edit
            </button>
            <button
              onClick={() => handleDeleteMenu(menu.id)}
              className="text-red-500 text-xs"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Menus;

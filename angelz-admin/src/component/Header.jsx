import React, { useState } from "react";
import { Logo } from "../assets";
import { LuSearch } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import LogoutBtn from "./LogoutBtn";

const Header = ({ toggleSidebar }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();

  // Function to handle search input change
  const handleSearch = (value) => {
    setSearchTerm(value);
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }
    const filteredSuggestions = data.filter((item) =>
      item.name.toLowerCase().includes(value.toLowerCase())
    );
    setSuggestions(filteredSuggestions);
  };

  // Function to navigate to the selected card
  const navigateToCard = (id) => {
    navigate(`/restaurant/${id}`); // Navigate to restaurant detail page
    setSearchTerm(""); // Clear search input after navigation
    setSuggestions([]); // Clear suggestions after navigation
  };

  return (
    <>
      <header className="bg-white w-full">
        <div className="flex items-center justify-between py-3 px-3">
          <div className="flex space-x-6">
          <img src={Logo} alt="logo" className="w-40" />
            <FaBars
              size={24}
              className="bg-admin_primary mr-2 rounded-full w-8 h-8 py-1 px-2 text-white cursor-pointer hover:bg-admin_dark"
              onClick={toggleSidebar}
            />
          </div>
          <div className="flex items-center hidden">
            
            <span
              className={`sm:ml-5 px-2 ml-0 py-1 w-48 sm:w-64 xl:w-64 2xl:w-96 border outline-none focus:bg-gray-50 bg-gray-50 text-black rounded-full duration-200  border-gray-200 flex` }
            >
              <LuSearch
                size={24}
                className=" mr-2 rounded-full w-8 h-8 p-1 text-gray-400"
                onClick={() => handleSearch(searchTerm)}
              />
              <input
                type="text"
                placeholder={"Search here.."}
                className={`w-full outline-none bg-gray-50`}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </span>
            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-12 mt-1 bg-white border border-gray-300 shadow-md rounded-lg z-10">
                {suggestions.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => navigateToCard(item.id)}
                  >
                    {item.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex space-between items-center">
            {/* <img
              src=""
              alt="admin"
              className="rounded-full w-10 h-10 bg-slate-300"
            /> */}
            <h6 className="m-0 pl-2 text-sm">
              Hello, <strong>Admin</strong>
            </h6>
            <span className="mx-2">|</span>
            <LogoutBtn />
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
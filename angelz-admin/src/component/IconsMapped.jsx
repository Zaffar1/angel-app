import { FaChartBar, FaMoneyBill, FaMugHot, FaUsers } from "react-icons/fa";
const IconMap = {
  UserIcon: (
    <FaUsers
      className="rounded-lg bg-purple-100 p-2 w-14 h-14"
      color="#8280FF"
    />
  ),
  RestaurantIcon: (
    <FaMugHot
      className="rounded-lg bg-teal-100 p-2 w-14 h-14"
      color="#4AD991"
    />
  ),
  OrderIcon: (
    <FaMoneyBill
      className="rounded-lg bg-orange-500 bg-opacity-10 p-2 w-14 h-14"
      color="#FFA500"
    />
  ),
  SalesIcon: (
    <FaChartBar
      className="rounded-lg bg-admin_primary bg-opacity-10 p-2 w-14 h-14"
      color="#f2007e"
    />
  ),
};

export default IconMap;

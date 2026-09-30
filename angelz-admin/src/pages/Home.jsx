import React, { useEffect, useState } from "react";
import cards from "../data/LocalDB";
import { CardComponent } from "../component";
import MissionTable from "../component/MissionTable";
import useFetch from "../hooks/useFetch";

const Home = () => {
  const [updatedCards, setUpdatedCards] = useState(cards);
  const [missions, setMissions] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(7);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMissions, setTotalMissions] = useState(0);

  // SORTING STATE (BACKEND)
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState("desc");

  const { data, loading, error, refetch } = useFetch(
    `/admin/dashboard?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`
  );

  // Update dashboard cards + missions
  useEffect(() => {
    if (!data?.data) return;

    const apiData = data.data;

    const mappedCards = cards.map((card) => {
      let amount = 0;
      switch (card.key) {
        case "organizations":
          amount = apiData.totalOrganizations || 0;
          break;
        case "volunteers":
          amount = apiData.totalVolunteers || 0;
          break;
        case "missions":
          amount = apiData.totalMissions || 0;
          break;
        case "feeds":
          amount = apiData.totalFeeds || 0;
          break;
        default:
          amount = 0;
      }
      return { ...card, amount, percentage: 0, text: "" };
    });

    setUpdatedCards(mappedCards);
    setMissions(apiData.missions || []);
    setTotalPages(apiData.pagination?.totalPages || 1);
    setTotalMissions(apiData.pagination?.total || 0);
  }, [data]);

  // Refetch on page / limit / sort change
  useEffect(() => {
    refetch();
  }, [page, limit, sortBy, sortOrder, refetch]);

  if (error) {
    return <div className="text-red-500">Failed to load dashboard</div>;
  }

  return (
    <>
      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {updatedCards.map((card) => (
          <CardComponent
            key={card.id}
            name={card.name}
            amount={card.amount}
            icon={card.icon}
            percentage={card.percentage}
            text={card.text}
          />
        ))}
      </div>

      {/* Missions Table */}
      <div className="grid grid-cols-12 gap-4 mt-6">
        <div className="col-span-12">
          <MissionTable
            data={missions}
            loading={loading}
            page={page}
            totalPages={totalPages}
            total={totalMissions}
            limit={limit}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onPageChange={setPage}
            limitChange={setLimit}
            onSortChange={(key, order) => {
              setSortBy(key);
              setSortOrder(order);
              setPage(1);
            }}
          />
        </div>
      </div>
    </>
  );
};

export default Home;


// import React, { useEffect, useState } from "react";
// import cards from "../data/LocalDB";
// import { CardComponent } from "../component";
// import { DonutChart, SalesChart } from "../component/Chart";
// import RestaurantTable from "../component/RestaurantTable";

// const Home = () => {
//   const [salesData, setSalesData] = useState({ categories: [], values: [] });
//   const [donutData, setDonutData] = useState([]);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     // Example sales data
//     const fetchedSalesData = {
//       categories: [
//         "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"
//       ],
//       values: [120, 200, 150, 80, 70, 110, 120, 200, 150, 80, 70, 110]
//     };
//     setSalesData(fetchedSalesData);

//     // Example donut chart data
//     const fetchedDonutData = [
//       { value: 1048, name: "Organizations" },
//       { value: 735, name: "Volunteers" },
//       { value: 580, name: "Missions" },
//       { value: 484, name: "Feeds" },
//     ];
//     setDonutData(fetchedDonutData);
//   }, []);

//   return (
//     <>
//       {/* Cards */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//         {cards.map((card) => (
//           <CardComponent
//             key={card.id}
//             name={card.name}
//             amount={card.amount}
//             icon={card.icon}
//             percentage={card.percentage}
//             text={card.text}
//           />
//         ))}
//       </div>

//       {/* Charts */}
//       <div className="grid grid-cols-12 gap-4 my-4">
//         <div className="lg:col-span-8 sm:col-span-12 col-span-12">
//           <SalesChart data={salesData} />
//         </div>
//         <div className="lg:col-span-4 sm:col-span-12 col-span-12">
//           <DonutChart data={donutData} />
//         </div>
//       </div>

//       <div className="grid grid-cols-12 gap-4">
//         <div className="col-span-12 mb-4">
//           <RestaurantTable
//             data={[]}  
//             isLoading={loading}
//             onActionCompleted={() => {}}
//           />
//         </div>
//       </div>
//     </>
//   );
// };

// export default Home;

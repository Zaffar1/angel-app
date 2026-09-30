import React from "react";
import cards from "../data/LocalDB";
import useFetch from "../hooks/useFetch";

const Dashboard = () => {
  const { data } = useFetch("/admin/dashboard");

  const updatedCards = cards.map((card) => {
    const api = data?.[card.key] || {};

    return {
      ...card,
      amount: api.count || card.amount,
      percentage: api.percentage || card.percentage,
      text: api.text || card.text,
    };
  });

  return (
    <div>
      {updatedCards.map((item) => (
        <div key={item.id}>
          <item.icon />
          <h3>{item.name}</h3>
          <p>{item.amount}</p>
          <small>{item.text}</small>
        </div>
      ))}
    </div>
  );
};

export default Dashboard;

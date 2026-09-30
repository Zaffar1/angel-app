import React from "react";
import { UserTable } from "../component";
import useFetch from "../hooks/useFetch";
import NewsletterTable from "../component/NewsletterTable";

const Newsletter = () => {
  const { data, loading, error } = useFetch("admin/subscribed-users");
  console.log(data, "user Newsletter");

  return (
    <div>
      <NewsletterTable data={data} loading={loading} />
    </div>
  );
};

export default Newsletter;

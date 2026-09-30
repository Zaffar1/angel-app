import React from "react";
import { BookingTable } from "../component";
import useFetch from "../hooks/useFetch";

const Bookings = () => {
  const { data, loading, error } = useFetch("admin/getBookings"); 
  return (
    <>
       <BookingTable data={data} loading={loading} error={error} />
    </>
  );
};

export default Bookings;

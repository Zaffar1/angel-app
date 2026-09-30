import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Loader from './Loader'

export default function AuthLayout({ children, authentication = false }) {
  const navigate = useNavigate();
  const [loader, setLoader] = useState(true);
  const authStatus = useSelector((state) => state.auth.status);

  useEffect(() => {
    if (authentication && authStatus) {
      navigate("/dashboard", { replace: true });
    } else if (!authentication && !authStatus) {
      navigate("/login", { replace: true });
    }
    setLoader(false);
  }, [authentication, authStatus, navigate]);

  return loader ? <h2 className="text-center "><Loader /></h2> : <>{children}</>;
}

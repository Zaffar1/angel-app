import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { Provider } from "react-redux";
import { store, persistor } from "./store/store.js";
import { PersistGate } from "redux-persist/integration/react";
import BaseRouter from "./router/router.jsx";
import { ToastProvider } from "./component/ToastProvider.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <ToastProvider>
      <BaseRouter />
      </ToastProvider>
    </PersistGate>
  </Provider>
);

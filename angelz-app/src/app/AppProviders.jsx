import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useOnlineStatus } from "../hooks/useNetworkStatus";
import { InternetStatus } from "../components/InternetStatus";
import { useEffect } from "react";

export function AppProviders({ children }) {
    const queryClient = new QueryClient();
    const isOnline = useOnlineStatus();

    useEffect(() => {
        if (isOnline) {
            queryClient.refetchQueries();
        }
    }, [isOnline, queryClient]);

    return (
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <QueryClientProvider client={queryClient}>
                    {!isOnline && <InternetStatus />}
                    {children}
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            success: { duration: 2500 },
                            error: { duration: 3000 },
                        }}
                    />
                </QueryClientProvider>
            </PersistGate>
        </Provider>
    );
}
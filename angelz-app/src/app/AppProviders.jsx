import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useOnlineStatus } from "../hooks/useNetworkStatus";
import { InternetStatus } from "../components/InternetStatus";
import { useEffect, useRef } from "react";

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            staleTime: 30 * 1000,
            retry: 1,
        },
    },
});

export function AppProviders({ children }) {
    const isOnline = useOnlineStatus();
    const wasOffline = useRef(false);

    useEffect(() => {
        if (!isOnline) {
            wasOffline.current = true;
        } else if (wasOffline.current) {
            wasOffline.current = false;
            queryClient.invalidateQueries();
        }
    }, [isOnline]);

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
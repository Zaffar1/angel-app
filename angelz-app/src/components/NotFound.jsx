import { useNavigate } from "react-router-dom";

export default function NotFound({ section }) {
    const navigate = useNavigate();

    const handleRedirect = (path) => navigate(path);

    if (!section) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
                <p className="text-gray-600 mb-4">
                    Sorry, we couldn’t find the page you’re looking for.
                </p>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => handleRedirect("/")}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Go to Home
                    </button>
                    <button
                        onClick={() => handleRedirect("/organization")}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Go to Organization Dashboard
                    </button>
                    <button
                        onClick={() => handleRedirect("/volunteer")}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                        Go to Volunteer Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
            <p className="text-gray-600 mb-4">
                This {section} page doesn’t exist.
            </p>
            <button
                onClick={() => handleRedirect(`/${section}`)}
                className="text-blue-600 hover:underline"
            >
                Go back to {section} dashboard
            </button>
        </div>
    );
}

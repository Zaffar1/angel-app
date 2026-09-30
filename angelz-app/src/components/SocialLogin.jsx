import React from "react";

export default function SocialLogin() {
    const providers = [
        {
            name: "Google",
            icon: "https://img.icons8.com/?size=100&id=JvOSspDsPpwP&format=png&color=000000",
        },
        {
            name: "Apple",
            icon: "https://img.icons8.com/?size=100&id=890&format=png&color=000000",
        },
        {
            name: "Facebook",
            icon: "https://img.icons8.com/?size=100&id=uLWV5A9vXIPu&format=png&color=000000",
        },
    ];
    return (
        <div className="flex justify-center space-x-4 mt-6">
            {providers.map((provider, idx) => (
                <button
                    key={idx}
                    className="border p-2 rounded-lg hover:shadow flex items-center justify-center"
                    onClick={() => alert(`Login with ${provider.name}`)} // 👈 later API call yahan se karna
                >
                    <img src={provider.icon} alt={provider.name} className="h-6 w-6" />
                </button>
            ))}
        </div>
    );
}
import { useState } from "react";

const AvatarCell = ({ PreviewUrl, name }) => {
    const [hasError, setHasError] = useState(false);

    if (!PreviewUrl || hasError) {
        const initial = name ? name.trim().charAt(0).toUpperCase() : "?";
        return (
            <div className="flex items-center justify-center">
                <div className="h-9 w-9 rounded-full bg-gray-200 text-gray-700 font-semibold flex items-center justify-center text-xs border border-gray-300 flex-shrink-0 shadow-sm">
                    {initial}
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center">
            <img
                className="h-9 w-9 rounded-full object-cover border border-gray-200 flex-shrink-0 shadow-sm"
                src={PreviewUrl}
                alt={name || "Avatar"}
                onError={() => setHasError(true)}
            />
        </div>
    )
};

export default AvatarCell
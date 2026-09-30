export function safeParseJson(value, fallback = null) {
    try {
        if (typeof value !== "string") return value;
        const trimmed = value.trim();
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
            return JSON.parse(JSON.parse(trimmed));
        }
        return JSON.parse(trimmed);
    } catch (err) {
        console.warn("Invalid JSON:", value);
        return fallback;
    }
}

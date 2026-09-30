export const stripPhone = (val = "") => val.replace(/\D/g, "");

export const formatUSPhoneNumber = (digits = "") => {
    const cleaned = digits.replace(/\D/g, "");
    const len = cleaned.length;

    if (len === 0) return "";
    if (len < 4) return `(${cleaned}`;
    if (len < 7) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
};

export function cleanUSPhoneNumber(value) {
    if (!value) return "";
    return String(value).replace(/\D/g, "");
}

export function displayUSPhoneNumber(value) {
    if (!value) return "";
    const digits = value.replace(/\D/g, "").slice(0, 10);
    if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return value;
}

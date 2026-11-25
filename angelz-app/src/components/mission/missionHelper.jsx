import useLocale from "../../hooks/useLocale";

const Detail = ({ label, value, isTimeDate = false }) => {
    const { t } = useLocale("mission");
    return (
    <p>
        <span className="font-semibold">{label}:</span>{" "}
        <span className={`text-gray-400 ${isTimeDate ? "" : "capitalize"}`}>
            {value !== null && value !== undefined && value !== "" ? value : t("helper.na")}
        </span>
    </p>
    );
};

const Section = ({ title, children }) => (
    <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <span className="capitalize">{children}</span>
    </div>
);

const StatusTag = ({ label, enabled }) => {
    const { t } = useLocale("mission");
    return (
    <span
        className={`capitalize px-3 py-1 rounded-full ${enabled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
    >
        {t("helper.statusTag", { label, state: enabled ? t("helper.enabled") : t("helper.disabled") })}
    </span>
    );
};


export {
    Detail,
    Section,
    StatusTag
}
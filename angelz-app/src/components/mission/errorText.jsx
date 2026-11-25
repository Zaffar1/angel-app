import useLocale from "../../hooks/useLocale";

const ErrorText = ({ message }) => {
    const { t } = useLocale("mission");
    return (
    <p className="text-center py-10 text-red-500">
        {t("error.loadFailedOne", { message })}
    </p>
    );
};

export { ErrorText }